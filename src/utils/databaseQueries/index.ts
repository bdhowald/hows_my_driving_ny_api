import * as mysql from 'mysql2/promise'

import { CAMERA_THRESHOLDS } from 'constants/dangerousVehicleAbatementAct'
import LookupSource from 'constants/lookupSources'
import PlateLookup from 'constants/plateLookup'
import { instantiateConnection } from 'services/databaseService'
import CameraData from 'types/cameraData'
import { DatabaseGeocode, GeocodeQueryResult } from 'types/geocoding'
import { PreviousLookupAndFrequency, PreviousLookupResult } from 'types/query'
import { TwitterDatabaseEvent, TwitterMediaObject } from 'types/twitter'
import { camelizeKeys, decamelizeKeys } from 'utils/camelize'

const LOOKUP_SOURCES_THAT_SHOULD_NOT_INCREMENT_FREQUENCY = [
  LookupSource.Api,
  LookupSource.ExistingLookup,
]

const NEW_YORK_GOOGLE_PARAMS = 'New York NY'

export type CreateNewLookupArguments = {
  cameraData: CameraData
  existingIdentifier: string | undefined
  fingerprintId: string | undefined
  lookupSource: LookupSource
  mixpanelId: string | undefined
  numViolations: number
  plate: string
  plateTypes: string[] | undefined
  state: string
}

type ExistingIdentifierQueryResult = {
  createdAt: Date
  plate: number
  plateTypes: string | null
  state: string
}

type FrequencyResult = {
  frequency: number
}

type LookupQueryResults = [
  [FrequencyResult],
  [{ created_at: Date; num_violations: number }] | []
]

type PreviousLookupAndFrequencyQueryArguments = {
  queryArgs: string[]
  queryString: string
}

export type VehicleQueryProps = {
  // identifier of previous query
  existingIdentifier?: string | undefined

  // datetime of previous query
  existingLookupCreatedAt?: Date | undefined

  // lookup source of this query
  lookupSource: LookupSource

  // plate of queried vehicle
  plate: string

  // plate types of queried vehicle
  plateTypes?: string[] | undefined

  // region (e.g. state or province) of queried vehicle
  state: string
}

/**
 * Assemble a new lookup and insert it into our databaes
 *
 * @param {CreateNewLookupArguments} newLookupArguments
 */
export const createAndInsertNewLookup = async (
  newLookupArguments: CreateNewLookupArguments
): Promise<string> => {
  const {
    cameraData,
    existingIdentifier,
    fingerprintId,
    lookupSource,
    mixpanelId,
    numViolations,
    plate,
    plateTypes,
    state,
  } = newLookupArguments

  const uniqueIdentifier =
    existingIdentifier || (await obtainUniqueIdentifier())

  const countTowardsFrequency =
    !LOOKUP_SOURCES_THAT_SHOULD_NOT_INCREMENT_FREQUENCY.includes(lookupSource)

  const bootEligibleUnderRdaaThreshold =
    cameraData.cameraViolations.maxStreak >= CAMERA_THRESHOLDS.cameraViolations

  const bootEligibleUnderDvaaThreshold =
    cameraData.redLightCameraViolations.maxStreak >=
      CAMERA_THRESHOLDS.redLightCameraViolations ||
    cameraData.schoolZoneSpeedCameraViolations?.maxStreak >=
      CAMERA_THRESHOLDS.schoolZoneSpeedCameraViolations

  const newLookup: PlateLookup = {
    bootEligibleUnderRdaaThreshold: bootEligibleUnderRdaaThreshold,
    bootEligibleUnderDvaaThreshold: bootEligibleUnderDvaaThreshold,
    busLaneCameraViolations: cameraData.busLaneCameraViolations.total || 0,
    countTowardsFrequency: !!countTowardsFrequency,
    createdAt: new Date(),
    externalUsername: null,
    fingerprintId,
    lookupSource,
    messageId: null,
    mixpanelId,
    numTickets: numViolations,
    observed: null,
    plate,
    plateTypes: plateTypes ? plateTypes.join() : null,
    respondedTo: true,
    redLightCameraViolations: cameraData?.redLightCameraViolations.total || 0,
    speedCameraViolations:
      cameraData?.schoolZoneSpeedCameraViolations.total || 0,
    state,
    uniqueIdentifier,
  }

  await insertNewLookup(newLookup)

  return uniqueIdentifier
}

