import { AxiosResponse, HttpStatusCode } from 'axios'
import { DateTime } from 'luxon'

import { DatabasePathName } from 'constants/endpoints'
import { NEW_YORK_TIME_ZONE, UTC_TIME_ZONE } from 'constants/locale'
import LookupSource from 'constants/lookupSources'
import OpenDataService from 'services/openDataService'
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
      statusCode: HttpStatusCode.BadRequest,
      successfulLookup: false,
    }
  }

  let rectifiedPlate = plate

  let allOpenDataResponses: [AxiosResponse[], AxiosResponse[]] | undefined

  const openDataQueryErrorResponse = {
    error:
      'Sorry, there was an error querying open data for ' +
      vehicle.originalString,
    statusCode: HttpStatusCode.BadGateway,
    successfulLookup: false,
  }

  try {
    allOpenDataResponses = await Promise.all([
      OpenDataService.makeOpenDataVehicleRequest(
        plate,
        state,
        plateTypes
      ),
      OpenDataService.makeOpenDataMetadataRequest()
    ])
  } catch (error) {
    return openDataQueryErrorResponse
  }

  const [vehicleDataResponses, metadataResponses] = allOpenDataResponses

  const metadataUpdatedAtValues = metadataResponses.reduce((reducedObject, response) => {
    if (!response.config.url) {
      throw Error('Missing response url')
    }
    const { dataUpdatedAt, dataUri }: { dataUpdatedAt: string, dataUri: string } = response.data
    const databasePathname = `${dataUri}.json` as DatabasePathName
    reducedObject[databasePathname] = DateTime.fromISO(dataUpdatedAt, { zone: 'UTC' }).toISO() as string

    return reducedObject
  }, {} as Record<DatabasePathName, string>)

  const normalizedResponsePromises: Promise<(Violation | undefined)[]>[] =
    vehicleDataResponses.map(async (response) => {
      if (!response.config.url) {
        throw Error('Missing response url')
      }
      const requestUrlObject = new URL(response.config.url)
      const databasePathname = `${requestUrlObject.origin}${requestUrlObject.pathname}` as DatabasePathName
      const dataUpdatedAt = metadataUpdatedAtValues[databasePathname]

      return normalizeViolations(response.data, requestUrlObject.pathname, dataUpdatedAt)
    })

  const normalizedResponses: Array<(Violation | undefined)[]> = await Promise.all(
    normalizedResponsePromises
  )

  // Filter out falsy violations, caused by things like violations in the future
  const flattenedViolations = normalizedResponses.flat()
  const filteredViolations = flattenedViolations.filter((violation): violation is Violation => !!violation)

  let deduplicatedViolations: Violation[] = mergeDuplicateViolations(filteredViolations)

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

  const previousLookupDateInUtc = vehicleLookupAndFrequencyResult.previousLookup
    ? DateTime.fromJSDate(
      vehicleLookupAndFrequencyResult.previousLookup?.createdAt,
      { zone: UTC_TIME_ZONE },
    )
    : undefined

  const previousLookupDateInEastern = previousLookupDateInUtc
    ? previousLookupDateInUtc.setZone(NEW_YORK_TIME_ZONE)
    : undefined

  let uniqueIdentifier: string | undefined
  let lookupDateInUtc: DateTime | undefined
  let returnStatusCode: HttpStatusCode | undefined

  if (lookupSource === LookupSource.ExistingLookup) {
    // In this case, existingIdentifier is definitely defined.
    uniqueIdentifier = existingIdentifier as string

    lookupDateInUtc = DateTime.fromJSDate(
      existingLookupCreatedAt as Date,
      { zone: UTC_TIME_ZONE },
    )

    returnStatusCode = HttpStatusCode.Ok
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

    const newlyCreatedLookup = await createAndInsertNewLookup(
      newLookupProps
    )

    // If we are doing a new lookup, update the identifier
    // to return to the client.
    uniqueIdentifier = newlyCreatedLookup.uniqueIdentifier

    lookupDateInUtc = DateTime.fromJSDate(
      newlyCreatedLookup.createdAt,
      { zone: UTC_TIME_ZONE },
    )

    returnStatusCode = HttpStatusCode.Created
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

  const lookupDateInEastern = (lookupDateInUtc as DateTime).setZone('America/New_York')
  const tweetParts = formPlateLookupTweets(plateLookupTweetArguments)

  const apiLookupResult: ApiLookupResult = {
    cameraStreakData: cameraData,
    fines: aggregateFineData,
    lookupDate:  lookupDateInEastern.toISO(),
    lookupDateEastern: lookupDateInEastern.toISO(),
    lookupDateUtc: lookupDateInUtc.toISO(),
    plate,
    plateTypes,
    previousLookupDate: previousLookupDateInEastern?.toISO(),
    previousLookupDateEastern: previousLookupDateInEastern?.toISO(),
    previousLookupDateUtc: previousLookupDateInUtc?.toISO(),
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
    statusCode: returnStatusCode,
    successfulLookup: true,
    vehicle: apiLookupResult,
  }

  return result
}

export default getAndProcessApiLookup
