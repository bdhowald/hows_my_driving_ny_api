import { DateTime } from 'luxon'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
  violationFactory,
} from '__fixtures__/violations'
import { Borough } from 'constants/boroughs'
import LookupSource from 'constants/lookupSources'
import { HumanizedDescription } from 'constants/violationDescriptions'
import AggregateFineData from 'models/aggregateFineData'
import OpenDataService from 'services/openDataService'
import {
  createAndInsertNewLookup,
  getPreviousLookupAndLookupFrequencyForVehicle,
} from 'utils/databaseQueries'
import { PreviousLookupAndFrequency } from 'types/query'
import { ExternalData, VehicleResponse } from 'types/request'
import { PotentialVehicle } from 'types/vehicles'

import getAndProcessApiLookup from '.'

jest.mock('services/openDataService')
jest.mock('utils/databaseQueries')

describe('getAndProcessApiLookup', () => {
  const openDataTableMetadataResponses = [
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/jt7v-77mi.json',
      },
      data: {
        "dataUpdatedAt": "2017-11-15T17:04:39.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/jt7v-77mi",
        "id": "jt7v-77mi",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/c284-tqph.json',
      },
      data: {
        "dataUpdatedAt": "2017-09-14T17:47:45.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/c284-tqph",
        "id": "c284-tqph",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/kiv2-tbus.json',
      },
      data: {
        "dataUpdatedAt": "2017-09-14T17:49:20.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/kiv2-tbus",
        "id": "kiv2-tbus",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/2bnn-yakx.json',
      },
      data: {
        "dataUpdatedAt": "2017-08-10T01:43:31.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/2bnn-yakx",
        "id": "2bnn-yakx",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/a5td-mswe.json',
      },
      data: {
        "dataUpdatedAt": "2018-07-31T18:38:30.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/a5td-mswe",
        "id": "a5td-mswe",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/faiq-9dfq.json',
      },
      data: {
        "dataUpdatedAt": "2019-07-17T15:21:47.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/faiq-9dfq",
        "id": "faiq-9dfq",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/p7t3-5i9s.json',
      },
      data: {
        "dataUpdatedAt": "2020-08-06T13:30:36.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/p7t3-5i9s",
        "id": "p7t3-5i9s",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/kvfd-bves.json',
      },
      data: {
          "dataUpdatedAt": "2021-08-04T19:29:37.000Z",
          "dataUri": "https://data.cityofnewyork.us/resource/kvfd-bves",
          "id": "kvfd-bves",
        }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/7mxj-7a6y.json',
      },
      data: {
        "dataUpdatedAt": "2022-08-09T18:44:55.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/7mxj-7a6y",
        "id": "7mxj-7a6y",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/869v-vr48.json',
      },
      data: {
        "dataUpdatedAt": "2023-11-14T17:54:58.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/869v-vr48",
        "id": "869v-vr48",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/pvqr-7yc4.json',
      },
      data: {
        "dataUpdatedAt": "2025-03-16T19:36:56.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/pvqr-7yc4",
        "id": "pvqr-7yc4",
      }
    },
    {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/nc67-uf89.json',
      },
      data: {
        "dataUpdatedAt": "2025-03-29T09:21:18.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/nc67-uf89",
        "id": "nc67-uf89",
      }
    }
  ]

  describe('when there are violations', () => {
    const uniqueIdentifier = 'a1b2c3d4'

    const plate = 'ABC1234'
    const state = 'NY'

    const queryString = `?%24%24app_token=token&%24limit=10000&plate=${plate}&state=${state}`

    const fiscalYearDatabaseResponses = [
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
            plateId: plate,
            registrationState: state,
            summonsNumber: '1',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2018-12-17T00:00:00.000',
            plateId: plate,
            registrationState: state,
            summonsNumber: '2',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-03-06T00:00:00.000',
            plateId: plate,
            registrationState: state,
            summonsNumber: '3',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-05-28T00:00:00.000',
            plateId: plate,
            registrationState: state,
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
            plateId: plate,
            registrationState: state,
            summonsNumber: '5',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2019-11-17T00:00:00.000',
            plateId: plate,
            registrationState: state,
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
            plateId: plate,
            registrationState: state,
            summonsNumber: '7',
          }),
          rawFiscalYearDatabaseViolationFactory.build({
            issueDate: '2022-02-03T00:00:00.000',
            plateId: plate,
            registrationState: state,
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
    ]
    const openParkingAndCameraDatabaseResponse = [
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/nc67-uf89.json${queryString}`,
        },
        data: [
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '09/09/2018',
            plate: plate,
            state: state,
            summonsNumber: '1',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '12/17/2018',
            plate: plate,
            state: state,
            summonsNumber: '2',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '03/06/2019',
            plate: plate,
            state: state,
            summonsNumber: '3',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '05/28/2019',
            plate: plate,
            state: state,
            summonsNumber: '4',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '11/17/2019',
            plate: plate,
            state: state,
            summonsNumber: '6',
          }),
          rawOpenParkingAndCameraViolationFactory.build({
            issueDate: '12/18/2021',
            plate: plate,
            state: state,
            summonsNumber: '7',
          }),
        ],
      },
    ]

    const openDataServiceResponse = [
      ...fiscalYearDatabaseResponses,
      ...openParkingAndCameraDatabaseResponse,
    ]

    const potentialVehicle: PotentialVehicle = {
      originalString: `${plate}:${state}`,
      plate,
      state,
      validPlate: true,
    }

    const externalData: ExternalData = {
      lookupSource: LookupSource.Api,
    }

    const baseExpected: VehicleResponse = {
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
          schoolZoneSpeedCameraViolations: {
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
        tweetParts: [],
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
            vehicleBodyTypeSanitized: 'Van',
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
            vehicleBodyTypeSanitized: 'Van',
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
            vehicleBodyTypeSanitized: 'Van',
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
            vehicleBodyTypeSanitized: 'Van',
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
            issuingAgency: 'New York Police Department (NYPD)',
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
            vehicleBodyTypeSanitized: 'Van',
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
            vehicleBodyTypeSanitized: 'Van',
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
            vehicleBodyTypeSanitized: 'Van',
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
            issuingAgency: 'New York Police Department (NYPD)',
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
            vehicleBodyTypeSanitized: 'Van',
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

    it('should process the open data api response when no previous lookup', async () => {
      jest.useFakeTimers()

      const now = DateTime.now()

      const tweetParts = [
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
      ]

      const expectedVehicleResponse = {
        ...baseExpected.vehicle,
        timesQueried: 0,
        tweetParts,
      }

      const expected = {
        ...baseExpected,
        ...{
          vehicle: expectedVehicleResponse,
        },
      }

      ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
        uniqueIdentifier
      )
      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponses
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataServiceResponse
      )
      ;(
        getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
      ).mockResolvedValueOnce({
        frequency: 0,
        previousLookup: undefined,
      })

      const result = await getAndProcessApiLookup(
        potentialVehicle,
        undefined,
        externalData
      )

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })

    it('should process the open data api response if a previous lookup exists', async () => {
      jest.useFakeTimers()

      const now = DateTime.now()
      const january12021 = new Date(2021, 0, 1)

      const frequency = 2
      const previousLookupAndFrequency: PreviousLookupAndFrequency = {
        frequency,
        previousLookup: {
          createdAt: january12021,
          numViolations: 4,
        },
      }

      const luxonDate = DateTime.fromJSDate(january12021, {
        zone: 'America/New_York',
      })

      const tweetParts = [
        `As of ${now.toFormat('hh:mm:ss a ZZZZ')} on ${now.toFormat(
          'LLLL dd, y'
        )}: #NY_ABC1234 has been queried 2 times.\n\n` +
          'This vehicle was last queried on ' +
          `${luxonDate.toFormat('LLLL dd, y')} at ` +
          `${luxonDate.toFormat('hh:mm:ss a ZZZZ')}. ` +
          'Since then, #NY_ABC1234 has received 4 new tickets.\n\n',
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
      ]

      const expectedVehicleResponse = {
        ...baseExpected.vehicle,
        previousLookupDate:
          previousLookupAndFrequency.previousLookup?.createdAt,
        previousViolationCount:
          previousLookupAndFrequency.previousLookup?.numViolations,
        timesQueried: frequency,
        tweetParts,
      }

      const expected = {
        ...baseExpected,
        ...{
          vehicle: expectedVehicleResponse,
        },
      }

      ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
        uniqueIdentifier
      )
      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponses
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataServiceResponse
      )
      ;(
        getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
      ).mockResolvedValueOnce(previousLookupAndFrequency)

      const result = await getAndProcessApiLookup(
        potentialVehicle,
        undefined,
        externalData
      )

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })

    it('should process the open data api response for an existing lookup by its identifier', async () => {
      jest.useFakeTimers()

      const january12021 = new Date(2021, 0, 1)
      const january12021AsLuxonDate = DateTime.fromJSDate(january12021, {
        zone: 'America/New_York',
      })

      const december12020 = new Date(2020, 11, 1)
      const december12020AsLuxonDate = DateTime.fromJSDate(december12020, {
        zone: 'America/New_York',
      })

      const frequency = 2
      const previousLookupAndFrequency: PreviousLookupAndFrequency = {
        frequency,
        previousLookup: {
          createdAt: december12020,
          numViolations: 4,
        },
      }

      const tweetParts = [
        `As of ${january12021AsLuxonDate.toFormat('hh:mm:ss a ZZZZ')} ` +
          `on ${january12021AsLuxonDate.toFormat(
            'LLLL dd, y'
          )}: #NY_ABC1234 has been queried 2 times.\n\n` +
          'This vehicle was last queried on ' +
          `${december12020AsLuxonDate.toFormat('LLLL dd, y')} at ` +
          `${december12020AsLuxonDate.toFormat('hh:mm:ss a ZZZZ')}. ` +
          'Since then, #NY_ABC1234 has received 2 new tickets.\n\n',
        'Total parking and camera violation tickets for #NY_ABC1234: 6\n\n' +
          '6 | Blocking Pedestrian Ramp\n',
        'Violations by year for #NY_ABC1234:\n\n' + '2 | 2018\n' + '4 | 2019\n',
        'Violations by borough for #NY_ABC1234:\n\n' + '6 | Bronx\n',
        'Known fines for #NY_ABC1234:\n\n' +
          '$875.00 | Fined\n' +
          '$0.00     | Reduced\n' +
          '$875.00 | Paid\n' +
          '$0.00     | Outstanding\n' +
          '$0.00     | In Judgment\n',
        `View more details at https://howsmydrivingny.nyc/${uniqueIdentifier}.`,
      ]

      const expectedVehicleResponse = {
        ...baseExpected.vehicle,
        fines: new AggregateFineData({
          totalFined: 875,
          totalInJudgment: 0,
          totalOutstanding: 0,
          totalPaid: 875,
          totalReduced: 0,
        }),
        previousLookupDate:
          previousLookupAndFrequency.previousLookup?.createdAt,
        previousViolationCount:
          previousLookupAndFrequency.previousLookup?.numViolations,
        statistics: {
          boroughs: {
            Bronx: 6,
          },
          violationTypes: {
            'Blocking Pedestrian Ramp': 6,
          },
          years: {
            '2018': 2,
            '2019': 4,
          },
        },
        timesQueried: frequency,
        tweetParts,
        // We only expect six of the eight violations since the existing lookup
        // was before the two most recent violations.
        violations: baseExpected.vehicle?.violations.slice(0, 6),
        violationsCount: 6,
      }

      const externalDataWithPreviousLookupCreatedDate = {
        ...externalData,
        ...(previousLookupAndFrequency.previousLookup?.createdAt && {
          existingLookupCreatedAt: january12021,
        }),
      }

      const expected = {
        ...baseExpected,
        ...{
          vehicle: expectedVehicleResponse,
        },
      }

      ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
        uniqueIdentifier
      )
      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponses
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataServiceResponse
      )
      ;(
        getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
      ).mockResolvedValueOnce(previousLookupAndFrequency)

      const result = await getAndProcessApiLookup(
        potentialVehicle,
        undefined,
        externalDataWithPreviousLookupCreatedDate
      )

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })

    it('should process the open data api response when the plate is a medallion plate', async () => {
      jest.useFakeTimers()

      const now = DateTime.now()
      const plate = 'Y201965C'
      const rectifiedPlate = '2B91'

      const potentialVehicle: PotentialVehicle = {
        originalString: `${plate}:${state}`,
        plate,
        state,
        validPlate: true,
      }

      const fiscalYearDatabaseResponses = [
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
              plateId: rectifiedPlate,
              registrationState: state,
              summonsNumber: '1',
            }),
            rawFiscalYearDatabaseViolationFactory.build({
              issueDate: '2018-12-17T00:00:00.000',
              plateId: rectifiedPlate,
              registrationState: state,
              summonsNumber: '2',
            }),
            rawFiscalYearDatabaseViolationFactory.build({
              issueDate: '2019-03-06T00:00:00.000',
              plateId: rectifiedPlate,
              registrationState: state,
              summonsNumber: '3',
            }),
            rawFiscalYearDatabaseViolationFactory.build({
              issueDate: '2019-05-28T00:00:00.000',
              plateId: rectifiedPlate,
              registrationState: state,
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
              plateId: rectifiedPlate,
              registrationState: state,
              summonsNumber: '5',
            }),
            rawFiscalYearDatabaseViolationFactory.build({
              issueDate: '2019-11-17T00:00:00.000',
              plateId: rectifiedPlate,
              registrationState: state,
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
              plateId: rectifiedPlate,
              registrationState: state,
              summonsNumber: '7',
            }),
            rawFiscalYearDatabaseViolationFactory.build({
              issueDate: '2022-02-03T00:00:00.000',
              plateId: rectifiedPlate,
              registrationState: state,
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
      ]
      const openParkingAndCameraDatabaseResponse = [
        {
          config: {
            url: `https://data.cityofnewyork.us/resource/nc67-uf89.json${queryString}`,
          },
          data: [
            rawOpenParkingAndCameraViolationFactory.build({
              issueDate: '09/09/2018',
              plate: rectifiedPlate,
              state: state,
              summonsNumber: '1',
            }),
            rawOpenParkingAndCameraViolationFactory.build({
              issueDate: '12/17/2018',
              plate: rectifiedPlate,
              state: state,
              summonsNumber: '2',
            }),
            rawOpenParkingAndCameraViolationFactory.build({
              issueDate: '03/06/2019',
              plate: rectifiedPlate,
              state: state,
              summonsNumber: '3',
            }),
            rawOpenParkingAndCameraViolationFactory.build({
              issueDate: '05/28/2019',
              plate: rectifiedPlate,
              state: state,
              summonsNumber: '4',
            }),
            rawOpenParkingAndCameraViolationFactory.build({
              issueDate: '11/17/2019',
              plate: rectifiedPlate,
              state: state,
              summonsNumber: '6',
            }),
            rawOpenParkingAndCameraViolationFactory.build({
              issueDate: '12/18/2021',
              plate: rectifiedPlate,
              state: state,
              summonsNumber: '7',
            }),
          ],
        },
      ]

      const openDataServiceResponse = [
        ...fiscalYearDatabaseResponses,
        ...openParkingAndCameraDatabaseResponse,
      ]

      const updatedViolations = baseExpected.vehicle?.violations.map(
        (violation) => ({
          ...violation,
          plateId: rectifiedPlate,
        })
      )

      const expectedVehicleResponse = {
        ...baseExpected.vehicle,
        plate,
        rectifiedPlate,
        violations: updatedViolations,
        tweetParts: [
          `As of ${now.toFormat('hh:mm:ss a ZZZZ')} on ${now.toFormat(
            'LLLL dd, y'
          )}: #NY_Y201965C has been queried 0 times.\n\n`,
          'Total parking and camera violation tickets for #NY_Y201965C: 8\n\n' +
            '8 | Blocking Pedestrian Ramp\n',
          'Violations by year for #NY_Y201965C:\n\n' +
            '2 | 2018\n' +
            '4 | 2019\n' +
            '1 | 2021\n' +
            '1 | 2022\n',
          'Violations by borough for #NY_Y201965C:\n\n' + '8 | Bronx\n',
          'Known fines for #NY_Y201965C:\n\n' +
            '$1,050.00 | Fined\n' +
            '$0.00         | Reduced\n' +
            '$1,050.00 | Paid\n' +
            '$0.00         | Outstanding\n' +
            '$0.00         | In Judgment\n',
          `View more details at https://howsmydrivingny.nyc/${uniqueIdentifier}.`,
        ],
      }

      const expected = {
        ...baseExpected,
        ...{
          vehicle: expectedVehicleResponse,
        },
      }

      ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
        uniqueIdentifier
      )
      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponses
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataServiceResponse
      )
      ;(
        getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
      ).mockResolvedValueOnce({
        frequency: 0,
        previousLookup: undefined,
      })

      const result = await getAndProcessApiLookup(
        potentialVehicle,
        undefined,
        externalData
      )

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })

    it('should throw an error if an open data violation response is missing the url it is from', async () => {
      const plate = 'ABC1234'

      const potentialVehicle: PotentialVehicle = {
        originalString: `${plate}:${state}`,
        plate,
        state,
        validPlate: true,
      }

      const openDataServiceResponse = [
        {
          config: {},
          data: [],
        },
      ]

      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponses
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataServiceResponse
      )

      await expect(
        getAndProcessApiLookup(
          potentialVehicle,
          undefined,
          externalData
        )
      ).rejects.toEqual(
        new Error('Missing response url')
      )
    })

    it('should throw an error if an open data metadata response is missing the url it is from', async () => {
      const plate = 'ABC1234'

      const potentialVehicle: PotentialVehicle = {
        originalString: `${plate}:${state}`,
        plate,
        state,
        validPlate: true,
      }

      const openDataTableMetadataResponseMissingUrl = [
        {
          config: {},
          data: [],
        },
      ]

      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponseMissingUrl
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce(
        openDataServiceResponse
      )

      await expect(
        getAndProcessApiLookup(
          potentialVehicle,
          undefined,
          externalData
        )
      ).rejects.toEqual(
        new Error('Missing response url')
      )
    })

    it('should throw an error response if one of the metadata requests returns an error', async () => {
      jest.useFakeTimers()

      const uniqueIdentifier = 'a1b2c3d4'

      const expected = {
        error:
          'Sorry, there was an error querying open data for ' +
          potentialVehicle.originalString,
        successfulLookup: false,
      }

      const openDataServiceResponse = [
        {
          config: {},
          data: [],
        },
      ]

      const openDataTableMetadataResponsesWithError = [
        ...openDataTableMetadataResponses.slice(0, 11),
        new Error('Network Error'),
        ...openDataTableMetadataResponses,
      ]

      ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
        uniqueIdentifier
      )
      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponsesWithError
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockRejectedValueOnce(
        openDataServiceResponse
      )
      ;(
        getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
      ).mockResolvedValueOnce({
        frequency: 0,
        previousLookup: undefined,
      })

      const result = await getAndProcessApiLookup(
        potentialVehicle,
        undefined,
        externalData
      )

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })

    it('should return an error response if one of the violations databases returns an error', async () => {
      jest.useFakeTimers()

      const uniqueIdentifier = 'a1b2c3d4'

      const expected = {
        error:
          'Sorry, there was an error querying open data for ' +
          potentialVehicle.originalString,
        successfulLookup: false,
      }

      const openDataServiceResponse = [
        ...fiscalYearDatabaseResponses.slice(0, 11),
        new Error('Network Error'),
        ...openParkingAndCameraDatabaseResponse,
      ]

      ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
        uniqueIdentifier
      )
      ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
        openDataTableMetadataResponses
      )
      ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockRejectedValueOnce(
        openDataServiceResponse
      )
      ;(
        getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
      ).mockResolvedValueOnce({
        frequency: 0,
        previousLookup: undefined,
      })

      const result = await getAndProcessApiLookup(
        potentialVehicle,
        undefined,
        externalData
      )

      expect(result).toEqual(expected)

      jest.useRealTimers()
    })
  })

  it('should return an error if not both plate and state available', async () => {
    jest.useFakeTimers()

    const potentialVehicle = {
      originalString: 'hello world',
      validPlate: false,
    }

    const expected = {
      error:
        'Sorry, a plate and state could not be inferred from ' +
        potentialVehicle.originalString,
      successfulLookup: false,
    }

    const externalData: ExternalData = {
      lookupSource: LookupSource.Api,
    }

    const result = await getAndProcessApiLookup(
      potentialVehicle,
      undefined,
      externalData
    )

    expect(result).toEqual(expected)

    jest.useRealTimers()
  })

  it('should get api response from open data and process the api response even when no violations', async () => {
    jest.useFakeTimers()

    const now = DateTime.now()
    const uniqueIdentifier = 'a1b2c3d4'

    const plate = 'ABC1234'
    const state = 'NY'
    const queryString = `?%24%24app_token=token&%24limit=10000&plate=${plate}&state=${state}`

    const medallionQueryString =
      '?%24%24app_token=token&%24limit=10000&$select=' +
      'dmv_license_plate_number,%20max(last_updated_date)&' +
      `?$where=license_number%20=%20%27${plate}%27&$group=dmv_license_plate_number`

    const potentialVehicle: PotentialVehicle = {
      originalString: `${plate}:${state}`,
      plate,
      state,
      validPlate: true,
    }

    const externalData: ExternalData = {
      lookupSource: LookupSource.Api,
    }

    ;(
      getPreviousLookupAndLookupFrequencyForVehicle as jest.Mock
    ).mockResolvedValueOnce({
      frequency: 0,
      previousLookup: undefined,
    })
    ;(OpenDataService.makeOpenDataMetadataRequest as jest.Mock).mockResolvedValueOnce(
      openDataTableMetadataResponses
    )
    ;(OpenDataService.makeOpenDataVehicleRequest as jest.Mock).mockResolvedValueOnce([
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
        data: [],
      },
      {
        config: {
          url: `https://data.cityofnewyork.us/resource/p7t3-5i9s.json${queryString}`,
        },
        data: [],
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
        data: [],
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
          url: `https://data.cityofnewyork.us/resource/nc67-uf89.json${queryString}`,
        },
        data: [],
      },
    ])
    ;(createAndInsertNewLookup as jest.Mock).mockResolvedValueOnce(
      uniqueIdentifier
    )

    const result = await getAndProcessApiLookup(
      potentialVehicle,
      undefined,
      externalData
    )

    const expected: VehicleResponse = {
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
          schoolZoneSpeedCameraViolations: {
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
          'Total parking and camera violation tickets for #NY_ABC1234: 0\n\n',
          `View more details at https://howsmydrivingny.nyc/${uniqueIdentifier}.`,
        ],
        uniqueIdentifier,
        violations: [],
        violationsCount: 0,
      },
    }

    expect(result).toEqual(expected)

    jest.useRealTimers()
  })
})
