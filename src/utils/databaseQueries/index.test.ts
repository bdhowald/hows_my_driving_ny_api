import { decamelizeKeys } from 'humps'
import { DateTime } from 'luxon'

import LookupSource from 'constants/lookupSources'
import PlateLookup from 'constants/plateLookup'
import { TwitterDatabaseEvent, TwitterMediaObject } from 'types/twitter'
import { instantiateConnection } from 'services/databaseService'

import {
  createAndInsertNewLookup,
  CreateNewLookupArguments,
  getPreviousLookupAndLookupFrequencyForVehicle,
  getPreviousLookupResult,
  insertNewTwitterEventAndMediaObjects,
  updateNonFollowerReplies,
  VehicleQueryProps,
} from '.'

jest.mock('services/databaseService')

describe('databaseQueries', () => {
  const plate = 'ABC1234'
  const state = 'NY'

  const nonEmptyPlateTypes = [
    'AGR',
    'ARG',
    'AYG',
    'BOB',
    'CMH',
    'FPW',
    'GSM',
    'HAM',
    'HIS',
    'JWV',
    'MCL',
    'NLM',
    'ORG',
    'PAS',
    'PHS',
    'PPH',
    'RGL',
    'SOS',
    'SPO',
    'SRF',
    'WUG',
  ]

  const date = new Date(2021, 1, 1, 12, 0, 0)

  describe('createAndInsertNewLookup', () => {
    const newUniqueIdentifier = 'a1b2c3d4'

    const createNewLookupArguments: CreateNewLookupArguments = {
      cameraData: {
        busLaneCameraViolations: {
          maxStreak: 1,
          streakEnd: '2023-01-15T00:00:00.000-05:00',
          streakStart: '2023-01-15T00:00:00.000-05:00',
          total: 1,
        },
        cameraViolations: {
          maxStreak: 2,
          streakEnd: '2023-02-15T00:00:00.000-05:00',
          streakStart: '2023-03-15T00:00:00.000-04:00',
          total: 4,
        },
        cameraViolationsWithBusLaneCameraViolations: {
          maxStreak: 3,
          streakEnd: '2023-01-15T00:00:00.000-05:00',
          streakStart: '2023-03-15T00:00:00.000-04:00',
          total: 5,
        },
        redLightCameraViolations: {
          maxStreak: 1,
          streakEnd: '2021-01-01T00:00:00.000-05:00',
          streakStart: '2021-01-01T00:00:00.000-05:00',
          total: 2,
        },
        schoolZoneSpeedCameraViolations: {
          maxStreak: 1,
          streakEnd: '2022-01-01T00:00:00.000-05:00',
          streakStart: '2022-01-01T00:00:00.000-05:00',
          total: 2,
        },
      },
      existingIdentifier: undefined,
      fingerprintId: undefined,
      lookupSource: LookupSource.Api,
      mixpanelId: undefined,
      numViolations: 17,
      plate,
      plateTypes: nonEmptyPlateTypes,
      state,
    }

    it('should insert a new lookup into the database', async () => {
      jest.useFakeTimers()

      const randomValueThatWillEvaluateToNewUniqueIdentifier = 0.2787865416438

      jest
        .spyOn(global.Math, 'random')
        .mockReturnValueOnce(randomValueThatWillEvaluateToNewUniqueIdentifier)

      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(Math.random as jest.Mock).mockReturnValueOnce(
        randomValueThatWillEvaluateToNewUniqueIdentifier
      )
      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, [{ count: 0 }])
      )

      await createAndInsertNewLookup(createNewLookupArguments)

      const now = new Date()

      const newLookup: PlateLookup = {
        bootEligibleUnderRdaaThreshold: false,
        bootEligibleUnderDvaaThreshold: false,
        busLaneCameraViolations: 1,
        countTowardsFrequency: false,
        createdAt: now,
        externalUsername: null,
        fingerprintId: undefined,
        lookupSource: LookupSource.Api,
        messageId: null,
        mixpanelId: undefined,
        numTickets: 17,
        observed: null,
        plate,
        plateTypes: nonEmptyPlateTypes.join(','),
        respondedTo: true,
        redLightCameraViolations: 2,
        speedCameraViolations: 2,
        state,
        uniqueIdentifier: newUniqueIdentifier,
      }

      expect(databaseConnection.query).toHaveBeenCalledTimes(2)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        [newUniqueIdentifier],
        expect.anything()
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into plate_lookups set ?',
        decamelizeKeys(newLookup),
        expect.anything()
      )

      jest.useRealTimers()
    })

    it('should keep trying until it gets a new unique identifier', async () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      // We expect two calls
      databaseConnection.query
        .mockImplementationOnce((_, __, callback) =>
          callback(null, [{ count: 1 }])
        )
        .mockImplementationOnce((_, __, callback) =>
          callback(null, [{ count: 0 }])
        )

      await createAndInsertNewLookup(createNewLookupArguments)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        expect.anything(),
        expect.anything()
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        expect.anything(),
        expect.anything()
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        3,
        'insert into plate_lookups set ?',
        expect.anything(),
        expect.anything()
      )
    })
  })

  describe('getPreviousLookupAndLookupFrequencyForVehicle', () => {
    const frequency = 2
    const numViolations = 10

    it('should increment the frequency and return previous lookup when a previous lookup exists', async () => {
      const vehicleQueryProps: VehicleQueryProps = {
        existingIdentifier: 'a1b2c3d4',
        existingLookupCreatedAt: date,
        lookupSource: LookupSource.WebClient,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, [
          [{ frequency }],
          [{ created_at: date, num_violations: numViolations }],
        ])
      )

      const expected = {
        frequency: frequency + 1,
        previousLookup: {
          createdAt: date,
          numViolations,
        },
      }

      const lookupSource = LookupSource.WebClient

      const queryResult = await getPreviousLookupAndLookupFrequencyForVehicle(
        vehicleQueryProps
      )

      expect(queryResult).toEqual(expected)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select count(*) as frequency from plate_lookups where plate = ? and ' +
          'state = ? and count_towards_frequency = 1 and plate_types = ?; ' +
          'select num_tickets as num_violations, created_at from plate_lookups where ' +
          'plate = ? and state = ? and count_towards_frequency = 1 and plate_types = ? ' +
          'ORDER BY created_at DESC LIMIT 1;',
        [
          'ABC1234',
          'NY',
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
          'ABC1234',
          'NY',
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
        ],
        expect.anything()
      )
    })

    it('should only return the frequency when there is no previous lookup', async () => {
      const vehicleQueryProps: VehicleQueryProps = {
        existingIdentifier: 'a1b2c3d4',
        existingLookupCreatedAt: undefined,
        lookupSource: LookupSource.WebClient,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const frequency = 0

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, [[{ frequency }], []])
      )

      const expected = {
        frequency: 1,
        previousLookup: undefined,
      }

      const queryResult = await getPreviousLookupAndLookupFrequencyForVehicle(
        vehicleQueryProps
      )

      expect(queryResult).toEqual(expected)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select count(*) as frequency from plate_lookups where plate = ? and ' +
          'state = ? and count_towards_frequency = 1 and plate_types = ?; ' +
          'select num_tickets as num_violations, created_at from plate_lookups where ' +
          'plate = ? and state = ? and count_towards_frequency = 1 and plate_types = ? ' +
          'ORDER BY created_at DESC LIMIT 1;',
        [
          'ABC1234',
          'NY',
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
          'ABC1234',
          'NY',
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
        ],
        expect.anything()
      )
    })

    it('should not increment the frequency when the lookup source is the API', async () => {
      const vehicleQueryProps: VehicleQueryProps = {
        existingIdentifier: 'a1b2c3d4',
        existingLookupCreatedAt: date,
        lookupSource: LookupSource.Api,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, [
          [{ frequency }],
          [{ created_at: date, num_violations: numViolations }],
        ])
      )

      const expected = {
        frequency,
        previousLookup: {
          createdAt: date,
          numViolations,
        },
      }

      const queryResult = await getPreviousLookupAndLookupFrequencyForVehicle(
        vehicleQueryProps
      )

      expect(queryResult).toEqual(expected)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select count(*) as frequency from plate_lookups where plate = ? and ' +
          'state = ? and count_towards_frequency = 1 and plate_types = ?; ' +
          'select num_tickets as num_violations, created_at from plate_lookups where ' +
          'plate = ? and state = ? and count_towards_frequency = 1 and plate_types = ? ' +
          'ORDER BY created_at DESC LIMIT 1;',
        [
          'ABC1234',
          'NY',
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
          'ABC1234',
          'NY',
          'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
        ],
        expect.anything()
      )
    })
  })

  describe('getPreviousLookupResult', () => {
    it('should return the previous lookup when one exists', async () => {
      const date = new Date()

      const expected = {
        createdAt: date,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, [decamelizeKeys(expected)])
      )

      const identifier = 'a1b2c3d4'

      const previousLookupResult = await getPreviousLookupResult(identifier)

      expect(previousLookupResult).toEqual(expected)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select plate, state, plate_types, created_at from plate_lookups where unique_identifier = ?',
        ['a1b2c3d4'],
        expect.anything()
      )
    })
  })

  describe('insertNewTwitterEventAndMediaObjects', () => {
    const twitterDatabaseEvent: TwitterDatabaseEvent = {
      createdAt: BigInt('1538172811702'),
      eventType: 'status',
      eventId: BigInt('1045798687270731783'),
      eventText: '@Uber @TransAlt @bikesnobnyc @HowsMyDrivingNY NJ:N21JYK',
      inReplyToMessageId: BigInt('1045785908199542785'),
      location: undefined,
      respondedTo: false,
      userHandle: 'BarackObama',
      userId: BigInt('1234567890'),
      userMentionIds: '998209858955509123',
    }

    const newTwitterDatabaseEventId = 123

    const twitterMediaObjects: TwitterMediaObject[] = [
      {
        type: 'photo',
        url: 'https://pbs.twimg.com/media/PfImn65W0AAf_EF.jpg',
      },
      {
        type: 'photo',
        url: 'https://pbs.twimg.com/media/DtM6R9VU0AA1ipf.jpg',
      },
    ]

    it('should create a twitter event and associated media objects', async () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query
        .mockImplementationOnce((_, __, callback) =>
          callback(null, { insertId: newTwitterDatabaseEventId })
        )
        .mockImplementationOnce((_, __, callback) =>
          callback(null, [{ insertId: 456 }, { insertId: 789 }])
        )

      const result = await insertNewTwitterEventAndMediaObjects(
        twitterDatabaseEvent,
        twitterMediaObjects
      )

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        decamelizeKeys(twitterDatabaseEvent),
        expect.anything()
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into twitter_media_objects set ?',
        twitterMediaObjects.map((twitterMediaObject) =>
          decamelizeKeys({
            ...twitterMediaObject,
            twitterEventId: newTwitterDatabaseEventId,
          })
        ),
        expect.anything()
      )
    })

    it('should create a twitter event when no media objects', async () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockImplementationOnce((_, __, callback) =>
        callback(null, { insertId: 123 })
      )

      const result = await insertNewTwitterEventAndMediaObjects(
        twitterDatabaseEvent
      )

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        decamelizeKeys(twitterDatabaseEvent),
        expect.anything()
      )
    })
  })

  describe('updateNonFollowerReplies', () => {
    const userId = BigInt('998209858955509123')
    const favoritedStatusId = BigInt('1045018690847158272')

    const inReplyToMessageId = 123456

    it('should update non-follower replies when given a user id and the id of a favorited status', async () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query
        .mockImplementationOnce((_, __, callback) => {
          callback(null, [{ in_reply_to_message_id: inReplyToMessageId }])
        })
        .mockImplementationOnce((_, __, callback) => {
          callback(null)
        })

      const result = await updateNonFollowerReplies(userId, favoritedStatusId)

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id from ' +
          'non_follower_replies where user_id = ? and favorited = false and event_id = ?;',
        [userId, favoritedStatusId],
        expect.anything()
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'update non_follower_replies set favorited = true where user_id = ? and event_id = ?; ' +
          'update twitter_events set user_favorited_non_follower_reply = true , responded_to = false ' +
          'where is_duplicate = false and event_id = ?;',
        [userId, favoritedStatusId, inReplyToMessageId],
        expect.anything()
      )
    })

    it('should update non-follower replies when given a user id', async () => {
      const databaseConnection = {
        end: jest.fn(),
        query: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query
        .mockImplementationOnce((_, __, callback) => {
          callback(null, [{ in_reply_to_message_id: inReplyToMessageId }])
        })
        .mockImplementationOnce((_, __, callback) => {
          callback(null)
        })

      const result = await updateNonFollowerReplies(userId)

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id from ' +
          'non_follower_replies where user_id = ? and favorited = false;',
        [userId],
        expect.anything()
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'update non_follower_replies set favorited = true where user_id = ?; ' +
          'update twitter_events set user_favorited_non_follower_reply = true , responded_to = false ' +
          'where is_duplicate = false and event_id = ?;',
        [userId, inReplyToMessageId],
        expect.anything()
      )
    })
  })
})
