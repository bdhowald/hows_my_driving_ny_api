import { FieldInfo, MysqlError } from 'mysql'

import { CAMERA_THRESHOLDS } from 'constants/dangerousVehicleAbatementAct'
import LookupSource from 'constants/lookupSources'
import PlateLookup from 'constants/plateLookup'
import {
  closeConnectionHandler,
  instantiateConnection,
} from 'services/databaseService'
import CameraData from 'types/cameraData'
import { PreviousLookupAndFrequency, PreviousLookupResult } from 'types/query'
import { TwitterDatabaseEvent, TwitterMediaObject } from 'types/twitter'
import { camelizeKeys, decamelizeKeys } from 'utils/camelize'

const LOOKUP_SOURCES_THAT_SHOULD_NOT_INCREMENT_FREQUENCY = [LookupSource.Api]

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

  insertNewLookup(newLookup)

  return uniqueIdentifier
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

  let baseFrequencyQueryString =
    'select count(*) as frequency from plate_lookups where ' +
    'plate = ? and state = ? and count_towards_frequency = 1'

  let baseNumTicketsQueryString =
    'select num_tickets as num_violations, created_at from plate_lookups ' +
    'where plate = ? and state = ? and count_towards_frequency = 1'

  let baseFrequencyQueryArgs = [plate, state]
  let baseNumTicketsQueryArgs = [plate, state]

  if (plateTypes) {
    baseFrequencyQueryString += ' and plate_types = ?'
    baseFrequencyQueryArgs = [...baseFrequencyQueryArgs, plateTypes.join()]

    baseNumTicketsQueryString += ' and plate_types = ?'
    baseNumTicketsQueryArgs = [...baseNumTicketsQueryArgs, plateTypes.join()]
  }

  if (
    lookupSource === LookupSource.ExistingLookup &&
    existingIdentifier &&
    existingLookupCreatedAt
  ) {
    baseFrequencyQueryString += ' and unique_identifier <> ? and created_at < ?'
    baseFrequencyQueryArgs = [
      ...baseFrequencyQueryArgs,
      existingIdentifier,
      existingLookupCreatedAt.toISOString(),
    ]

    baseNumTicketsQueryString +=
      ' and unique_identifier <> ? and created_at < ?'

    baseNumTicketsQueryArgs = [
      ...baseFrequencyQueryArgs,
      existingIdentifier,
      existingLookupCreatedAt.toISOString(),
    ]
  }

  baseNumTicketsQueryString += ' ORDER BY created_at DESC LIMIT 1'

  const searchQueryArgs = [
    ...baseFrequencyQueryArgs,
    ...baseNumTicketsQueryArgs,
  ]
  const searchQueryString = `${baseFrequencyQueryString}; ${baseNumTicketsQueryString};`

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

  const callback = (results: LookupQueryResults) => {
    const countTowardsFrequency =
      !LOOKUP_SOURCES_THAT_SHOULD_NOT_INCREMENT_FREQUENCY.includes(lookupSource)
    let frequency = countTowardsFrequency ? 1 : 0

    const frequencyResult = results?.[0]?.[0]
    const previousLookupResult = results?.[1]?.[0]
      ? (camelizeKeys(results[1][0]) as PreviousLookupResult)
      : undefined

    return {
      frequency: frequencyResult.frequency + frequency,
      previousLookup: previousLookupResult,
    }
  }

  return new Promise((resolve, reject) => {
    const databaseConnection = instantiateConnection()

    databaseConnection.query(
      previousLookupAndFrequencyArguments.queryString,
      previousLookupAndFrequencyArguments.queryArgs,
      (
        error: MysqlError | null,
        results: LookupQueryResults,
        _?: FieldInfo[]
      ) => {
        // Close database connection
        databaseConnection.end(closeConnectionHandler)

        if (error) {
          console.error(error)
          reject(error)
        }
        if (results) {
          return resolve(callback(results))
        }
      }
    )
  })
}

/**
 * Query database for previous lookup
 *
 * @param {string} identifier - unique identifier of previous query
 * @returns
 */
export const getPreviousLookupResult = async (
  identifier: string
): Promise<ExistingIdentifierQueryResult | null> =>
  new Promise((resolve, reject) => {
    const databaseConnection = instantiateConnection()

    const queryString = (
      'select plate' +
      '     , state' +
      '     , plate_types' +
      '     , created_at' +
      '  from plate_lookups' +
      ' where unique_identifier = ?'
    ).replace(/\s{2,}/g, '')

    const queryArgs = [identifier]

    const callback = (
      error: MysqlError | null,
      results: {
        created_at: Date
        plate: number
        plate_types: string
        state: string
      }[],
      _?: FieldInfo[]
    ) => {
      // Close database connection
      databaseConnection.end(closeConnectionHandler)

      if (error) {
        console.error(error)
        reject(error)
      }

      const previousQueryResult = results.length
        ? (camelizeKeys(results[0]) as ExistingIdentifierQueryResult)
        : null

      return resolve(previousQueryResult)
    }

    databaseConnection.query(queryString, queryArgs, callback)
  })

/**
 * Insert a new plate lookup into our database
 *
 * @param {PlateLookup} newLookup - the plate lookup to be inserted into our database
 */
const insertNewLookup = (newLookup: PlateLookup) => {
  const databaseConnection = instantiateConnection()

  const queryString = 'insert into plate_lookups set ?'
  const decamelizedLookup = decamelizeKeys(newLookup)

  const callback = (error: MysqlError | null) => {
    if (error) {
      console.error(error)
      throw error
    }
  }

  databaseConnection.query(queryString, decamelizedLookup, callback)
}

