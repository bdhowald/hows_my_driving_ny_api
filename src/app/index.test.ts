import axios from 'axios'
import mysql, { MysqlError } from 'mysql'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import makeOpenDataVehicleRequest from 'services/openDataService'
import createServer from 'services/server'
import LookupSource from 'constants/lookupSources'

jest.mock('services/openDataService')

describe('app', () => {
  const serverPort = 1234
  const apiEndpoint = `http://localhost:${serverPort}/api/v1`

  const closeConnectionHandler = (error: any) => {
    if (error) {
      console.error(error)
      return
    }
  }

  const instantiateConnection = () => mysql.createConnection({
    host: '127.0.0.1',
    user: process.env.MYSQL_DATABASE_USER ?? '',
    password: process.env.MYSQL_DATABASE_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE_NAME ?? '',
    multipleStatements: true,
  })

  const queryForPlate = (
    plate: string, state: string, plateTypes: string
  ) => new Promise((resolve, reject) => {
    const databaseConnection = instantiateConnection()

    databaseConnection.query(
      'select * from plate_lookups where plate = ? and state = ? and plate_types = ?',
      [plate, state, plateTypes],
      (
        error: MysqlError | null,
        results: any,
      ) => {
        // Close database connection
        databaseConnection.end(closeConnectionHandler)

        if (error) {
          console.error(error)
          reject(error)
        }
        if (results) {
          return resolve(results)
        }
      }
    )
  })

  const wipeTestDatabase = async () =>
    new Promise<void>((resolve, reject) => {
      const testDatabaseName = process.env.MYSQL_DATABASE_NAME ?? ''

      if (!testDatabaseName.match(/test/)) {
        throw new Error('database may not be a test database')
      }

      const databaseConnection = instantiateConnection()

      databaseConnection.query('truncate table plate_lookups', (error) => {
        if (error) {
          // Close database connection
          databaseConnection.end(closeConnectionHandler)

          reject(error)
        }
        // Close database connection
        databaseConnection.end(closeConnectionHandler)

        resolve()
      })
    })

  const server = createServer()

  beforeEach(async () => {
    await wipeTestDatabase()
    server.listen(serverPort)
  })

  afterEach(async () => {
    server.close()
    await wipeTestDatabase()
  })

  describe('perform a vehicle lookup', () => {
    const licensePlate = 'ABC1234'
    const licenseState = 'NY'
    const licensePlateType = 'PAS'

    const queryString = `?%24%24app_token=token&%24limit=10000&plate=${licensePlate}&state=${licenseState}`
    const medallionQueryString =
      '?%24%24app_token=token&%24limit=10000&$select=' +
      'dmv_license_plate_number,%20max(last_updated_date)&' +
      `?$where=license_number%20=%20%27${licensePlate}%27&$group=dmv_license_plate_number`

    const openDataResponses = [
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/rhe8-mgbb.json${medallionQueryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/jt7v-77mi.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/c284-tqph.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/kiv2-tbus.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/2bnn-yakx.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/a5td-mswe.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/faiq-9dfq.json${queryString}`,
        },
        data: [
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2018-09-09T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '1',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2018-12-17T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '2',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-03-06T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '3',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-05-28T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '4',
          }),
        ],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/p7t3-5i9s.json${queryString}`,
        },
        data: [
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-10-07T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '5',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-11-17T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '6',
          }),
        ],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/kvfd-bves.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/7mxj-7a6y.json${queryString}`,
        },
        data: [
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2021-12-18T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '7',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2022-02-03T00:00:00.000',
            plateId: licensePlate,
            plateType: licensePlateType,
            registrationState: licenseState,
            summonsNumber: '8',
          }),
        ],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/869v-vr48.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/pvqr-7yc4.json${queryString}`,
        },
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/uvbq-3m68.json${queryString}`,
        },
        data: [
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '09/09/2018',
            licenseType: licensePlateType,
            plate: licensePlate,
            state: licenseState,
            summonsNumber: '1',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '12/17/2018',
            licenseType: licensePlateType,
            plate: licensePlate,
            state: licenseState,
            summonsNumber: '2',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '03/06/2019',
            licenseType: licensePlateType,
            plate: licensePlate,
            state: licenseState,
            summonsNumber: '3',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '05/28/2019',
            licenseType: licensePlateType,
            plate: licensePlate,
            state: licenseState,
            summonsNumber: '4',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '11/17/2019',
            licenseType: licensePlateType,
            plate: licensePlate,
            state: licenseState,
            summonsNumber: '6',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '12/18/2021',
            licenseType: licensePlateType,
            plate: licensePlate,
            state: licenseState,
            summonsNumber: '7',
          }),
        ],
      },
    ]

    it('should return the expected fields', async () => {
      ;(makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataResponses
      )

      const response = await axios.get(`${apiEndpoint}?plate=ABC1234:NY:PAS`)
      const { data } = response.data

      const { successful_lookup, vehicle } = data[0]

      expect(successful_lookup).toBe(true)
      expect(vehicle).toBeDefined()

      const {
        camera_streak_data,
        fines,
        plate,
        plate_types,
        rectified_plate,
        statistics,
        state,
        times_queried,
        tweet_parts,
        unique_identifier,
        violations,
        violations_count,
      } = vehicle

      expect(camera_streak_data).toBeDefined()
      expect(camera_streak_data.bus_lane_camera_violations).toBeDefined()
      expect(camera_streak_data.camera_violations).toBeDefined()
      expect(
        camera_streak_data.camera_violations_with_bus_lane_camera_violations
      ).toBeDefined()
      expect(camera_streak_data.red_light_camera_violations).toBeDefined()
      expect(
        camera_streak_data.school_zone_speed_camera_violations
      ).toBeDefined()

      expect(fines).toBeDefined()
      expect(fines.total_fined).toBeDefined()
      expect(fines.total_in_judgment).toBeDefined()
      expect(fines.total_outstanding).toBeDefined()
      expect(fines.total_paid).toBeDefined()
      expect(fines.total_reduced).toBeDefined()

      expect(plate).toBeDefined()

      expect(plate_types).toBeDefined()

      expect(rectified_plate).toBeDefined()

      expect(state).toBeDefined()

      expect(statistics).toBeDefined()
      expect(statistics.boroughs).toBeDefined()
      expect(statistics.violation_types).toBeDefined()
      expect(statistics.years).toBeDefined()

      expect(times_queried).toBeDefined()

      expect(tweet_parts).toBeDefined()

      expect(unique_identifier).toBeDefined()

      expect(violations).toBeDefined()

      expect(violations_count).toBeDefined()
    })

    it('should create a record in the database', async () => {
      ;(makeOpenDataVehicleRequest as jest.Mock)
        .mockResolvedValueOnce(openDataResponses)
        .mockResolvedValueOnce(openDataResponses)

      const plate = 'ABC1234'
      const state = 'NY'
      const plateTypes = 'PAS'

      const lookupSource = LookupSource.WebClient

      const queryBeforeLookupResults = await queryForPlate(plate, state, plateTypes)

      expect(queryBeforeLookupResults).toEqual([])

      await axios.get(
        `${apiEndpoint}?plate=${plate}:${state}:${plateTypes}&lookup_source=${lookupSource}`
      )

      // Wait for new record to be inserted into database
      await new Promise((r) => setTimeout(r, 1000))

      const queryAfterLookupResults = await queryForPlate(
        plate, state, plateTypes
      ) as Record<string, any>[]

      expect(queryAfterLookupResults[0].plate).toEqual(plate)
      expect(queryAfterLookupResults[0].state).toEqual(state)
      expect(queryAfterLookupResults[0].plate_types).toEqual(plateTypes)
      expect(queryAfterLookupResults[0].lookup_source).toEqual(lookupSource)
    })

    it('should return a previous lookup result as part of a lookup result when one exists', async () => {
      ;(makeOpenDataVehicleRequest as jest.Mock)
        .mockResolvedValueOnce(openDataResponses)
        .mockResolvedValueOnce(openDataResponses)

      const firstResponse = await axios.get(
        `${apiEndpoint}?plate=ABC1234:NY:PAS&lookup_source=web_client`
      )

      // Wait for new record to be inserted into database
      await new Promise((r) => setTimeout(r, 1000))

      const secondResponse = await axios.get(
        `${apiEndpoint}?plate=ABC1234:NY:PAS&lookup_source=web_client`
      )

      const { data: firstResponseData } = firstResponse.data
      const { vehicle: firstResponseVehicle } = firstResponseData[0]

      const {
        times_queried: firstResponseTimesQueried,
        unique_identifier: firstResponseUniqueIdentifier,
      } = firstResponseVehicle

      const { data: secondResponseData } = secondResponse.data
      const { vehicle: secondResponseVehicle } = secondResponseData[0]

      const {
        previous_lookup_date: secondResponsePreviousLookupDate,
        previous_violation_count: secondResponsePreviousViolationCount,
        times_queried: secondResponseTimesQueried,
        unique_identifier: secondResponseUniqueIdentifier,
      } = secondResponseVehicle

      expect(secondResponsePreviousLookupDate).toBeDefined()
      expect(secondResponsePreviousViolationCount).toBeDefined()
      expect(secondResponseTimesQueried).toBe(firstResponseTimesQueried + 1)
      expect(secondResponseUniqueIdentifier).not.toBe(
        firstResponseUniqueIdentifier
      )
    }, 10000)

    it('should return an existing lookup', async () => {
      ;(makeOpenDataVehicleRequest as jest.Mock)
        .mockResolvedValueOnce(openDataResponses)
        .mockResolvedValueOnce(openDataResponses)

      const plateLookupResponse = await axios.get(
        `${apiEndpoint}?plate=ABC1234:NY:PAS&lookup_source=web_client`
      )

      const { data: plateResponseData } = plateLookupResponse.data
      const { vehicle: { unique_identifier: uniqueIdentifier } } = plateResponseData[0]

      // Wait for new record to be inserted into database
      await new Promise((r) => setTimeout(r, 1000))

      const existingLookupResponse = await axios.get(
        `${apiEndpoint}/lookup/${uniqueIdentifier}`
      )

      const { data: existingLookupData } = existingLookupResponse.data

      const {
        camera_streak_data: cameraStreakData,
        fines,
        plate,
        plate_types: plateTypes,
        rectified_plate: rectifiedPlate,
        statistics,
        state,
        times_queried: timesQueried,
        tweet_parts: tweetParts,
        violations,
        violations_count: violationsCount,
      } = plateResponseData[0].vehicle

      expect(existingLookupData[0].vehicle.camera_streak_data).toEqual(cameraStreakData)
      expect(existingLookupData[0].vehicle.fines).toEqual(fines)
      expect(existingLookupData[0].vehicle.plate).toEqual(plate)
      expect(existingLookupData[0].vehicle.plate_types).toEqual(plateTypes)
      expect(existingLookupData[0].vehicle.rectified_plate).toEqual(rectifiedPlate)
      expect(existingLookupData[0].vehicle.statistics).toEqual(statistics)
      expect(existingLookupData[0].vehicle.state).toEqual(state)
      expect(existingLookupData[0].vehicle.times_queried).toEqual(timesQueried)
      expect(existingLookupData[0].vehicle.unique_identifier).toEqual(uniqueIdentifier)
      expect(existingLookupData[0].vehicle.violations).toEqual(violations)
      expect(existingLookupData[0].vehicle.violations_count).toEqual(violationsCount)

      expect(existingLookupData[0].vehicle.tweet_parts.slice(1)).toEqual(tweetParts.slice(1))
      expect(existingLookupData[0].vehicle.tweet_parts[0]).toMatch(
        /^As of \d{2}:\d{2}:\d{2} [A|P]M E[D|S]T on (.*) \d{2}, \d{4}: #NY_ABC1234 \(types: PAS\) has been queried 1 time./
      )
    }, 10000)
  })
})
