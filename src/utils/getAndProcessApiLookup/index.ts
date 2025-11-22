import { AxiosResponse, HttpStatusCode } from 'axios'
import { DateTime } from 'luxon'

import { ViolationDatabasePathname } from 'constants/endpoints'
import { NEW_YORK_TIME_ZONE, UTC_TIME_ZONE } from 'constants/locale'
import LookupSource from 'constants/lookupSources'
import LookupType from 'constants/lookupTypes'
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
import getMixpanelInstance from 'utils/tracking/mixpanel/mixpanel'
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
  const lookupType: LookupType = externalData.lookupType
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
  let normalizedResponses: Array<(Violation | undefined)[]>

  const openDataQueryErrorPartialResponse = {
    statusCode: HttpStatusCode.BadGateway,
    successfulLookup: false,
  }

  const mixpanelPartialPayload = {
    fingerprintId,
    mixpanelId,
    ...(existingIdentifier ? { existingIdentifier } : undefined),
    ...(plate ? { plate } : undefined ),
    ...(plateTypes ? { plateTypes } : undefined ),
    ...(rectifiedPlate ? { rectifiedPlate } : undefined ),
    ...(state ? { state } : undefined ),
  }

  try {
    allOpenDataResponses = await Promise.all([
      OpenDataService.makeOpenDataVehicleRequest({
        plate,
        state,
        plateTypes,
        lookupType,
      }),
      OpenDataService.makeOpenDataMetadataRequest(lookupType)
    ])
  } catch (error: unknown) {
    const mixpanelInstance = getMixpanelInstance()
    mixpanelInstance?.track('open_data_query_error', {
      ...mixpanelPartialPayload,
      ...getMixpanelErrorPayload(error)
    })

    return {
      ...openDataQueryErrorPartialResponse,
      error:
        'Sorry, there was an error querying open data for ' +
        vehicle.originalString,
    }
  }

  const [vehicleDataResponses, metadataResponses] = allOpenDataResponses

  try {
    const metadataUpdatedAtValues = metadataResponses.reduce((reducedObject, response) => {
      if (!response.config.url) {
        throw Error('Missing response url')
      }
      const { dataUpdatedAt, dataUri }: { dataUpdatedAt: string, dataUri: string } = response.data
      const databasePathname = `${dataUri}.json` as ViolationDatabasePathname
      reducedObject[databasePathname] = DateTime.fromISO(dataUpdatedAt, { zone: 'UTC' }).toISO() as string

      return reducedObject
    }, {} as Record<ViolationDatabasePathname, string>)

    const normalizedResponsePromises: Promise<(Violation | undefined)[]>[] =
      vehicleDataResponses.map(async (response) => {
        if (!response.config.url) {
          throw Error('Missing response url')
        }
        const requestUrlObject = new URL(response.config.url)
        const databasePathname = `${requestUrlObject.origin}${requestUrlObject.pathname}` as ViolationDatabasePathname

        // We need the v2 endpoints because the v3 endpoints require auth, which clients won't be able to offer automatically.
        const v2DatabasePathname = OpenDataService.getV2EndpointForDatabaseFromV3Endpoint(databasePathname) as ViolationDatabasePathname

        const dataUpdatedAt = metadataUpdatedAtValues[v2DatabasePathname]

        return normalizeViolations(response.data, requestUrlObject.pathname, dataUpdatedAt)
      })

    normalizedResponses = await Promise.all(
      normalizedResponsePromises
    )
  } catch (error: unknown) {
    const mixpanelInstance = getMixpanelInstance()
    mixpanelInstance?.track('open_data_parsing_error', {
      ...mixpanelPartialPayload,
      ...getMixpanelErrorPayload(error)
    })

    return {
      ...openDataQueryErrorPartialResponse,
      error:
        'Sorry, there was an error parsing open data for ' +
        vehicle.originalString,
    }
  }

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

const getMixpanelErrorPayload = (error: unknown): Record<string, any> => {
  const wrappedError =
    error instanceof Error
      ? error
      : new Error(
          typeof error === 'string' ? error : JSON.stringify(error),
        )

  return {
    message: wrappedError.message,
    raw: String(error),
    stack: wrappedError.stack,
  }
}

export default getAndProcessApiLookup