/**
 * Reformats a query string from human-readable alignment to eliminate extra spaces.
 *
 * @param queryString query string to reformat
 */
const formatQueryString = (queryString: string): string =>
  queryString.replace(/\s{2,},/g, ',').replace(/\s{2,}/g, ' ')


/**
 * Query the database for a previously-saved geocode
 *
 * @param streetAddress - the address field of the geocode we are looking for
 */
export const getBoroughFromDatabaseGeocode = async (
  streetAddress: string
): Promise<GeocodeQueryResult[]> => {
  const databaseConnection = await instantiateConnection()

  const valuesString = [`${streetAddress} ${NEW_YORK_GOOGLE_PARAMS}`]
  const geocodeSQLString =
    'select borough from geocodes WHERE lookup_string = ?'

  try {
    const result = await databaseConnection.query(geocodeSQLString, valuesString)
    const rows = result[0] as GeocodeQueryResult[]

    return rows
  } catch(error) {
    console.log(error)
    throw error
  } finally {
    databaseConnection.release()
  }
}


/**
 * Get arguments to query the database for previous lookups for this vehicle
 *
 * @param {VehicleQueryProps} vehicleQueryProps - props containing all arguments for the search query
 *
 * @returns {PreviousLookupAndFrequencyQueryArguments}
 */
const getPreviousLookupAndFrequencyQueryArguments = (
  vehicleQueryProps: VehicleQueryProps
): PreviousLookupAndFrequencyQueryArguments => {
  const {
    existingIdentifier,
    existingLookupCreatedAt,
    lookupSource,
    plate,
    plateTypes,
    state,
  } = vehicleQueryProps

  // Get the number of times this vehicle has been queried for
  // in the past, but only consider countable queries.
  let frequencyQueryString =
    'select count(*) as frequency from plate_lookups where ' +
    'plate = ? and state = ? and count_towards_frequency = 1'

  // Get the number of violations the last time we queried this vehicle.
  let numViolationsForMostRecentLookupQueryString =
    'select num_tickets as num_violations, created_at from plate_lookups ' +
    'where plate = ? and state = ? and count_towards_frequency = 1'

  let frequencyQueryArgs = [plate, state]
  let numViolationsForMostRecentLookupQueryArgs = [plate, state]

  if (plateTypes) {
    frequencyQueryString += ' and plate_types = ?'
    frequencyQueryArgs = [...frequencyQueryArgs, plateTypes.join()]

    numViolationsForMostRecentLookupQueryString += ' and plate_types = ?'
    numViolationsForMostRecentLookupQueryArgs = [
      ...numViolationsForMostRecentLookupQueryArgs,
      plateTypes.join()
    ]
  } else {
    frequencyQueryString += ' and plate_types is null'
    numViolationsForMostRecentLookupQueryString += ' and plate_types is null'
  }

  if (
    lookupSource === LookupSource.ExistingLookup &&
    existingIdentifier &&
    existingLookupCreatedAt
  ) {
    frequencyQueryString += ' and created_at <= ?'
    frequencyQueryArgs = [
      ...frequencyQueryArgs,
      existingLookupCreatedAt.toISOString(),
    ]

    numViolationsForMostRecentLookupQueryString +=
      ' and unique_identifier <> ? and created_at < ?'

    numViolationsForMostRecentLookupQueryArgs = [
      ...numViolationsForMostRecentLookupQueryArgs,
      existingIdentifier,
      existingLookupCreatedAt.toISOString(),
    ]
  }

  numViolationsForMostRecentLookupQueryString += ' ORDER BY created_at DESC LIMIT 1'

  const searchQueryArgs = [
    ...frequencyQueryArgs,
    ...numViolationsForMostRecentLookupQueryArgs,
  ]
  const searchQueryString = `${frequencyQueryString}; ${numViolationsForMostRecentLookupQueryString};`

  return {
    queryArgs: searchQueryArgs,
    queryString: searchQueryString,
  }
}

/**
 * Get the previous time this plate was queried, relative to the datetime
 * an existing lookup was performed, if passed in
 *
 * @param vehicleQueryProps - props containing all arguments for the search query
 */
