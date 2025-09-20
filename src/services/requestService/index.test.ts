import { HttpStatusCode } from 'axios'
import http from 'http'
import { DateTime } from 'luxon'

import { cameraDataWithNoCameraViolationsFactory } from '__fixtures__/cameraData'
import {
  TWEET_CREATE_EVENT_EXPECTED_SHA,
  TWEET_CREATE_EVENT_FIXTURE,
} from '__fixtures__/twitter'
import { violationFactory } from '__fixtures__/violations'
import { Borough } from 'constants/boroughs'
import { HumanizedDescription } from 'constants/violationDescriptions'
import AggregateFineData from 'models/aggregateFineData'
import OpenDataService from 'services/openDataService'
import { VehicleResponse } from 'types/request'
import { decamelizeKeys, decamelizeKeysOneLevel } from 'utils/camelize'
import { getExistingLookupResult } from 'utils/databaseQueries'
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
  const hosts = ['api.howsmydrivingny.nyc', 'localhost:8080']

  const openDateLastUpdatedTime = new Date('2025-04-01')

  hosts.forEach((host) => {
    const hostIsLocal = host === 'localhost:8080'
      ? 'when host is local'
      : 'when host is not local'

    describe(`handleApiLookup ${hostIsLocal}`, () => {
      it('should return a response for a vehicle with violations', async () => {
        jest.useFakeTimers()

        const determineOpenDataLastUpdatedTimeSpy = jest.spyOn(OpenDataService, 'determineOpenDataLastUpdatedTime')
        determineOpenDataLastUpdatedTimeSpy.mockResolvedValueOnce(
          openDateLastUpdatedTime
        )

        const now = DateTime.now()
        const uniqueIdentifier = 'a1b2c3d4'

        const lookupDate = DateTime.fromJSDate(new Date('2025-09-01 15:12:48'))
        const lookupDateInEastern = lookupDate.setZone('America/New_York')

        const plate = 'ABC1234'
        const state = 'NY'

        const apiQueryResponse: VehicleResponse = {
          statusCode: 200,
          successfulLookup: true,
          vehicle: {
            cameraStreakData: cameraDataWithNoCameraViolationsFactory.build(),
            fines: new AggregateFineData({
              totalFined: 1050,
              totalInJudgment: 0,
              totalOutstanding: 0,
              totalPaid: 1050,
              totalReduced: 0,
            }),
            lookupDate: lookupDateInEastern.toISO(),
            lookupDateEastern: lookupDateInEastern.toISO(),
            lookupDateUtc: lookupDate.toISO(),
            plate,
            plateTypes: undefined,
            previousLookupDate: undefined,
            previousLookupDateEastern: undefined,
            previousLookupDateUtc: undefined,
            previousViolationCount: undefined,
            rectifiedPlate: plate,
            state,
            statistics: {
              boroughs: {
                theBronx: 8,
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
              'Violations by borough for #NY_ABC1234:\n\n' + '8 | The Bronx\n',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2020-08-06T13:30:36.000Z',
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
                issuingAgency: 'P',
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
                sanitized: {
                  issuingAgency: 'New York Police Department (NYPD)',
                  vehicleBodyType: 'Van',
                  violationStatus: 'Hearing Held - Guilty',
                },
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
                violationStatus: 'HEARING HELD-GUILTY',
                violationTime: '0911A',
              },
              violationFactory.build({
                formattedTime: '2019-11-17T09:11:00.000-05:00',
                formattedTimeEastern: '2019-11-17T09:11:00.000-05:00',
                formattedTimeUtc: '2019-11-17T14:11:00.000Z',
                fromDatabases: [
                  {
                    dataUpdatedAt: '2020-08-06T13:30:36.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/p7t3-5i9s.json',
                    name: 'Parking Violations Issued - Fiscal Year 2020',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2022-08-09T18:44:55.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/7mxj-7a6y.json',
                    name: 'Parking Violations Issued - Fiscal Year 2022',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2022-08-09T18:44:55.000Z',
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
                issuingAgency: 'P',
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
                sanitized: {
                  issuingAgency: 'New York Police Department (NYPD)',
                  vehicleBodyType: 'Van',
                  violationStatus: 'Hearing Held - Guilty',
                },
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
                violationStatus: 'HEARING HELD-GUILTY',
                violationTime: '0911A',
              },
            ],
            violationsCount: 8,
          },
        }

        const statistics = apiQueryResponse.vehicle?.statistics
        const statisticsBarelyDecamelized = decamelizeKeysOneLevel(statistics)

        const decamelizedResponse = decamelizeKeys(
          apiQueryResponse
        ) as VehicleResponse
        // @ts-expect-error  Figure out how to decamelize only the top-level betters.
        decamelizedResponse.vehicle.statistics = statisticsBarelyDecamelized

        const expected = decamelizeKeysOneLevel({
          body: {
            data: [decamelizedResponse],
          },
          etag: '"lookup-ABC1234:NY-1743465600000"',
          statusCode: 200,
        })

        const incomingRequest = {
          headers: { host },
          url: '/api/v1?plate=ABC1234:NY',
        } as http.IncomingMessage

        ;(getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)

        jest.useRealTimers()
      })

      it('should return a response for a vehicle with no violations', async () => {
        jest.useFakeTimers()

        const determineOpenDataLastUpdatedTimeSpy = jest.spyOn(OpenDataService, 'determineOpenDataLastUpdatedTime')
        determineOpenDataLastUpdatedTimeSpy.mockResolvedValueOnce(
          openDateLastUpdatedTime
        )

        const now = DateTime.now()
        const uniqueIdentifier = 'a1b2c3d4'

        const lookupDate = DateTime.fromJSDate(new Date('2025-09-01 15:12:48'))
        const lookupDateInEastern = lookupDate.setZone('America/New_York')

        const plate = 'ABC1234'
        const state = 'NY'

        const apiQueryResponse: VehicleResponse = {
          statusCode: 200,
          successfulLookup: true,
          vehicle: {
            cameraStreakData: cameraDataWithNoCameraViolationsFactory.build(),
            fines: new AggregateFineData({
              totalFined: 0,
              totalInJudgment: 0,
              totalOutstanding: 0,
              totalPaid: 0,
              totalReduced: 0,
            }),
            lookupDate: lookupDateInEastern.toISO(),
            lookupDateEastern: lookupDateInEastern.toISO(),
            lookupDateUtc: lookupDate.toISO(),
            plate,
            plateTypes: undefined,
            previousLookupDate: undefined,
            previousLookupDateEastern: undefined,
            previousLookupDateUtc: undefined,
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

        const expected = decamelizeKeys({
          body: {
            data: [apiQueryResponse],
          },
          etag: '"lookup-ABC1234:NY-1743465600000"',
          statusCode: 200,
        })

        const incomingRequest = {
          headers: { host },
          url: '/api/v1?plate=ABC1234:NY',
        } as http.IncomingMessage

        ;(getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)

        jest.useRealTimers()
      })

      it('should return a response for a vehicle that does not represent a valid plate', async () => {
        const plateQueryParam = 'ABC1234:'

        const apiQueryResponse: VehicleResponse = {
          error:
          `Sorry, a plate and state could not be inferred from ${plateQueryParam}`,
          statusCode: 400,
          successfulLookup: false,
        }

        const expected = decamelizeKeys({
          body: {
            data: [apiQueryResponse],
          },
          statusCode: HttpStatusCode.BadRequest,
        })

        const incomingRequest = {
          headers: { host },
          url: `/api/v1?plate=${plateQueryParam}`,
        } as http.IncomingMessage

        ;(getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it('should return a response for a query with a vehicle that does not represent a valid plate and a vehicle that does', async () => {
        const now = DateTime.now()
        const uniqueIdentifier = 'a1b2c3d4'

        const plate = 'ABC1234'
        const state = 'NY'

        const lookupDate = DateTime.fromJSDate(new Date('2025-09-01 15:12:48'))
        const lookupDateInEastern = lookupDate.setZone('America/New_York')

        const validPlateQueryParam = `${plate}:${state}`
        const invalidPlateQueryParam = `${plate}:`

        const successfulApiQueryResponse: VehicleResponse = {
          statusCode: 200,
          successfulLookup: true,
          vehicle: {
            cameraStreakData: cameraDataWithNoCameraViolationsFactory.build(),
            fines: new AggregateFineData({
              totalFined: 0,
              totalInJudgment: 0,
              totalOutstanding: 0,
              totalPaid: 0,
              totalReduced: 0,
            }),
            lookupDate: lookupDateInEastern.toISO(),
            lookupDateEastern: lookupDateInEastern.toISO(),
            lookupDateUtc: lookupDate.toISO(),
            plate,
            plateTypes: undefined,
            previousLookupDate: undefined,
            previousLookupDateEastern: undefined,
            previousLookupDateUtc: undefined,
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

        const unsuccessfulApiQueryResponse: VehicleResponse = {
          error:
          `Sorry, a plate and state could not be inferred from ${invalidPlateQueryParam}`,
          statusCode: 400,
          successfulLookup: false,
        }

        const expected = decamelizeKeys({
          body: {
            data: [
              unsuccessfulApiQueryResponse,
              successfulApiQueryResponse,
            ],
          },
          statusCode: HttpStatusCode.MultiStatus,
        })

        const incomingRequest = {
          headers: { host },
          url: `/api/v1?plate=${invalidPlateQueryParam}&plate=${validPlateQueryParam}`,
        } as http.IncomingMessage

        ;(getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          unsuccessfulApiQueryResponse
        ).mockResolvedValueOnce(
          successfulApiQueryResponse
        )

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it('should return an error response if there is a problem parsing the plate input', async () => {
        const expected = decamelizeKeys({
          body: {
            errorMessage:
              "Missing state: use either 'plate=<PLATE>:<STATE>', ex: " +
              "'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj', " +
              "or 'plate=<PLATE>&state=<STATE>', ex: " +
              "'api.howsmydrivingny.nyc/api/v1?plate=abc1234&state=ny'",
          },
          statusCode: HttpStatusCode.BadRequest,
        })

        const incomingRequest = {
          headers: { host },
          url: '/api/v1?plate_id=ABC1234',
        } as http.IncomingMessage

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it("should return a 304 ('Not Modified') if the eTag in the 'if-none-match' header matches the current value and plate has no plate types", async () => {
        const expected = decamelizeKeys({
          statusCode: 304,
        })

        const determineOpenDataLastUpdatedTimeSpy = jest.spyOn(OpenDataService, 'determineOpenDataLastUpdatedTime')
        determineOpenDataLastUpdatedTimeSpy.mockResolvedValueOnce(
          openDateLastUpdatedTime
        )

        const incomingRequest = {
          headers: { host, 'if-none-match': `"lookup-ABC1234:NY-${openDateLastUpdatedTime.getTime()}"` },
          url: '/api/v1?plate=ABC1234:NY',
        } as http.IncomingMessage

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it("should return a 304 ('Not Modified') if the eTag in the 'if-none-match' header matches the current value and plate has plate types", async () => {
        const expected = decamelizeKeys({
          statusCode: 304,
        })

        const determineOpenDataLastUpdatedTimeSpy = jest.spyOn(OpenDataService, 'determineOpenDataLastUpdatedTime')
        determineOpenDataLastUpdatedTimeSpy.mockResolvedValueOnce(
          openDateLastUpdatedTime
        )

        const incomingRequest = {
          headers: { host, 'if-none-match': `"lookup-ABC1234:NY:PAS-${openDateLastUpdatedTime.getTime()}"` },
          url: '/api/v1?plate=ABC1234:NY:PAS',
        } as http.IncomingMessage

        const result = await handleApiLookup(incomingRequest)

        expect(result).toEqual(expected)
      })
    })

    describe(`handleExistingLookup ${hostIsLocal}`, () => {
      it('should return an error response if there is no identifier of an existing lookup', async () => {
        const expected = decamelizeKeys({
          body: {
            errorMessage:
              "You must supply the identifier of a lookup, e.g. 'a1b2c3d4'",
          },
          statusCode: 400,
        })

        const incomingRequest = {
          headers: { host: 'api.howsmydrivingny.nyc' },
          url: '/api/v1/lookup',
        } as http.IncomingMessage

        const result = await handleExistingLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it('should return a response when the identifier yields an existing lookup', async () => {
        const plate = 'ABC1234'
        const state = 'NY'

        const uniqueIdentifier = 'a1b2c3d4'

        const lookupDate = DateTime.fromJSDate(new Date('2025-09-01 15:12:48'))
        const lookupDateInEastern = lookupDate.setZone('America/New_York')

        const january12021 = new Date(2021, 0, 1)
        const january12021AsLuxonDate = DateTime.fromJSDate(january12021)

        const existingIdentifierQueryResult = {
          createdAt: january12021,
          plate,
          plateTypes: null,
          state,
        }

        const apiQueryResponse: VehicleResponse = {
          statusCode: 200,
          successfulLookup: true,
          vehicle: {
            cameraStreakData: cameraDataWithNoCameraViolationsFactory.build(),
            fines: new AggregateFineData({
              totalFined: 875,
              totalInJudgment: 0,
              totalOutstanding: 0,
              totalPaid: 875,
              totalReduced: 0,
            }),
            lookupDate: lookupDateInEastern.toISO(),
            lookupDateEastern: lookupDateInEastern.toISO(),
            lookupDateUtc: lookupDate.toISO(),
            plate,
            plateTypes: undefined,
            previousLookupDate: undefined,
            previousLookupDateEastern: undefined,
            previousLookupDateUtc: undefined,
            previousViolationCount: undefined,
            rectifiedPlate: plate,
            state,
            statistics: {
              boroughs: {
                theBronx: 8,
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
              'Violations by borough for #NY_ABC1234:\n\n' + '8 | The Bronx\n',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2019-07-17T15:21:47.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/faiq-9dfq.json',
                    name: 'Parking Violations Issued - Fiscal Year 2019',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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
                    dataUpdatedAt: '2020-08-06T13:30:36.000Z',
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
                issuingAgency: 'P',
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
                sanitized: {
                  issuingAgency: 'New York Police Department (NYPD)',
                  vehicleBodyType: 'Van',
                  violationStatus: 'Hearing Held - Guilty',
                },
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
                violationStatus: 'HEARING HELD-GUILTY',
                violationTime: '0911A',
              },
              violationFactory.build({
                formattedTime: '2019-11-17T09:11:00.000-05:00',
                formattedTimeEastern: '2019-11-17T09:11:00.000-05:00',
                formattedTimeUtc: '2019-11-17T14:11:00.000Z',
                fromDatabases: [
                  {
                    dataUpdatedAt: '2020-08-06T13:30:36.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/p7t3-5i9s.json',
                    name: 'Parking Violations Issued - Fiscal Year 2020',
                  },
                  {
                    dataUpdatedAt: '2025-03-29T09:21:18.000Z',
                    endpoint:
                      'https://data.cityofnewyork.us/resource/nc67-uf89.json',
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

        const statistics = apiQueryResponse.vehicle?.statistics
        const statisticsBarelyDecamelized = decamelizeKeysOneLevel(statistics)

        const decamelizedResponse = decamelizeKeys(
          apiQueryResponse
        ) as VehicleResponse
        // @ts-expect-error  Figure out how to decamelize only the top-level betters.
        decamelizedResponse.vehicle.statistics = statisticsBarelyDecamelized

        const expected = decamelizeKeysOneLevel({
          body: {
            data: [decamelizedResponse],
          },
          etag: '"lookup-a1b2c3d4-1743465600000"',
          statusCode: 200,
        })

        ;(getExistingLookupResult as jest.Mock).mockResolvedValueOnce(
          existingIdentifierQueryResult
        )
        ;(getAndProcessApiLookup as jest.Mock).mockResolvedValueOnce(
          apiQueryResponse
        )

        const determineOpenDataLastUpdatedTimeSpy = jest.spyOn(OpenDataService, 'determineOpenDataLastUpdatedTime')
        determineOpenDataLastUpdatedTimeSpy.mockResolvedValueOnce(
          openDateLastUpdatedTime
        )

        const incomingRequest = {
          headers: { host: host },
          url: '/api/v1/lookup/a1b2c3d4',
        } as http.IncomingMessage

        const result = await handleExistingLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it('should return a response when the identifier yields no existing lookup', async () => {
        const existingIdentifierQueryResult = null

        const expected = decamelizeKeys({
          body: { data: [] },
          statusCode: 200,
        })

        ;(getExistingLookupResult as jest.Mock).mockResolvedValueOnce(
          existingIdentifierQueryResult
        )

        const incomingRequest = {
          headers: { host },
          url: '/api/v1/lookup/a1b2c3d4',
        } as http.IncomingMessage

        const result = await handleExistingLookup(incomingRequest)

        expect(result).toEqual(expected)
      })

      it("should return a 304 ('Not Modified') if the eTag in the 'if-none-match' header matches the current value", async () => {
        const expected = decamelizeKeys({
          statusCode: 304,
        })

        const determineOpenDataLastUpdatedTimeSpy = jest.spyOn(OpenDataService, 'determineOpenDataLastUpdatedTime')
        determineOpenDataLastUpdatedTimeSpy.mockResolvedValueOnce(
          openDateLastUpdatedTime
        )

        const incomingRequest = {
          headers: { host, 'if-none-match': `"lookup-a1b2c3d4-${openDateLastUpdatedTime.getTime()}"` },
          url: '/api/v1/lookup/a1b2c3d4',
        } as http.IncomingMessage

        const result = await handleExistingLookup(incomingRequest)

        expect(result).toEqual(expected)
      })
    })

    describe(`handleTwitterRequestChallenge ${hostIsLocal}`, () => {
      it('should return a response token to a Twitter challenge request', () => {
        const crcToken = 'MTYwZjgwNDAtMjI4Ni00MWI2LTk4MTktMjJjZjU4OGYxOTU4'
        const nonce = 'MTY4NTY2MjQ0ODA2MA'

        const expected = {
          response_token: 'sha256=u9S5633gIBHtt5xTYFvzQjnF0OH2hV5o3eEqDiEiekw=',
        }

        const incomingRequest = {
          method: 'GET',
          headers: { host },
          url: `/webhook/twitter?crc_token=${crcToken}&nonce=${nonce}`,
        } as http.IncomingMessage

        const result = handleTwitterRequestChallenge(incomingRequest)

        expect(result).toEqual(expected)
      })

      it('should return a response token to a Twitter challenge request even when crc_token is blank', () => {
        const nonce = 'MTY4NTY2MjQ0ODA2MA'

        const expected = {
          response_token: 'sha256=kIdjhy6tMMs9qorCf1OS7pKQkJBAw6ONfH7z2SOseWI=',
        }

        const incomingRequest = {
          method: 'GET',
          headers: { host },
          url: `/webhook/twitter?crc_token=&nonce=${nonce}`,
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
          headers: { host },
          url: '/webhook/twitter?crc_token=crcToken&nonce=nonce',
        } as http.IncomingMessage

        expect(() => handleTwitterRequestChallenge(incomingRequest)).toThrow(
          'Server Error'
        )

        // restore value
        process.env.TWITTER_CONSUMER_SECRET = testingTwitterConsumerSecret
      })
    })

    describe(`handleTwitterWebhookEvent ${hostIsLocal}`, () => {
      beforeEach(() => {
        (handleTwitterAccountActivityApiEvents as jest.Mock).mockReset()
      })

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
            'x-twitter-webhooks-signature': TWEET_CREATE_EVENT_EXPECTED_SHA,
          },
          url: '/webhook/twitter',
        } as unknown as http.IncomingMessage

        handleTwitterWebhookEvent(incomingRequest)

        expect(handleTwitterAccountActivityApiEvents).toHaveBeenCalledWith(
          eventAsJson
        )
      })

      it('should throw an error if process.env.TWITTER_CONSUMER_SECRET is missing', () => {
        // store value
        const testingTwitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET

        // delete value from process.env
        delete process.env['TWITTER_CONSUMER_SECRET']

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
            'x-twitter-webhooks-signature': TWEET_CREATE_EVENT_EXPECTED_SHA + '!!!',
          },
          url: '/webhook/twitter',
        } as unknown as http.IncomingMessage

        expect(() => handleTwitterWebhookEvent(incomingRequest)).toThrow(
          'Server Error'
        )

        // restore value
        process.env.TWITTER_CONSUMER_SECRET = testingTwitterConsumerSecret
      })

      it('should not process the webhook event if the SHA does not match', () => {
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
            'x-twitter-webhooks-signature': TWEET_CREATE_EVENT_EXPECTED_SHA + '!!!',
          },
          url: '/webhook/twitter',
        } as unknown as http.IncomingMessage

        handleTwitterWebhookEvent(incomingRequest)

        expect(handleTwitterAccountActivityApiEvents).not.toHaveBeenCalled()
      })
    })
  })
})
