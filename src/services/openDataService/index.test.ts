import axios, { AxiosError, AxiosHeaders } from 'axios'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import { RawViolation } from 'types/violations'

import OpenDataService from '.'
import { BASE_DELAY } from 'constants/requests';

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  get: jest.fn(),
}));

jest.mock('constants/requests', () => ({
  // Ugly, but safest way to override BASE_DELAY
  __esModule: true,
  BASE_DELAY: 10,
}))

describe('OpenDataService.makeOpenDataVehicleRequest', () => {
  describe('querying various open data tables', () => {
    const baseDelayExistingValue = OpenDataService.BASE_DELAY

    beforeEach(() => {
      ;(axios.get as jest.Mock).mockReset()
    })

    const plate = 'ABC1234'
    const state = 'NY'
    const plateTypes = [
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

    const medallionDatabaseQueryParams = new URLSearchParams({
      $$app_token: 'token',
      $group: 'dmv_license_plate_number',
      $limit: '10000',
      $select: 'dmv_license_plate_number, max(last_updated_date)',
      $where: `license_number='${encodeURIComponent(plate.toUpperCase())}'`,
    })

    const fiscalYearDatabaseQueryParams = new URLSearchParams({
      $$app_token: 'token',
      $limit: '10000',
      plate_id: plate,
      registration_state: state,
    })

    const openParkingAndCameraViolationsDatabaseQueryParams =
      new URLSearchParams({
        $$app_token: 'token',
        $limit: '10000',
        plate: plate,
        state: state,
      })

    const openDataHost = 'https://data.cityofnewyork.us'

    const openDataEndpoints = [
      `${openDataHost}/resource/rhe8-mgbb.json?${medallionDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParams.toString()}`,
      `${openDataHost}/resource/nc67-uf89.json?${openParkingAndCameraViolationsDatabaseQueryParams.toString()}`,
    ]

    it('return a response even when no violations found querying without plate types', async () => {
      const medallionEndpointResponse = { data: [] }
      const fiscalYear2014EndpointResponse = { data: [] }
      const fiscalYear2015EndpointResponse = { data: [] }
      const fiscalYear2016EndpointResponse = { data: [] }
      const fiscalYear2017EndpointResponse = { data: [] }
      const fiscalYear2018EndpointResponse = { data: [] }
      const fiscalYear2019EndpointResponse = { data: [] }
      const fiscalYear2020EndpointResponse = { data: [] }
      const fiscalYear2021EndpointResponse = { data: [] }
      const fiscalYear2022EndpointResponse = { data: [] }
      const fiscalYear2023EndpointResponse = { data: [] }
      const fiscalYear2024EndpointResponse = { data: [] }
      const openParkingAndCameraViolationsEndpointResponse = { data: [] }

      ;(axios.get as jest.Mock)
        .mockResolvedValueOnce(medallionEndpointResponse)
        .mockResolvedValueOnce(fiscalYear2014EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2015EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2016EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2017EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2018EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2019EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2020EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2021EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2022EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2023EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2024EndpointResponse)
        .mockResolvedValueOnce(openParkingAndCameraViolationsEndpointResponse)

      const result = OpenDataService.makeOpenDataVehicleRequest(plate, state)

      expect(await result).toEqual(
        // There should be one for every request except the first.
        [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
        ]
      )

      openDataEndpoints.map((endpoint, index) => {
        expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
      })
    })

    it('return a response when violations are found', async () => {
      const rawOpenParkingAndCameraViolation =
        rawOpenParkingAndCameraViolationFactory.build()

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build()

      const medallionEndpointResponse = { data: [] }
      const fiscalYear2014EndpointResponse = { data: [] }
      const fiscalYear2015EndpointResponse = { data: [] }
      const fiscalYear2016EndpointResponse = { data: [] }
      const fiscalYear2017EndpointResponse = { data: [] }
      const fiscalYear2018EndpointResponse = { data: [] }
      const fiscalYear2019EndpointResponse = {
        data: [rawFiscalYearDatabaseViolation],
      }
      const fiscalYear2020EndpointResponse = { data: [] }
      const fiscalYear2021EndpointResponse = { data: [] }
      const fiscalYear2022EndpointResponse = { data: [] }
      const fiscalYear2023EndpointResponse = { data: [] }
      const fiscalYear2024EndpointResponse = { data: [] }
      const openParkingAndCameraViolationsEndpointResponse = {
        data: [rawOpenParkingAndCameraViolation],
      }

      ;(axios.get as jest.Mock)
        .mockResolvedValueOnce(medallionEndpointResponse)
        .mockResolvedValueOnce(fiscalYear2014EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2015EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2016EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2017EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2018EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2019EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2020EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2021EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2022EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2023EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2024EndpointResponse)
        .mockResolvedValueOnce(openParkingAndCameraViolationsEndpointResponse)

      const result = OpenDataService.makeOpenDataVehicleRequest(plate, state)

      expect(await result).toEqual(
        // There should be one for every request except the first (medallion database).
        [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [rawFiscalYearDatabaseViolation] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [rawOpenParkingAndCameraViolation] },
        ]
      )

      openDataEndpoints.map((endpoint, index) => {
        expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
      })
    })

    it('should use the most recent identified medallion plate', async () => {
      const rawOpenParkingAndCameraViolation =
        rawOpenParkingAndCameraViolationFactory.build()

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build()

      const identifiedMedallionPlate = "1E65H"

      const fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate = new URLSearchParams({
        $$app_token: 'token',
        $limit: '10000',
        plate_id: identifiedMedallionPlate,
        registration_state: state,
      })
  
      const openParkingAndCameraViolationsDatabaseQueryParamsWithIdentifiedMedallionPlate =
        new URLSearchParams({
          $$app_token: 'token',
          $limit: '10000',
          plate: identifiedMedallionPlate,
          state: state,
        })

      const openDataEndpointsWithIdentifiedMedallionPlate = [
        `${openDataHost}/resource/rhe8-mgbb.json?${medallionDatabaseQueryParams.toString()}`,
        `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
        `${openDataHost}/resource/nc67-uf89.json?${openParkingAndCameraViolationsDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
      ]

      const medallionEndpointResponse = {
        data: [
          {
            dmv_license_plate_number: "1E65F",
            max_last_updated_date: "2022-01-20T00:00:00.000"
          },
          {
            dmv_license_plate_number: "1E65H",
            max_last_updated_date: "2024-01-20T00:00:00.000"
          },
          {
            dmv_license_plate_number: "1E65G",
            max_last_updated_date: "2023-01-19T00:00:00.000"
          },
        ]
      }
      const fiscalYear2014EndpointResponse = { data: [] }
      const fiscalYear2015EndpointResponse = { data: [] }
      const fiscalYear2016EndpointResponse = { data: [] }
      const fiscalYear2017EndpointResponse = { data: [] }
      const fiscalYear2018EndpointResponse = { data: [] }
      const fiscalYear2019EndpointResponse = {
        data: [rawFiscalYearDatabaseViolation],
      }
      const fiscalYear2020EndpointResponse = { data: [] }
      const fiscalYear2021EndpointResponse = { data: [] }
      const fiscalYear2022EndpointResponse = { data: [] }
      const fiscalYear2023EndpointResponse = { data: [] }
      const fiscalYear2024EndpointResponse = { data: [] }
      const openParkingAndCameraViolationsEndpointResponse = {
        data: [rawOpenParkingAndCameraViolation],
      }

      ;(axios.get as jest.Mock)
        .mockResolvedValueOnce(medallionEndpointResponse)
        .mockResolvedValueOnce(fiscalYear2014EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2015EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2016EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2017EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2018EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2019EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2020EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2021EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2022EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2023EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2024EndpointResponse)
        .mockResolvedValueOnce(openParkingAndCameraViolationsEndpointResponse)

      const result = OpenDataService.makeOpenDataVehicleRequest(plate, state)

      expect(await result).toEqual(
        // There should be one for every request except the first (medallion database).
        [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [rawFiscalYearDatabaseViolation] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [rawOpenParkingAndCameraViolation] },
        ]
      )

      openDataEndpointsWithIdentifiedMedallionPlate.map((endpoint, index) => {
        expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
      })
    })

    it('return a response when violations are found querying with plate types', async () => {
      const rawOpenParkingAndCameraViolation =
        rawOpenParkingAndCameraViolationFactory.build()

      const rawFiscalYearDatabaseViolation: RawViolation =
        rawFiscalYearDatabaseViolationFactory.build()

      const plateTypesString = plateTypes
        .map((plateType) => `'${plateType}'`)
        .join(',')

      const fiscalYearDatabaseQueryParamsWithPlateTypes = new URLSearchParams(
        fiscalYearDatabaseQueryParams.toString()
      )
      fiscalYearDatabaseQueryParamsWithPlateTypes.append(
        '$where',
        `plate_type in (${plateTypesString})`
      )

      const openParkingAndCameraViolationsDatabaseQueryParamsWithPlateTypes =
        new URLSearchParams(
          openParkingAndCameraViolationsDatabaseQueryParams.toString()
        )
      openParkingAndCameraViolationsDatabaseQueryParamsWithPlateTypes.append(
        '$where',
        `license_type in (${plateTypesString})`
      )

      const openDataEndpointsWithPlateTypes = [
        `${openDataHost}/resource/rhe8-mgbb.json?${medallionDatabaseQueryParams.toString()}`,
        `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
        `${openDataHost}/resource/nc67-uf89.json?${openParkingAndCameraViolationsDatabaseQueryParamsWithPlateTypes.toString()}`,
      ]

      const medallionEndpointResponse = { data: [] }
      const fiscalYear2014EndpointResponse = { data: [] }
      const fiscalYear2015EndpointResponse = { data: [] }
      const fiscalYear2016EndpointResponse = { data: [] }
      const fiscalYear2017EndpointResponse = { data: [] }
      const fiscalYear2018EndpointResponse = { data: [] }
      const fiscalYear2019EndpointResponse = {
        data: [rawFiscalYearDatabaseViolation],
      }
      const fiscalYear2020EndpointResponse = { data: [] }
      const fiscalYear2021EndpointResponse = { data: [] }
      const fiscalYear2022EndpointResponse = { data: [] }
      const fiscalYear2023EndpointResponse = { data: [] }
      const fiscalYear2024EndpointResponse = { data: [] }
      const openParkingAndCameraViolationsEndpointResponse = {
        data: [rawOpenParkingAndCameraViolation],
      }

      ;(axios.get as jest.Mock)
        .mockResolvedValueOnce(medallionEndpointResponse)
        .mockResolvedValueOnce(fiscalYear2014EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2015EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2016EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2017EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2018EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2019EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2020EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2021EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2022EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2023EndpointResponse)
        .mockResolvedValueOnce(fiscalYear2024EndpointResponse)
        .mockResolvedValueOnce(openParkingAndCameraViolationsEndpointResponse)

      const result = OpenDataService.makeOpenDataVehicleRequest(plate, state, plateTypes)

      expect(await result).toEqual(
        // There should be one for every request except the first (medallion database).
        [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [rawFiscalYearDatabaseViolation] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [rawOpenParkingAndCameraViolation] },
        ]
      )

      openDataEndpointsWithPlateTypes.map((endpoint, index) => {
        expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
      })
    })

    describe('handling open data errors', () => {
      it('should throw an error if process.env.NYC_OPEN_DATA_APP_TOKEN is missing', async () => {
        // store value
        const nycOpenDataToken = process.env.NYC_OPEN_DATA_APP_TOKEN
  
        // delete value from process.env
        delete process.env['NYC_OPEN_DATA_APP_TOKEN']
  
        await expect(OpenDataService.makeOpenDataVehicleRequest(plate, state)).rejects.toEqual(
          new Error('NYC Open Data app token is missing.')
        )
  
        // restore value
        process.env.NYC_OPEN_DATA_APP_TOKEN = nycOpenDataToken
      })

      it('should log and rethrow a non-axios error', async () => {
        const nonAxiosError = new Error('Sorry, that did not work.')

        // Mock the value permanently since the retry behavior will engage
        ;(axios.get as jest.Mock).mockRejectedValue(nonAxiosError)

        await expect(OpenDataService.makeOpenDataVehicleRequest(plate, state)).rejects.toEqual(new Error(nonAxiosError.message))
      })

      it('should log and rethrow an axios error with no request or response object', async () => {
        const axiosError = new AxiosError(
          'Sorry, that did not work.',
          '401',
        )

        // Mock the value permanently since the retry behavior will engage
        ;(axios.get as jest.Mock).mockRejectedValue(axiosError)

        await expect(OpenDataService.makeOpenDataVehicleRequest(plate, state)).rejects.toEqual(new Error(axiosError.message))
      })

      it('should log and rethrow an axios error with a response object', async () => {
        const axiosError = new AxiosError(
          'Sorry, that did not work.',
          '401',
          undefined,
          {},
          {
            data: { errors: [{ detail: 'a' }] },
            status: 401,
            statusText:'Unauthorized',
            headers: {},
            config: {
              headers: new AxiosHeaders({
                Accept: 'application/json, text/plain, */*',
                'User-Agent': 'axios/1.4.0',
                'Accept-Encoding': 'gzip, compress, deflate, br'
              })
            }
          }
        )

        // Mock the value permanently since the retry behavior will engage
        ;(axios.get as jest.Mock).mockRejectedValue(axiosError)

        await expect(OpenDataService.makeOpenDataVehicleRequest(plate, state)).rejects.toEqual(new Error(axiosError.message))
      })

      it('should log and rethrow an axios error with a request object', async () => {
        const errorMessage = 'Sorry, that did not work.'
        const simpleError = new Error(errorMessage)

        const axiosError = new AxiosError(
          errorMessage,
          '401',
          {
            headers: new AxiosHeaders({
              server: 'nginx',
              date: 'Sat, 13 Jul 2022 21:29:46 GMT',
              'content-type': 'application/json; charset=utf-8',
              'transfer-encoding': 'chunked',
              connection: 'close',
              'access-control-allow-origin': '*',
              'x-error-code': 'not_found',
              'x-error-message': 'No service found for this URL.',
              'cache-control': 'private, no-cache, must-revalidate',
              age: '0',
              'x-socrata-region': 'aws-us-east-1-fedramp-prod',
              'strict-transport-security': 'max-age=31536000; includeSubDomains',
              'x-socrata-requestid': '5bd844a4a5b672caaba5cd3273d5927b'
            }),
            method: 'get'
          },
          {},
        )

        // Mock the value permanently since the retry behavior will engage
        ;(axios.get as jest.Mock).mockRejectedValue(axiosError)

        await expect(OpenDataService.makeOpenDataVehicleRequest(plate, state)).rejects.toEqual(simpleError)
      })
    })
  })
})

describe('determineOpenDataLastUpdatedTime', () => {
  it('should return the latest updated at time among the databases', async () => {
    const violationTableMetadataResponse = {
      data: {
        "dataUpdatedAt": "2023-11-14T17:54:58.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/869v-vr48",
        "id": "869v-vr48",
      }
    }
    const violationTableMetadataResponseWithLatestUpdatedAtTimestamp = {
      data: {
        "dataUpdatedAt": "2024-12-01T12:34:56.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/869v-vr48",
        "id": "869v-vr48",
      }
    }

    ;(axios.get as jest.Mock)
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2014
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2015
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2016
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2017
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2018
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2019
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2020
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2021
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2022
      .mockResolvedValueOnce(violationTableMetadataResponseWithLatestUpdatedAtTimestamp) // FY 2023
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2024
      .mockResolvedValueOnce(violationTableMetadataResponse) // OPACV

    await expect(OpenDataService.determineOpenDataLastUpdatedTime()).resolves.toEqual(
      new Date("2024-12-01T12:34:56.000Z")
    )
  })
})

describe('makeOpenDataMetadataRequest', () => {
  it('should request the metadata for alll violation databases', async () => {
    const violationTableMetadataResponse = {
      data: {
        "dataUpdatedAt": "2023-11-14T17:54:58.000Z",
        "dataUri": "https://data.cityofnewyork.us/resource/869v-vr48",
        "id": "869v-vr48",
      }
    }

    ;(axios.get as jest.Mock)
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2014
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2015
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2016
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2017
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2018
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2019
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2020
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2021
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2022
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2023
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2024
      .mockResolvedValueOnce(violationTableMetadataResponse) // OPACV

    await expect(OpenDataService.makeOpenDataMetadataRequest()).resolves.toEqual(
      Array(12).fill(violationTableMetadataResponse)
    )
  })

  it('should handle an open data error', async () => {
    const errorMessage = 'Sorry, that did not work.'
    const simpleError = new Error(errorMessage)

    const axiosError = new AxiosError(
      errorMessage,
      '401',
      {
        headers: new AxiosHeaders({
          server: 'nginx',
          date: 'Sat, 13 Jul 2022 21:29:46 GMT',
          'content-type': 'application/json; charset=utf-8',
          'transfer-encoding': 'chunked',
          connection: 'close',
          'access-control-allow-origin': '*',
          'x-error-code': 'not_found',
          'x-error-message': 'No service found for this URL.',
          'cache-control': 'private, no-cache, must-revalidate',
          age: '0',
          'x-socrata-region': 'aws-us-east-1-fedramp-prod',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'x-socrata-requestid': '5bd844a4a5b672caaba5cd3273d5927b'
        }),
        method: 'get'
      },
      {},
    )

    ;(axios.get as jest.Mock).mockRejectedValueOnce(axiosError)

    await expect(OpenDataService.makeOpenDataMetadataRequest()).rejects.toEqual(simpleError)
  })
})