export const getPreviousLookupAndLookupFrequencyForVehicle = async (
  vehicleQueryProps: VehicleQueryProps
): Promise<PreviousLookupAndFrequency> => {
  const { lookupSource } = vehicleQueryProps

  const previousLookupAndFrequencyArguments: PreviousLookupAndFrequencyQueryArguments =
    getPreviousLookupAndFrequencyQueryArguments(vehicleQueryProps)

  const databaseConnection = await instantiateConnection()

  try {
    const result = await databaseConnection.query(
      previousLookupAndFrequencyArguments.queryString,
      previousLookupAndFrequencyArguments.queryArgs,
    )

    const rows = result[0] as LookupQueryResults

    const countTowardsFrequency =
      !LOOKUP_SOURCES_THAT_SHOULD_NOT_INCREMENT_FREQUENCY.includes(lookupSource)
    let frequency = countTowardsFrequency ? 1 : 0

    const frequencyResult = rows?.[0]?.[0]
    const previousLookupResult = rows?.[1]?.[0]
      ? (camelizeKeys(rows[1][0]) as PreviousLookupResult)
      : undefined

    return {
      frequency: frequencyResult.frequency + frequency,
      previousLookup: previousLookupResult,
    }
  } catch(error) {
    console.log(error)
    throw error
  } finally {
    databaseConnection.release()
  }
}

/**
 * Query database for previous lookup
 *
 * @param {string} identifier - unique identifier of previous query
 * @returns
 */
export const getExistingLookupResult = async (
  identifier: string
): Promise<ExistingIdentifierQueryResult | null> => {
    const databaseConnection = await instantiateConnection()

    const queryString = formatQueryString(
      'select plate' +
        '     , state' +
        '     , plate_types' +
        '     , created_at' +
        '  from plate_lookups' +
        ' where unique_identifier = ?'
    )

    const queryArgs = [identifier]

    try {
      const result = await databaseConnection.query(queryString, queryArgs)
      const rows = result[0] as ExistingIdentifierQueryResult[]

      const previousQueryResult = rows.length
        ? (camelizeKeys(rows[0]) as ExistingIdentifierQueryResult)
        : null

      return previousQueryResult
    } catch(error) {
      console.log(error)
      throw error
    } finally {
      databaseConnection.release()
    }
  }


/**
 * Insert a geocode into the database after querying for it
 *
 * @param geocode - street address, borough, and geocoding service to insert into database
 */
export const insertGeocodeIntoDatabase = async (
  geocode: DatabaseGeocode
) => {
  const databaseConnection = await instantiateConnection()

  try {
    await databaseConnection.query('insert into geocodes set ?', geocode)

    return true
  } catch(error) {
    console.log(error)
    throw error
  } finally {
    databaseConnection.release()
  }
}

/**
 * Insert a new plate lookup into our database
 *
 * @param newLookup - the plate lookup to be inserted into our database
 */
const insertNewLookup = async (newLookup: PlateLookup) => {
  const databaseConnection = await instantiateConnection()

  const queryString = 'insert into plate_lookups set ?'
  const decamelizedLookup = decamelizeKeys(newLookup)

  try {
    await databaseConnection.query(queryString, decamelizedLookup)

    return true
  } catch(error) {
    console.log(error)
    throw error
  } finally {
    databaseConnection.release()
  }
}

/**
 * Insert a new twitter event into our database
 *
 * @param {TwitterDatabaseEvent} newTwitterEvent - the twitter event to be inserted into our database
 * @param {TwitterMediaObject} mediaObjects      - the media objects belonging to the twitter event
 * @returns {Promise<boolean>}
 */
