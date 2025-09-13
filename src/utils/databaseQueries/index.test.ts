import * as mysql from 'mysql2/promise'
import { decamelizeKeys } from 'humps'

import LookupSource from 'constants/lookupSources'
import PlateLookup from 'constants/plateLookup'
import { DatabaseGeocode } from 'types/geocoding'
import { TwitterDatabaseEvent, TwitterMediaObject } from 'types/twitter'
import { getConnectionPool, instantiateConnection } from 'services/databaseService'

import {
  createAndInsertNewLookup,
  CreateNewLookupArguments,
  getExistingLookupResult,
  getBoroughFromDatabaseGeocode,
  getPreviousLookupAndLookupFrequencyForVehicle,
  insertGeocodeIntoDatabase,
  insertNewTwitterEventAndMediaObjects,
  updateNonFollowerReplies,
  VehicleQueryProps,
} from '.'

jest.mock('services/databaseService')

describe('databaseQueries', () => {

  afterAll(() => {
    const connectionPool = getConnectionPool()
    connectionPool?.end()
  })

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
          streakEndEastern: '2023-01-15T00:00:00.000-05:00',
          streakEndUtc: '2023-01-15T05:00:00.000Z',
          streakStart: '2023-01-15T00:00:00.000-05:00',
          streakStartEastern: '2023-01-15T00:00:00.000-05:00',
          streakStartUtc: '2023-01-15T05:00:00.000Z',
          total: 1,
        },
        cameraViolations: {
          maxStreak: 2,
          streakEnd: '2023-02-15T00:00:00.000-05:00',
          streakEndEastern: '2023-02-15T00:00:00.000-05:00',
          streakEndUtc: '2023-02-15T05:00:00.000Z',
          streakStart: '2023-03-15T00:00:00.000-04:00',
          streakStartEastern: '2023-03-15T00:00:00.000-04:00',
          streakStartUtc: '2023-03-15T04:00:00.000Z',
          total: 4,
        },
        cameraViolationsWithBusLaneCameraViolations: {
          maxStreak: 3,
          streakEnd: '2023-01-15T00:00:00.000-05:00',
          streakEndEastern: '2023-01-15T00:00:00.000-05:00',
          streakEndUtc: '2023-01-15T05:00:00.000Z',
          streakStart: '2023-03-15T00:00:00.000-04:00',
          streakStartEastern: '2023-03-15T00:00:00.000-04:00',
          streakStartUtc: '2023-03-15T04:00:00.000Z',
          total: 5,
        },
        redLightCameraViolations: {
          maxStreak: 1,
          streakEnd: '2021-01-01T00:00:00.000-05:00',
          streakEndEastern: '2021-01-01T00:00:00.000-05:00',
          streakEndUtc: '2021-01-01T05:00:00.000',
          streakStart: '2021-01-01T00:00:00.000-05:00',
          streakStartEastern: '2021-01-01T00:00:00.000-05:00',
          streakStartUtc: '2021-01-01T05:00:00.000Z',
          total: 2,
        },
        schoolZoneSpeedCameraViolations: {
          maxStreak: 1,
          streakEnd: '2022-01-01T00:00:00.000-05:00',
          streakEndEastern: '2022-01-01T00:00:00.000-05:00',
          streakEndUtc: '2022-01-01T00:00:00.000-05:00',
          streakStart: '2022-01-01T00:00:00.000-05:00',
          streakStartEastern: '2022-01-01T00:00:00.000-05:00',
          streakStartUtc: '2022-01-01T05:00:00.000',
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

    const selectCountWhereUniqueIdentifierEqualsValueQueryResponse = [
      [{ count: 0 }],
    ]

    const insertId = 1
    const insertQueryResponse = [
      {
        fieldCount: 0,
        affectedRows: 1,
        insertId,
        info: '',
        serverStatus: 2,
        warningStatus: 0,
        changedRows: 0
      } as mysql.ResultSetHeader,
      undefined
    ]

    const selectCreatedAtQueryResponse = [
      [ { created_at: '2025-04-03T11:45:06.000Z' } ],
      [
        {
          catalog: 'def',
          schema: 'traffic_violations_test',
          name: 'created_at',
          orgName: 'created_at',
          table: 'plate_lookups',
          orgTable: 'plate_lookups',
          characterSet: 63,
          encoding: 'binary',
          columnLength: 19,
          type: 12,
          flags: [ 'NOT NULL' ],
          decimals: 0,
          typeName: 'DATETIME'
        }
      ],
    ]

    it('should insert a new lookup with plate types into the database', async () => {
      jest.useFakeTimers()

      const randomValueThatWillEvaluateToNewUniqueIdentifier = 0.2787865416438

      jest
        .spyOn(global.Math, 'random')
        .mockReturnValueOnce(randomValueThatWillEvaluateToNewUniqueIdentifier)

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce(
        // query for unique identifier
        selectCountWhereUniqueIdentifierEqualsValueQueryResponse,
      ).mockResolvedValueOnce(
        // insert new record
        insertQueryResponse,
      ).mockResolvedValueOnce(
        // query for created_at date of new record
        selectCreatedAtQueryResponse,
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

      expect(databaseConnection.query).toHaveBeenCalledTimes(3)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        [newUniqueIdentifier],
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into plate_lookups set ?',
        decamelizeKeys(newLookup),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        3,
        'select created_at from plate_lookups where id = ?',
        [insertId],
      )

      jest.useRealTimers()
    })

    it('should insert a new lookup without plate types into the database', async () => {
      jest.useFakeTimers()

      const randomValueThatWillEvaluateToNewUniqueIdentifier = 0.2787865416438

      jest
        .spyOn(global.Math, 'random')
        .mockReturnValueOnce(randomValueThatWillEvaluateToNewUniqueIdentifier)

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce(
        // query for unique identifier
        selectCountWhereUniqueIdentifierEqualsValueQueryResponse,
      ).mockResolvedValueOnce(
        // insert new record
        insertQueryResponse,
      ).mockResolvedValueOnce(
        // query for created_at date of new record
        selectCreatedAtQueryResponse,
      )

      const createNewLookupArgumentsWithoutPlateTypes = {
        ...createNewLookupArguments,
        plateTypes: undefined,
      }

      await createAndInsertNewLookup(createNewLookupArgumentsWithoutPlateTypes)

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
        plateTypes: null,
        respondedTo: true,
        redLightCameraViolations: 2,
        speedCameraViolations: 2,
        state,
        uniqueIdentifier: newUniqueIdentifier,
      }

      expect(databaseConnection.query).toHaveBeenCalledTimes(3)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        [newUniqueIdentifier],
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into plate_lookups set ?',
        decamelizeKeys(newLookup),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        3,
        'select created_at from plate_lookups where id = ?',
        [insertId],
      )

      jest.useRealTimers()
    })

    it('should keep trying until it gets a new unique identifier', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      // We expect four calls
      databaseConnection.query
        .mockResolvedValueOnce(
          // query for unique identifier finds existing record
          [
            [{ count: 1 }],
          ],
        )
        .mockResolvedValueOnce(
          // query for next unique identifier returns nothing
          selectCountWhereUniqueIdentifierEqualsValueQueryResponse,
        ).mockResolvedValueOnce(
          // insert new record
          insertQueryResponse,
        ).mockResolvedValueOnce(
          // query for created_at date of new record
          selectCreatedAtQueryResponse,
        )

      await createAndInsertNewLookup(createNewLookupArguments)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        expect.anything(),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        expect.anything(),
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        3,
        'insert into plate_lookups set ?',
        expect.anything(),
      )
    })

    it('should handle a database error when obtaining a unique identifier', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const error = new Error('a fatal error')

      // mock failed call to obtain unique identifier
      databaseConnection.query.mockRejectedValueOnce(error)

      await expect(createAndInsertNewLookup(createNewLookupArguments)).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        [expect.any(String)],
      )
    })

    it('should handle a database error when creating and inserting a new lookup', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const error = new Error('a fatal error')

      databaseConnection.query
        // mock successful call to obtain unique identifier
        .mockResolvedValueOnce([[{count: 0}]])
        // mock failed call to create and insert the lookup
        .mockRejectedValueOnce(error)

      await expect(createAndInsertNewLookup(createNewLookupArguments)).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select count(*) as count from plate_lookups where unique_identifier = ?',
        [expect.any(String)],
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'insert into plate_lookups set ?',
        expect.objectContaining({
          'boot_eligible_under_dvaa_threshold': false,
          'boot_eligible_under_rdaa_threshold': false,
          'bus_lane_camera_violations': 1,
          'count_towards_frequency': false,
          'created_at': expect.any(Date),
          'external_username': null,
          'fingerprint_id': undefined,
          'lookup_source': 'api',
          'message_id': null,
          'mixpanel_id': undefined,
          'num_tickets': 17,
          'observed': null,
          'plate': 'ABC1234',
          'plate_types': 'AGR,ARG,AYG,BOB,CMH,FPW,GSM,HAM,HIS,JWV,MCL,NLM,ORG,PAS,PHS,PPH,RGL,SOS,SPO,SRF,WUG',
          'red_light_camera_violations': 2,
          'responded_to': true,
          'speed_camera_violations': 2,
          'state': 'NY',
          'unique_identifier': expect.any(String),
        }),
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
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce(
        [
          [
            [{ frequency }],
            [{ created_at: date, num_violations: numViolations }],
          ],
        ],
      )

      const expected = {
        frequency: frequency + 1,
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
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const frequency = 0

      databaseConnection.query.mockResolvedValueOnce(
        [
          [
            [{ frequency }],
            []
          ]
        ]
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
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce(
        [
          [
            [{ frequency }],
            [{ created_at: date, num_violations: numViolations }],
          ],
        ],
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
      )
    })

    it('should query for null plate types when they are not supplied in the query', async () => {
      const vehicleQueryProps: VehicleQueryProps = {
        existingIdentifier: 'a1b2c3d4',
        existingLookupCreatedAt: date,
        lookupSource: LookupSource.Api,
        plate,
        plateTypes: undefined,
        state,
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce(
        [
          [
            [{ frequency }],
            [{ created_at: date, num_violations: numViolations }],
          ],
        ],
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
          'state = ? and count_towards_frequency = 1 and plate_types is null; ' +
          'select num_tickets as num_violations, created_at from plate_lookups where ' +
          'plate = ? and state = ? and count_towards_frequency = 1 and plate_types is null ' +
          'ORDER BY created_at DESC LIMIT 1;',
        [
          'ABC1234',
          'NY',
          'ABC1234',
          'NY',
        ],
      )
    })

    it('should log an error if the previous lookup and frequency request fails', async () => {
      const vehicleQueryProps: VehicleQueryProps = {
        existingIdentifier: 'a1b2c3d4',
        existingLookupCreatedAt: date,
        lookupSource: LookupSource.Api,
        plate,
        plateTypes: undefined,
        state,
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const error = new Error('a fatal error')

      databaseConnection.query.mockRejectedValueOnce(error)

      await expect(
        getPreviousLookupAndLookupFrequencyForVehicle(
          vehicleQueryProps
        )
      ).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select count(*) as frequency from plate_lookups where plate = ? and ' +
          'state = ? and count_towards_frequency = 1 and plate_types is null; ' +
          'select num_tickets as num_violations, created_at from plate_lookups where ' +
          'plate = ? and state = ? and count_towards_frequency = 1 and plate_types is null ' +
          'ORDER BY created_at DESC LIMIT 1;',
        [
          'ABC1234',
          'NY',
          'ABC1234',
          'NY',
        ],
      )
    })
  })

  describe('getExistingLookupResult', () => {
    it('should return an existing lookup when one exists', async () => {
      const date = new Date()

      const expected = {
        createdAt: date,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce(
        [[decamelizeKeys(expected)]]
      )

      const identifier = 'a1b2c3d4'

      const previousLookupResult = await getExistingLookupResult(identifier)

      expect(previousLookupResult).toEqual(expected)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select plate, state, plate_types, created_at from plate_lookups where unique_identifier = ?',
        ['a1b2c3d4'],
      )
    })

    it('should return no existing lookup when one does not exist', async () => {
      const date = new Date()

      const expected = {
        createdAt: date,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce([[]])

      const identifier = 'a1b2c3d4'

      const previousLookupResult = await getExistingLookupResult(identifier)

      expect(previousLookupResult).toEqual(null)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select plate, state, plate_types, created_at from plate_lookups where unique_identifier = ?',
        ['a1b2c3d4'],
      )
    })

    it('should log an error if the existing lookup request fails', async () => {
      const date = new Date()

      const expected = {
        createdAt: date,
        plate,
        plateTypes: nonEmptyPlateTypes,
        state,
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      const error = new Error('a fatal error')

      databaseConnection.query.mockRejectedValueOnce(error)

      const identifier = 'a1b2c3d4'

      await expect(
        getExistingLookupResult(identifier)
      ).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select plate, state, plate_types, created_at from plate_lookups where unique_identifier = ?',
        ['a1b2c3d4'],
      )
    })
  })

  describe('getBoroughFromDatabaseGeocode', () => {
    it('should search the database for a geocode and return the result if so', async () => {
      const address = '99 Schermerhorn Street New York NY'

      const borough = {borough: 'Brooklyn'}

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValueOnce(
        databaseConnection
      )

      databaseConnection.query
        .mockResolvedValueOnce([[borough]])

      expect(await getBoroughFromDatabaseGeocode(address)).toEqual([borough])

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select borough from geocodes WHERE lookup_string = ?',
        ['99 Schermerhorn Street New York NY New York NY'],
      )
    })

    it('should log an error if the geocode request fails', async () => {
      const address = '99 Schermerhorn Street New York NY'

      const borough = {borough: 'Brooklyn'}

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValueOnce(
        databaseConnection
      )

      const error = new Error('a fatal error')

      databaseConnection.query.mockRejectedValueOnce(error)

      await expect(getBoroughFromDatabaseGeocode(address)).rejects.toBe(error)
    })
  })

  describe('insertGeocodeIntoDatabase', () => {
    const loggingKey = '[summons_number=1234567890][vehicle=NY:ABC1234]'

    it('should insert a geocode into the database', async () => {
      const address = '99 Schermerhorn Street New York NY'

      const geocode: DatabaseGeocode = {
        borough: 'Brooklyn',
        geocoder_id: 1,
        lookup_string: address
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValueOnce(
        databaseConnection
      )

      databaseConnection.query
        .mockResolvedValueOnce([{ insertId: '123' }])

      expect(await insertGeocodeIntoDatabase(geocode, loggingKey)).toBe(true)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into geocodes set ?',
        {
          'borough': 'Brooklyn',
          'geocoder_id': 1,
          'lookup_string': '99 Schermerhorn Street New York NY'
        },
      )
    })

    it('should log an error if the insert geocode request fails', async () => {
      const address = '99 Schermerhorn Street New York NY'

      const geocode: DatabaseGeocode = {
        borough: 'Brooklyn',
        geocoder_id: 1,
        lookup_string: address
      }

      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValueOnce(
        databaseConnection
      )

      const error = new Error('a fatal error')

      databaseConnection.query.mockRejectedValueOnce(error)

      await expect(
        insertGeocodeIntoDatabase(geocode, loggingKey)
      ).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into geocodes set ?',
        {
          'borough': 'Brooklyn',
          'geocoder_id': 1,
          'lookup_string': '99 Schermerhorn Street New York NY'
        },
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
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      databaseConnection.query
        .mockResolvedValueOnce(
          [{ insertId: newTwitterDatabaseEventId }]
        )
        .mockResolvedValueOnce(
          [[{ insertId: 456 }, { insertId: 789 }]]
        )

      const result = await insertNewTwitterEventAndMediaObjects(
        twitterDatabaseEvent,
        twitterMediaObjects
      )

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        decamelizeKeys(twitterDatabaseEvent),
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
      )
    })

    it('should create a twitter event when no media objects', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      databaseConnection.query.mockResolvedValueOnce([{ insertId: 123 }])

      const result = await insertNewTwitterEventAndMediaObjects(
        twitterDatabaseEvent
      )

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        decamelizeKeys(twitterDatabaseEvent),
      )
    })

    it('should log an error if the request to create a twitter event and associated media objects fails', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      const error = new Error('a fatal error')

      databaseConnection.query.mockRejectedValueOnce(error)

      await expect(
        insertNewTwitterEventAndMediaObjects(
          twitterDatabaseEvent
        )
      ).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'insert into twitter_events set ?',
        decamelizeKeys(twitterDatabaseEvent),
      )
    })
  })

  describe('updateNonFollowerReplies', () => {
    const userId = BigInt('998209858955509123')
    const favoritedStatusId = BigInt('1045018690847158272')

    const inReplyToMessageId = 123456

    it('should update non-follower replies when given a user id and the id of a favorited status', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query
        .mockResolvedValueOnce(
          [[{ in_reply_to_message_id: inReplyToMessageId }]]
        )
        .mockResolvedValueOnce(null)

      const result = await updateNonFollowerReplies(userId, favoritedStatusId)

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id from ' +
          'non_follower_replies where user_id = ? and favorited = false and event_id = ?;',
        [userId, favoritedStatusId],
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'update non_follower_replies set favorited = true where user_id = ? and event_id = ?; ' +
          'update twitter_events set user_favorited_non_follower_reply = true, responded_to = false ' +
          'where is_duplicate = false and event_id = ?;',
        [userId, favoritedStatusId, inReplyToMessageId],
      )
    })

    it('should update non-follower replies when given a user id', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      databaseConnection.query
        .mockResolvedValueOnce(
          [[{ in_reply_to_message_id: inReplyToMessageId }]]
        )
        .mockResolvedValueOnce(null)

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      const result = await updateNonFollowerReplies(userId)

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        1,
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id from ' +
          'non_follower_replies where user_id = ? and favorited = false;',
        [userId],
      )
      expect(databaseConnection.query).toHaveBeenNthCalledWith(
        2,
        'update non_follower_replies set favorited = true where user_id = ?; ' +
          'update twitter_events set user_favorited_non_follower_reply = true, responded_to = false ' +
          'where is_duplicate = false and event_id = ?;',
        [userId, inReplyToMessageId],
      )
    })

    it('should not update non-follower replies when given a user id that yields no results', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockReturnValue(databaseConnection)

      databaseConnection.query
        .mockResolvedValueOnce([[]])

      const result = await updateNonFollowerReplies(userId)

      expect(result).toBe(true)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id from ' +
          'non_follower_replies where user_id = ? and favorited = false;',
        [userId],
      )
    })

    it('should log an error if the request to update non-follower replies fails', async () => {
      const databaseConnection = {
        query: jest.fn(),
        release: jest.fn(),
      }

      ;(instantiateConnection as jest.Mock).mockResolvedValue(databaseConnection)

      const error = new Error('a fatal error')

      databaseConnection.query.mockRejectedValueOnce(error)

      await expect(
        updateNonFollowerReplies(userId)
      ).rejects.toBe(error)

      expect(databaseConnection.query).toHaveBeenCalledWith(
        'select CAST( in_reply_to_message_id as CHAR(20) ) as in_reply_to_message_id from ' +
          'non_follower_replies where user_id = ? and favorited = false;',
        [userId],
      )
    })
  })
})
