import { HttpStatusCode } from 'axios'
import http from 'http'
import { decamelizeKeys } from 'humps'
import { DateTime } from 'luxon'

import {
  TWEET_CREATE_EVENT_EXPECTED_SHA,
  TWEET_CREATE_EVENT_FIXTURE
} from '__fixtures__/twitter'
import { violationFactory } from '__fixtures__/violations'
import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'
import AggregateFineData from 'models/aggregateFineData'
import { VehicleResponse } from 'types/request'
import { getPreviousLookupResult } from 'utils/databaseQueries'
import getAndProcessApiLookup from 'utils/getAndProcessApiLookup'
import { handleTwitterAccountActivityApiEvents } from 'utils/twitter'

import {
  handleApiLookup,
  handleExistingLookup,
  handleTwitterRequestChallenge,
  handleTwitterWebhookEvent,
} from '.'

jest.mock('utils/databaseQueries')
jest.mock('utils/getAndProcessApiLookup')
jest.mock('utils/twitter')

describe('requestService', () => {
  describe('handleApiLookup', () => {
    it('should return a response for a vehicle with violations', async () => {
      jest.useFakeTimers()

      const now = DateTime.now()
      const uniqueIdentifier = 'a1b2c3d4'

      const plate = 'ABC1234'
      const state = 'NY'

      const apiQueryResponse: VehicleResponse = {
        successfulLookup: true,
        vehicle: {
          cameraStreakData: {
            busLaneCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            cameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            cameraViolationsWithBusLaneCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            redLightCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            speedCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
          },
          fines: new AggregateFineData({
            totalFined: 1050,
            totalInJudgment: 0,
            totalOutstanding: 0,
            totalPaid: 1050,
            totalReduced: 0,
          }),
          plate,
          plateTypes: undefined,
          previousLookupDate: undefined,
          previousViolationCount: undefined,
          rectifiedPlate: plate,
          state,
          statistics: {
            boroughs: {
              Bronx: 8,
            },
            violationTypes: {
              'Blocking Pedestrian Ramp': 8,
            },
            years: {
              '2018': 2,
              '2019': 4,
              '2021': 1,
              '2022': 1,
            },
          },
          timesQueried: 0,
          tweetParts: [
            `As of ${now.toFormat('hh:mm:ss a ZZZZ')} on ${now.toFormat(
              'LLLL dd, y'
            )}: #NY_ABC1234 has been queried 0 times.\n\n`,
            'Total parking and camera violation tickets for #NY_ABC1234: 8\n\n' +
            '8 | Blocking Pedestrian Ramp\n',
            'Violations by year for #NY_ABC1234:\n\n' +
            '2 | 2018\n' +
            '4 | 2019\n' +
            '1 | 2021\n' +
            '1 | 2022\n',
            'Violations by borough for #NY_ABC1234:\n\n' + '8 | Bronx\n',
            'Known fines for #NY_ABC1234:\n\n' +
            '$1,050.00 | Fined\n' +
            '$0.00         | Reduced\n' +
            '$1,050.00 | Paid\n' +
            '$0.00         | Outstanding\n' +
            '$0.00         | In Judgment\n',
            `View more details at https://howsmydrivingny.nyc/${uniqueIdentifier}.`,
          ],
          uniqueIdentifier,
          violations: [
            violationFactory.build({
              formattedTime: '2018-09-09T09:11:00.000-04:00',
              formattedTimeEastern: '2018-09-09T09:11:00.000-04:00',
              formattedTimeUtc: '2018-09-09T13:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2018-09-09T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '1',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2018-12-17T09:11:00.000-05:00',
              formattedTimeEastern: '2018-12-17T09:11:00.000-05:00',
              formattedTimeUtc: '2018-12-17T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2018-12-17T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '2',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2019-03-06T09:11:00.000-05:00',
              formattedTimeEastern: '2019-03-06T09:11:00.000-05:00',
              formattedTimeUtc: '2019-03-06T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2019-03-06T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '3',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2019-05-28T09:11:00.000-04:00',
              formattedTimeEastern: '2019-05-28T09:11:00.000-04:00',
              formattedTimeUtc: '2019-05-28T13:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2019-05-28T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '4',
              violationTime: '0911A',
            }),
            {
              amountDue: undefined,
              dateFirstObserved: '0',
              daysParkingInEffect: 'BBBBBBB',
              feetFromCurb: '0',
              fineAmount: undefined,
              fined: undefined,
              formattedTime: '2019-10-07T09:11:00.000-04:00',
              formattedTimeEastern: '2019-10-07T09:11:00.000-04:00',
              formattedTimeUtc: '2019-10-07T13:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/p7t3-5i9s.json',
                  name: 'Parking Violations Issued - Fiscal Year 2020',
                },
              ],
              fromHoursInEffect: 'ALL',
              houseNumber: undefined,
              humanizedDescription: HumanizedDescription.BlockingPedestrianRamp,
              interestAmount: undefined,
              intersectingStreet: 'GUERLAIN',
              issueDate: '2019-10-07T00:00:00.000',
              issuerCode: '972773',
              issuerCommand: '0043',
              issuerPrecinct: 43,
              issuerSquad: '0000',
              issuingAgency: 'NYPD',
              judgmentEntryDate: undefined,
              lawSection: '408',
              location: 'I/o Taylor Ave Guerlain',
              meterNumber: '-',
              outstanding: undefined,
              paid: undefined,
              paymentAmount: undefined,
              penaltyAmount: undefined,
              plateId: 'ABC1234',
              plateType: 'PAS',
              reduced: undefined,
              reductionAmount: undefined,
              registrationState: 'NY',
              streetCode1: '0',
              streetCode2: '0',
              streetCode3: '0',
              streetName: 'I/O TAYLOR AVE',
              subDivision: 'E5',
              summonsImage: undefined,
              summonsNumber: '5',
              toHoursInEffect: 'ALL',
              unregisteredVehicle: '0',
              vehicleBodyType: 'VAN',
              vehicleColor: 'BLUE',
              vehicleExpirationDate: '20250201',
              vehicleMake: 'HONDA',
              vehicleYear: '2006',
              violationCode: '67',
              violationCounty: Borough.Bronx,
              violationInFrontOfOrOpposite: undefined,
              violationLegalCode: undefined,
              violationLocation: '0043',
              violationPostCode: undefined,
              violationPrecinct: 43,
              violationTime: '0911A',
            },
            violationFactory.build({
              formattedTime: '2019-11-17T09:11:00.000-05:00',
              formattedTimeEastern: '2019-11-17T09:11:00.000-05:00',
              formattedTimeUtc: '2019-11-17T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/p7t3-5i9s.json',
                  name: 'Parking Violations Issued - Fiscal Year 2020',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2019-11-17T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '6',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2021-12-18T09:11:00.000-05:00',
              formattedTimeEastern: '2021-12-18T09:11:00.000-05:00',
              formattedTimeUtc: '2021-12-18T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/7mxj-7a6y.json',
                  name: 'Parking Violations Issued - Fiscal Year 2022',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2021-12-18T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '7',
              violationTime: '0911A',
            }),
            {
              amountDue: undefined,
              dateFirstObserved: '0',
              daysParkingInEffect: 'BBBBBBB',
              feetFromCurb: '0',
              fineAmount: undefined,
              fined: undefined,
              formattedTime: '2022-02-03T09:11:00.000-05:00',
              formattedTimeEastern: '2022-02-03T09:11:00.000-05:00',
              formattedTimeUtc: '2022-02-03T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/7mxj-7a6y.json',
                  name: 'Parking Violations Issued - Fiscal Year 2022',
                },
              ],
              fromHoursInEffect: 'ALL',
              houseNumber: undefined,
              humanizedDescription: HumanizedDescription.BlockingPedestrianRamp,
              interestAmount: undefined,
              intersectingStreet: 'GUERLAIN',
              issueDate: '2022-02-03T00:00:00.000',
              issuerCode: '972773',
              issuerCommand: '0043',
              issuerPrecinct: 43,
              issuerSquad: '0000',
              issuingAgency: 'NYPD',
              judgmentEntryDate: undefined,
              lawSection: '408',
              location: 'I/o Taylor Ave Guerlain',
              meterNumber: '-',
              outstanding: undefined,
              paid: undefined,
              paymentAmount: undefined,
              penaltyAmount: undefined,
              plateId: 'ABC1234',
              plateType: 'PAS',
              reduced: undefined,
              reductionAmount: undefined,
              registrationState: 'NY',
              streetCode1: '0',
              streetCode2: '0',
              streetCode3: '0',
              streetName: 'I/O TAYLOR AVE',
              subDivision: 'E5',
              summonsImage: undefined,
              summonsNumber: '8',
              toHoursInEffect: 'ALL',
              unregisteredVehicle: '0',
              vehicleBodyType: 'VAN',
              vehicleColor: 'BLUE',
              vehicleExpirationDate: '20250201',
              vehicleMake: 'HONDA',
              vehicleYear: '2006',
              violationCode: '67',
              violationCounty: Borough.Bronx,
              violationInFrontOfOrOpposite: undefined,
              violationLegalCode: undefined,
              violationLocation: '0043',
              violationPostCode: undefined,
              violationPrecinct: 43,
              violationTime: '0911A',
            },
          ],
          violationsCount: 8,
        },
      }

      const expected = {
        data: [decamelizeKeys(apiQueryResponse)]
      }

      const incomingRequest = {
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/api/v1?plate=ABC1234:NY'
      } as http.IncomingMessage

        ; (getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

      const result = await handleApiLookup(incomingRequest)

      expect(result).toEqual(expected)
    })

    it('should return a response for a vehicle with no violations', async () => {
      jest.useFakeTimers()

      const now = DateTime.now()
      const uniqueIdentifier = 'a1b2c3d4'

      const plate = 'ABC1234'
      const state = 'NY'

      const apiQueryResponse: VehicleResponse = {
        successfulLookup: true,
        vehicle: {
          cameraStreakData: {
            busLaneCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            cameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            cameraViolationsWithBusLaneCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            redLightCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            speedCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
          },
          fines: new AggregateFineData({
            totalFined: 0,
            totalInJudgment: 0,
            totalOutstanding: 0,
            totalPaid: 0,
            totalReduced: 0,
          }),
          plate,
          plateTypes: undefined,
          previousLookupDate: undefined,
          previousViolationCount: undefined,
          rectifiedPlate: plate,
          state,
          statistics: {
            boroughs: {},
            violationTypes: {},
            years: {},
          },
          timesQueried: 0,
          tweetParts: [
            `As of ${now.toFormat('hh:mm:ss a ZZZZ')} on ${now.toFormat(
              'LLLL dd, y'
            )}: #NY_ABC1234 has been queried 0 times.\n\n`,
            'Total parking and camera violation tickets for #NY_ABC1234: 0\n\n' +
            `View more details at https://howsmydrivingny.nyc/${uniqueIdentifier}.`,
          ],
          uniqueIdentifier,
          violations: [],
          violationsCount: 0,
        },
      }

      const expected = {
        data: [decamelizeKeys(apiQueryResponse)]
      }

      const incomingRequest = {
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/api/v1?plate=ABC1234:NY'
      } as http.IncomingMessage

        ; (getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

      const result = await handleApiLookup(incomingRequest)

      expect(result).toEqual(expected)
    })

    it('should return an error response if there is a problem parsing the plate input', async () => {
      const expected = decamelizeKeys(
        {
          errorCode: HttpStatusCode.BadRequest,
          errorMessage: "Missing state: use either 'plate=<PLATE>:<STATE>', ex: " +
            "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj', " +
            "or 'plate=<PLATE>&state=<STATE>', ex: " +
            "'api.howsmydrivingny.nyc/api/v1?plate=abc1234&state=ny'"
        }
      )

      const incomingRequest = {
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/api/v1?plate_id=ABC1234'
      } as http.IncomingMessage

      const result = await handleApiLookup(incomingRequest)

      expect(result).toEqual(expected)
    })
  })

  describe('handleExistingLookup', () => {
    it('should return an error response if there is no identifier of an existing lookup', async () => {
      const expected = {
        errorCode: HttpStatusCode.BadRequest,
        errorMessage: "You must supply the identifier of a lookup, e.g. 'a1b2c3d4'"
      }

      const incomingRequest = {
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/api/v1/lookup'
      } as http.IncomingMessage

      const result = await handleExistingLookup(incomingRequest)

      expect(result).toEqual(expected)
    })

    it('should return a response when the identifier yields an existing lookup', async () => {
      const plate = 'ABC1234'
      const state = 'NY'

      const uniqueIdentifier = 'a1b2c3d4'

      const january12021 = new Date(2021, 0, 1)
      const january12021AsLuxonDate = DateTime.fromJSDate(january12021)

      const existingIdentifierQueryResult = {
        createdAt: january12021,
        plate,
        plateTypes: null,
        state,
      }

      const apiQueryResponse: VehicleResponse = {
        successfulLookup: true,
        vehicle: {
          cameraStreakData: {
            busLaneCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            cameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            cameraViolationsWithBusLaneCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            redLightCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
            speedCameraViolations: {
              maxStreak: 0,
              streakEnd: null,
              streakStart: null,
              total: 0,
            },
          },
          fines: new AggregateFineData({
            totalFined: 875,
            totalInJudgment: 0,
            totalOutstanding: 0,
            totalPaid: 875,
            totalReduced: 0,
          }),
          plate,
          plateTypes: undefined,
          previousLookupDate: undefined,
          previousViolationCount: undefined,
          rectifiedPlate: plate,
          state,
          statistics: {
            boroughs: {
              Bronx: 8,
            },
            violationTypes: {
              'Blocking Pedestrian Ramp': 6,
            },
            years: {
              '2018': 2,
              '2019': 4,
            },
          },
          timesQueried: 0,
          tweetParts: [
            `As of ${january12021AsLuxonDate.toFormat('hh:mm:ss a ZZZZ')} ` +
            `on ${january12021AsLuxonDate.toFormat(
              'LLLL dd, y'
            )}: #NY_ABC1234 has been queried 0 times.\n\n`,
            'Total parking and camera violation tickets for #NY_ABC1234: 8\n\n' +
            '8 | Blocking Pedestrian Ramp\n',
            'Violations by year for #NY_ABC1234:\n\n' +
            '2 | 2018\n' +
            '4 | 2019\n' +
            '1 | 2021\n' +
            '1 | 2022\n',
            'Violations by borough for #NY_ABC1234:\n\n' + '8 | Bronx\n',
            'Known fines for #NY_ABC1234:\n\n' +
            '$1,050.00 | Fined\n' +
            '$0.00         | Reduced\n' +
            '$1,050.00 | Paid\n' +
            '$0.00         | Outstanding\n' +
            '$0.00         | In Judgment\n',
            `View more details at https://howsmydrivingny.nyc/${uniqueIdentifier}.`,
          ],
          uniqueIdentifier,
          violations: [
            violationFactory.build({
              formattedTime: '2018-09-09T09:11:00.000-04:00',
              formattedTimeEastern: '2018-09-09T09:11:00.000-04:00',
              formattedTimeUtc: '2018-09-09T13:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2018-09-09T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '1',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2018-12-17T09:11:00.000-05:00',
              formattedTimeEastern: '2018-12-17T09:11:00.000-05:00',
              formattedTimeUtc: '2018-12-17T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2018-12-17T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '2',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2019-03-06T09:11:00.000-05:00',
              formattedTimeEastern: '2019-03-06T09:11:00.000-05:00',
              formattedTimeUtc: '2019-03-06T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2019-03-06T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '3',
              violationTime: '0911A',
            }),
            violationFactory.build({
              formattedTime: '2019-05-28T09:11:00.000-04:00',
              formattedTimeEastern: '2019-05-28T09:11:00.000-04:00',
              formattedTimeUtc: '2019-05-28T13:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                  name: 'Parking Violations Issued - Fiscal Year 2019',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2019-05-28T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '4',
              violationTime: '0911A',
            }),
            {
              amountDue: undefined,
              dateFirstObserved: '0',
              daysParkingInEffect: 'BBBBBBB',
              feetFromCurb: '0',
              fineAmount: undefined,
              fined: undefined,
              formattedTime: '2019-10-07T09:11:00.000-04:00',
              formattedTimeEastern: '2019-10-07T09:11:00.000-04:00',
              formattedTimeUtc: '2019-10-07T13:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/p7t3-5i9s.json',
                  name: 'Parking Violations Issued - Fiscal Year 2020',
                },
              ],
              fromHoursInEffect: 'ALL',
              houseNumber: undefined,
              humanizedDescription: HumanizedDescription.BlockingPedestrianRamp,
              interestAmount: undefined,
              intersectingStreet: 'GUERLAIN',
              issueDate: '2019-10-07T00:00:00.000',
              issuerCode: '972773',
              issuerCommand: '0043',
              issuerPrecinct: 43,
              issuerSquad: '0000',
              issuingAgency: 'NYPD',
              judgmentEntryDate: undefined,
              lawSection: '408',
              location: 'I/o Taylor Ave Guerlain',
              meterNumber: '-',
              outstanding: undefined,
              paid: undefined,
              paymentAmount: undefined,
              penaltyAmount: undefined,
              plateId: 'ABC1234',
              plateType: 'PAS',
              reduced: undefined,
              reductionAmount: undefined,
              registrationState: 'NY',
              streetCode1: '0',
              streetCode2: '0',
              streetCode3: '0',
              streetName: 'I/O TAYLOR AVE',
              subDivision: 'E5',
              summonsImage: undefined,
              summonsNumber: '5',
              toHoursInEffect: 'ALL',
              unregisteredVehicle: '0',
              vehicleBodyType: 'VAN',
              vehicleColor: 'BLUE',
              vehicleExpirationDate: '20250201',
              vehicleMake: 'HONDA',
              vehicleYear: '2006',
              violationCode: '67',
              violationCounty: Borough.Bronx,
              violationInFrontOfOrOpposite: undefined,
              violationLegalCode: undefined,
              violationLocation: '0043',
              violationPostCode: undefined,
              violationPrecinct: 43,
              violationTime: '0911A',
            },
            violationFactory.build({
              formattedTime: '2019-11-17T09:11:00.000-05:00',
              formattedTimeEastern: '2019-11-17T09:11:00.000-05:00',
              formattedTimeUtc: '2019-11-17T14:11:00.000Z',
              fromDatabases: [
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/p7t3-5i9s.json',
                  name: 'Parking Violations Issued - Fiscal Year 2020',
                },
                {
                  endpoint:
                    'https://data.cityofnewyork.us/resource/uvbq-3m68.json',
                  name: 'Open Parking and Camera Violations',
                },
              ],
              issueDate: '2019-11-17T00:00:00.000',
              plateId: plate,
              registrationState: state,
              summonsNumber: '6',
              violationTime: '0911A',
            }),
          ],
          violationsCount: 8,
        },
      }

      const expected = {
        data: [decamelizeKeys(apiQueryResponse)]
      }

        ; (getPreviousLookupResult as jest.Mock).mockResolvedValueOnce(
          existingIdentifierQueryResult
        )
        ; (getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

      const incomingRequest = {
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/api/v1/lookup/a1b2c3d4'
      } as http.IncomingMessage

      const result = await handleExistingLookup(incomingRequest)

      expect(result).toEqual(expected)
    })

    it('should return a response when the identifier yields no existing lookup', async () => {
      const existingIdentifierQueryResult = null

      const expected = { data: [] }

        ; (getPreviousLookupResult as jest.Mock).mockResolvedValueOnce(
          existingIdentifierQueryResult
        )

      const incomingRequest = {
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/api/v1/lookup/a1b2c3d4'
      } as http.IncomingMessage

      const result = await handleExistingLookup(incomingRequest)

      expect(result).toEqual(expected)
    })
  })

  describe('handleTwitterRequestChallenge', () => {
    it('should return a response token to a Twitter challenge request', () => {
      const crcToken = 'MTYwZjgwNDAtMjI4Ni00MWI2LTk4MTktMjJjZjU4OGYxOTU4'
      const nonce = 'MTY4NTY2MjQ0ODA2MA'

      const expected = {
        response_token: 'sha256=u9S5633gIBHtt5xTYFvzQjnF0OH2hV5o3eEqDiEiekw='
      }

      const incomingRequest = {
        method: 'GET',
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: `/webhook/twitter?crc_token=${crcToken}&nonce=${nonce}`
      } as http.IncomingMessage

      const result = handleTwitterRequestChallenge(incomingRequest)

      expect(result).toEqual(expected)
    })

    it('should throw an error if process.env.TWITTER_CONSUMER_SECRET is missing', () => {
      // store value
      const testingTwitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET

      // delete value from process.env
      delete process.env['TWITTER_CONSUMER_SECRET']

      const incomingRequest = {
        method: 'GET',
        headers: { host: 'api.howsmydrivingny.nyc' },
        url: '/webhook/twitter?crc_token=crcToken&nonce=nonce'
      } as http.IncomingMessage

      expect(() => handleTwitterRequestChallenge(incomingRequest)).toThrow('Server Error')

      // restore value
      process.env.TWITTER_CONSUMER_SECRET = testingTwitterConsumerSecret
    })
  })

  describe('handleTwitterWebhookEvent', () => {
    it('should check the SHA of a webhook event and then call another function', () => {

      const textEncoder = new TextEncoder()
      const eventAsJson = JSON.stringify(TWEET_CREATE_EVENT_FIXTURE)
      const eventAsArrayBuffer = textEncoder.encode(eventAsJson)

      const incomingRequest = {
        on: jest.fn().mockImplementation((_, handler) => {
          handler(eventAsArrayBuffer)
          return incomingRequest
        }),
        method: 'POST',
        headers: {
          host: 'api.howsmydrivingny.nyc',
          'x-twitter-webhooks-signature': TWEET_CREATE_EVENT_EXPECTED_SHA
        },
        url: '/webhook/twitter'
      } as unknown as http.IncomingMessage

      handleTwitterWebhookEvent(incomingRequest)

      expect(handleTwitterAccountActivityApiEvents).toHaveBeenCalledWith(
        eventAsJson
      )
    })
  })
})
