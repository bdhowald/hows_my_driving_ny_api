import axios from 'axios'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import makeOpenDataVehicleRequest from 'services/openDataService'
import createServer from 'services/server'

jest.mock('services/openDataService')

describe('app', () => {
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
      const server = createServer()
      server.listen(1234)
      ;(makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataResponses
      )

      const response = await axios.get(
        'http://localhost:1234/api/v1?plate=ABC1234:NY:PAS'
      )
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

      server.close()
    })

    it('should return a previous lookup result when one exists', async () => {
      const server = createServer()
      server.listen(1234)
      ;(makeOpenDataVehicleRequest as jest.Mock)
        .mockResolvedValueOnce(openDataResponses)
        .mockResolvedValueOnce(openDataResponses)

      const firstResponse = await axios.get(
        'http://localhost:1234/api/v1?plate=ABC1234:NY:PAS&lookup_source=web_client'
      )
      const secondResponse = await axios.get(
        'http://localhost:1234/api/v1?plate=ABC1234:NY:PAS&lookup_source=web_client'
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

      server.close()
    }, 10000)
  })
})