/**
 * Insert a new twitter event into our database
 *
 * @param {TwitterDatabaseEvent} newTwitterEvent - the twitter event to be inserted into our database
 * @param {TwitterMediaObject} mediaObjects      - the media objects belonging to the twitter event
 * @returns {Promise<boolean>}
 */
export const insertNewTwitterEventAndMediaObjects = (
  newTwitterEvent: TwitterDatabaseEvent,
  mediaObjects?: TwitterMediaObject[] | undefined
): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const databaseConnection = instantiateConnection()

    const twitterEventQueryString = 'insert into twitter_events set ?'
    const decamelizedTwitterEvent = decamelizeKeys(newTwitterEvent)

    const outerCallback = (error: MysqlError | null, results: any) => {
      // Close database connection
      databaseConnection.end(closeConnectionHandler)

      if (error) {
        console.error(error)
        reject(error)
      }

      if (!mediaObjects) {
        return resolve(!!results)
      }

      const insertId = results.insertId

      const twitterMediaObjectQueryString =
        'insert into twitter_media_objects set ?'

      const decamelizedTwitterMediaObjects = mediaObjects.map((mediaObject) => {
        const mediaObjectWithEventId = {
          ...mediaObject,
          ...{ twitterEventId: insertId },
        }
        return decamelizeKeys(mediaObjectWithEventId)
      })

      const newDatabaseConnection = instantiateConnection()

      const innerCallback = (error: MysqlError | null, results: any) => {
        // Close database connection
        newDatabaseConnection.end(closeConnectionHandler)

        if (error) {
          console.error(error)
          reject(error)
        }

        return resolve(!!results)
      }

      newDatabaseConnection.query(
        twitterMediaObjectQueryString,
        decamelizedTwitterMediaObjects,
        innerCallback
      )
    }

    databaseConnection.query(
      twitterEventQueryString,
      decamelizedTwitterEvent,
      outerCallback
    )
  })

/**
 * Returns a unique string identifier for the lookup
 *
 * @returns {Promise<string>}
 */
const obtainUniqueIdentifier = async (): Promise<string> => {
  const identifierAlreadyExists = async (
    identifier: string
  ): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const databaseConnection = instantiateConnection()

      const queryString =
        'select count(*) as count from plate_lookups where unique_identifier = ?'
      const queryArgs = [identifier]

      const callback = (
        error: MysqlError | null,
        results: [{ count: number }],
        _?: FieldInfo[]
      ) => {
        // Close database connection
        databaseConnection.end(closeConnectionHandler)

        if (error) {
          console.error(error)
          reject(error)
        }

        return resolve(results[0].count !== 0)
      }

      databaseConnection.query(queryString, queryArgs, callback)
    })

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
) =>
  new Promise((resolve, reject) => {
    const databaseConnection = instantiateConnection()

    const baseQueryString = (
      'select CAST(' +
      '                in_reply_to_message_id as CHAR(20)' +
      '           ) as in_reply_to_message_id ' +
      '  from non_follower_replies ' +
      ' where user_id = ?' +
      '   and favorited = false'
    ).replace(/\s{2,}/g, ' ')

    const selectQueryString = favoritedStatusId
      ? baseQueryString + ' and event_id = ?;'
      : baseQueryString + ';'

    const selectQueryArgs = favoritedStatusId
      ? [userId, favoritedStatusId]
      : [userId]

    const outerCallback = (
      error: MysqlError | null,
      results: { in_reply_to_message_id: BigInt }[]
    ) => {
      // Close database connection
      databaseConnection.end(closeConnectionHandler)

      if (error) {
        console.error(error)
        reject(error)
      }

      if (results.length) {
        results.forEach((updatedEvent) => {
          const inReplyToMessageId = updatedEvent.in_reply_to_message_id

          const baseUpdateNonFollowerRepliesQueryString = (
            'update non_follower_replies' +
            '   set favorited = true' +
            ' where user_id = ?'
          ).replace(/\s{2,}/g, ' ')

          const updateNonFollowerRepliesQueryString = favoritedStatusId
            ? baseUpdateNonFollowerRepliesQueryString + ' and event_id = ?;'
            : baseUpdateNonFollowerRepliesQueryString + ';'

          const updateTwitterEventsQueryString = (
            'update twitter_events' +
            '   set user_favorited_non_follower_reply = true' +
            '     , responded_to = false' +
            ' where is_duplicate = false' +
            '   and event_id = ?;'
          ).replace(/\s{2,}/g, ' ')

          const updateQueryString = `${updateNonFollowerRepliesQueryString} ${updateTwitterEventsQueryString}`

          const updateQueryArgs = favoritedStatusId
            ? [userId, favoritedStatusId, inReplyToMessageId]
            : [userId, inReplyToMessageId]

          const newDatabaseConnection = instantiateConnection()

          const innerCallback = (error: MysqlError | null, results: any) => {
            // Close database connection
            newDatabaseConnection.end(closeConnectionHandler)

            if (error) {
              console.error(error)
              reject(error)
            }

            return resolve(true)
          }

          databaseConnection.query(
            updateQueryString,
            updateQueryArgs,
            innerCallback
          )
        })
      }
    }

    databaseConnection.query(selectQueryString, selectQueryArgs, outerCallback)
  })