export const insertNewTwitterEventAndMediaObjects = async (
  newTwitterEvent: TwitterDatabaseEvent,
  mediaObjects?: TwitterMediaObject[] | undefined
): Promise<boolean> => {
  const databaseConnection = await instantiateConnection()

  const twitterEventQueryString = 'insert into twitter_events set ?'
  const decamelizedTwitterEvent = decamelizeKeys(newTwitterEvent)

  try {
    const insertTwitterEventResponse = await databaseConnection.query(
      twitterEventQueryString,
      decamelizedTwitterEvent,
    )
    const insertTwitterEventResult = insertTwitterEventResponse[0] as mysql.ResultSetHeader

    if (!mediaObjects?.length) {
      return !!insertTwitterEventResult
    }

    const insertId = insertTwitterEventResult.insertId

    const twitterMediaObjectQueryString =
        'insert into twitter_media_objects set ?'

    console.log(insertTwitterEventResult)

    const decamelizedTwitterMediaObjects = mediaObjects.map((mediaObject) => {
      const mediaObjectWithEventId = {
        ...mediaObject,
        ...{ twitterEventId: insertId },
      }
      return decamelizeKeys(mediaObjectWithEventId)
    })

    const insertTwitterMediaObjectsResponse = await databaseConnection.query(
      twitterMediaObjectQueryString,
      decamelizedTwitterMediaObjects,
    )
    console.log(twitterMediaObjectQueryString)
    console.log(decamelizedTwitterMediaObjects)

    const insertTwitterMediaObjectsResult = insertTwitterMediaObjectsResponse[0] as mysql.ResultSetHeader

    databaseConnection.release()

    return (!!insertTwitterMediaObjectsResult)
  } catch(error) {
    console.log(error)
    throw error
  } finally {
    databaseConnection.release()
  }
}

/**
 * Returns a unique string identifier for the lookup
 *
 * @returns {Promise<string>}
 */
const obtainUniqueIdentifier = async (): Promise<string> => {
  const identifierAlreadyExists = async (
    identifier: string
  ): Promise<boolean> => {
    const databaseConnection = await instantiateConnection()

    const queryString =
      'select count(*) as count from plate_lookups where unique_identifier = ?'
    const queryArgs = [identifier]

    try {
      const result = await databaseConnection.query(queryString, queryArgs)
      const rows = result[0] as [{ count: number}]

      return rows[0].count !== 0
    } catch(error) {
      console.log(error)
      throw error
    } finally {
      databaseConnection.release()
    }
  }

  const calculateUniqueIdentifier = () =>
    Math.random().toString(36).substring(2, 10)
  let uniqueIdentifier = calculateUniqueIdentifier()

  while (
    await identifierAlreadyExists(uniqueIdentifier).catch((error) => {
      throw error
    })
  ) {
    uniqueIdentifier = calculateUniqueIdentifier()
  }

  return uniqueIdentifier
}

/**
 * Update non-follower reply so that it will be replied to
 *
 * @param {BigInt | undefined} favoritedStatusId - id of the status that was liked
 * @param {BigInt} userId                        - id of the user who liked the status
 */
export const updateNonFollowerReplies = async (
  userId: BigInt,
  favoritedStatusId?: BigInt
) => {
  const databaseConnection = await instantiateConnection()

  const baseQueryString = formatQueryString(
    'select CAST(' +
      '                in_reply_to_message_id as CHAR(20)' +
      '           ) as in_reply_to_message_id ' +
      '  from non_follower_replies ' +
      ' where user_id = ?' +
      '   and favorited = false'
  )

  const selectQueryString = favoritedStatusId
    ? baseQueryString + ' and event_id = ?;'
    : baseQueryString + ';'

  const selectQueryArgs = favoritedStatusId
    ? [userId, favoritedStatusId]
    : [userId]

  try {
    const result = await databaseConnection.query(selectQueryString, selectQueryArgs)

    const rows = result[0] as { in_reply_to_message_id: BigInt }[]

    rows.forEach(async (updatedEvent) => {
      const inReplyToMessageId = updatedEvent.in_reply_to_message_id

      const baseUpdateNonFollowerRepliesQueryString = formatQueryString(
        'update non_follower_replies' +
        '   set favorited = true' +
        ' where user_id = ?'
      )

      const updateNonFollowerRepliesQueryString = favoritedStatusId
        ? baseUpdateNonFollowerRepliesQueryString + ' and event_id = ?;'
        : baseUpdateNonFollowerRepliesQueryString + ';'

      const updateTwitterEventsQueryString = formatQueryString(
        'update twitter_events' +
        '   set user_favorited_non_follower_reply = true' +
        '     , responded_to = false' +
        ' where is_duplicate = false' +
        '   and event_id = ?;'
      )

      const updateQueryString = `${updateNonFollowerRepliesQueryString} ${updateTwitterEventsQueryString}`

      const updateQueryArgs = favoritedStatusId
        ? [userId, favoritedStatusId, inReplyToMessageId]
        : [userId, inReplyToMessageId]

      await databaseConnection.query(updateQueryString, updateQueryArgs)
    })

    return true
  } catch(error) {
    console.log(error)
    throw error
  } finally {
    databaseConnection.release()
  }
}
