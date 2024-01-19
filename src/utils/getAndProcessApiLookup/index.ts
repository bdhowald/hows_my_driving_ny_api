import { AxiosResponse, HttpStatusCode } from 'axios'
import { DateTime } from 'luxon'

import LookupSource from 'constants/lookupSources'
import makeOpenDataVehicleRequest from 'services/openDataService'
import ApiLookupResult from 'types/apiLookup'
import CameraData from 'types/cameraData'
import { PreviousLookupAndFrequency } from 'types/query'
import { ExternalData, VehicleResponse } from 'types/request'
import { PotentialVehicle } from 'types/vehicles'
import { Violation } from 'types/violations'
import {
  createAndInsertNewLookup,
  CreateNewLookupArguments,
  getPreviousLookupAndLookupFrequencyForVehicle,
  VehicleQueryProps,
} from 'utils/databaseQueries'
import getAggregateFineData from 'utils/getAggregateFineData'
import getAggregateFrequencyData from 'utils/getAggregateFrequencyData'
import getCameraData from 'utils/getCameraData'
import mergeDuplicateViolations from 'utils/mergeDuplicateViolations'
import normalizeViolations from 'utils/normalizeViolations'
import formPlateLookupTweets, { PlateLookupTweetArguments } from 'utils/twitter'

/**
 * Filter out violations that occured after a datetime
 *
 * @param   violations              - all violations belonging to a vehicle
 * @param   existingLookupCreatedAt - string representing the last time vehicle was queried
 */
const filterOutViolationsAfterSearchDate = (
  violations: Violation[],
  existingLookupCreatedAt: Date
): Violation[] =>
  violations.filter(
    (violation) =>
      !violation.formattedTimeUtc ||
      DateTime.fromISO(violation.formattedTimeUtc) <=
        DateTime.fromJSDate(existingLookupCreatedAt)
  )

const getAndProcessApiLookup = async (
  vehicle: PotentialVehicle,
  // TODO: Implement filtering by selected fields
  _: any,
  externalData: ExternalData
): Promise<VehicleResponse> => {
  const plate = vehicle.plate
  const state = vehicle.state
  const plateTypes = vehicle.types
    ? vehicle.types.split(',').map((part) => part.trim())
    : undefined

  const lookupSource: LookupSource = externalData.lookupSource
  const fingerprintId = externalData.fingerprintId
  const mixpanelId = externalData.mixpanelId
  const existingIdentifier =
    externalData.lookupSource === LookupSource.ExistingLookup
      ? externalData.uniqueIdentifier
      : undefined
  const existingLookupCreatedAt = externalData.existingLookupCreatedAt

  if (!plate || !state) {
    return {
      error:
        'Sorry, a plate and state could not be inferred from ' +
        vehicle.originalString,
      successfulLookup: false,
    }
  }

  let rectifiedPlate = plate

  let endpointResponses: AxiosResponse[] | undefined

  const openDataQueryErrorResponse = {
    error:
      'Sorry, there was an error querying open data for ' +
      vehicle.originalString,
    successfulLookup: false,
  }

  try {
    endpointResponses = await makeOpenDataVehicleRequest(
      plate,
      state,
      plateTypes
    )

  } catch (error) {
    return openDataQueryErrorResponse
  }

  const normalizedResponsePromises: Promise<Violation[]>[] =
    endpointResponses.map(async (response) => {
      if (!response.config.url) {
        throw Error('Missing response url')
      }
      const requestUrlObject = new URL(response.config.url)
      return normalizeViolations(response.data, requestUrlObject.pathname)
    })

  const normalizedResponses: Violation[][] = await Promise.all(
    normalizedResponsePromises
  )

  const flattenedViolations = normalizedResponses.flat()

  let deduplicatedViolations = mergeDuplicateViolations(flattenedViolations)

  if (existingLookupCreatedAt) {
    deduplicatedViolations = filterOutViolationsAfterSearchDate(
      deduplicatedViolations,
      existingLookupCreatedAt
    )
  }

  // If the plate was modified, let's get what it was modified to.
  // e.g. a medallion plates
  if (deduplicatedViolations.length) {
    rectifiedPlate = deduplicatedViolations[0].plateId
  }

  const aggregateFineData = getAggregateFineData(deduplicatedViolations)
  const cameraData: CameraData = getCameraData(deduplicatedViolations)
  const frequencyData = getAggregateFrequencyData(deduplicatedViolations)

  const vehicleQueryProps: VehicleQueryProps = {
    existingIdentifier,
    existingLookupCreatedAt,
    lookupSource,
    plate,
    plateTypes,
    state,
  }

  const vehicleLookupAndFrequencyResult: PreviousLookupAndFrequency =
    await getPreviousLookupAndLookupFrequencyForVehicle(vehicleQueryProps)

  let uniqueIdentifier: string | undefined

  if (lookupSource === LookupSource.ExistingLookup) {
    // In this case, existingIdentifier is definitely defined.
    uniqueIdentifier = existingIdentifier as string
  } else {
    const newLookupProps: CreateNewLookupArguments = {
      cameraData,
      existingIdentifier,
      fingerprintId,
      lookupSource,
      mixpanelId,
      numViolations: deduplicatedViolations.length,
      plate,
      plateTypes,
      state,
    }

    const uniqueIdentifierOfNewLookup = await createAndInsertNewLookup(
      newLookupProps
    )

    // If we are doing a new lookup, update the identifier
    // to return to the client.
    uniqueIdentifier = uniqueIdentifierOfNewLookup
  }

  const plateLookupTweetArguments: PlateLookupTweetArguments = {
    cameraData,
    existingLookupCreatedAt,
    fineData: aggregateFineData,
    frequencyData,
    lookupFrequency: vehicleLookupAndFrequencyResult.frequency,
    plate: plate,
    plateTypes: plateTypes?.join(','),
    previousLookup: vehicleLookupAndFrequencyResult.previousLookup,
    state,
    uniqueIdentifier,
  }

  const tweetParts = formPlateLookupTweets(plateLookupTweetArguments)

  const apiLookupResult: ApiLookupResult = {
    cameraStreakData: cameraData,
    fines: aggregateFineData,
    plate,
    plateTypes,
    previousLookupDate:
      vehicleLookupAndFrequencyResult.previousLookup?.createdAt,
    previousViolationCount:
      vehicleLookupAndFrequencyResult.previousLookup?.numViolations,
    rectifiedPlate,
    statistics: frequencyData,
    state,
    timesQueried: vehicleLookupAndFrequencyResult.frequency,
    tweetParts: tweetParts?.flat(),
    uniqueIdentifier,
    violations: deduplicatedViolations,
    violationsCount: deduplicatedViolations.length,
  }

  const result: VehicleResponse = {
    successfulLookup: true,
    vehicle: apiLookupResult,
  }

  return result
}

export default getAndProcessApiLookup
