import axios, { AxiosError, AxiosHeaders } from 'axios'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import { RawViolation } from 'types/violations'
import FeatureFlags from 'utils/featureFlags/featureFlags'

import OpenDataService from '.'

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  get: jest.fn(),
  post: jest.fn(),
}))

jest.mock('constants/requests', () => ({
  // Ugly, but safest way to override BASE_DELAY
  __esModule: true,
  BASE_DELAY: 10,
}))

describe('OpenDataService.makeOpenDataVehicleRequest', () => {
  describe.each([true, false])(
    'useSocrataSodaV3Api is %s',
    (useSocrataSodaV3Api) => {
      describe('querying various open data tables', () => {
        beforeEach(() => {
          if (useSocrataSodaV3Api) {
            ;(axios.post as jest.Mock).mockReset()
          } else {
            ;(axios.get as jest.Mock).mockReset()
          }

          // mock feature flag value for all below tests
          const getFeatureFlagSpy = jest.spyOn(
            FeatureFlags,
            'getFeatureFlagValue'
          )
          getFeatureFlagSpy.mockReturnValue(useSocrataSodaV3Api)
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

        const getMedallionDatabaseQueryParams = (licensePlate: string) =>
          new URLSearchParams({
            $$app_token: 'token',
            $group: 'dmv_license_plate_number',
            $limit: '10000',
            $select: 'dmv_license_plate_number, max(last_updated_date)',
            $where: `license_number='${encodeURIComponent(
              licensePlate.toUpperCase()
            )}'`,
          })

        const getFiscalYearDatabaseQueryParams = (
          licensePlate: string,
          selectedPlateTypes?: string[]
        ) => {
          const urlSearchParams = new URLSearchParams({
            $$app_token: 'token',
            $limit: '10000',
            plate_id: licensePlate,
            registration_state: state,
          })
          if (selectedPlateTypes) {
            const plateTypesString = selectedPlateTypes
              .map((plateType) => `'${plateType}'`)
              .join(',')

            urlSearchParams.append(
              '$where',
              `plate_type in (${plateTypesString})`
            )
          }
          return urlSearchParams
        }

        const getOpenParkingAndCameraViolationsDatabaseQueryParams = (
          licensePlate: string,
          selectedPlateTypes?: string[]
        ) => {
          const urlSearchParams = new URLSearchParams({
            $$app_token: 'token',
            $limit: '10000',
            plate: licensePlate,
            state,
          })
          if (selectedPlateTypes) {
            const plateTypesString = selectedPlateTypes
              .map((plateType) => `'${plateType}'`)
              .join(',')

            urlSearchParams.append(
              '$where',
              `license_type in (${plateTypesString})`
            )
          }
          return urlSearchParams
        }

        const fiscalYearDatabaseQueryParams =
          getFiscalYearDatabaseQueryParams(plate)

        const openParkingAndCameraViolationsDatabaseQueryParams =
          getOpenParkingAndCameraViolationsDatabaseQueryParams(plate)

        const openDataHost = 'https://data.cityofnewyork.us'

        const fiscalYearResources = [
          'jt7v-77mi',
          'c284-tqph',
          'kiv2-tbus',
          '2bnn-yakx',
          'a5td-mswe',
          'faiq-9dfq',
          'p7t3-5i9s',
          'kvfd-bves',
          '7mxj-7a6y',
          '869v-vr48',
          'pvqr-7yc4',
        ]

        const v2MedallionEndpoint = `${openDataHost}/resource/rhe8-mgbb.json?${getMedallionDatabaseQueryParams(
          plate
        ).toString()}`
        const v2OpenParkingAndCameraViolationsEndpoint = `${openDataHost}/resource/nc67-uf89.json?${openParkingAndCameraViolationsDatabaseQueryParams.toString()}`

        const openDataV2Endpoints = [
          v2MedallionEndpoint,
          ...fiscalYearResources.map(
            (resource) =>
              `${openDataHost}/resource/${resource}.json?${getFiscalYearDatabaseQueryParams(
                plate
              ).toString()}`
          ),
          v2OpenParkingAndCameraViolationsEndpoint,
        ]

        // Soda API v3 headers
        const v3Headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-App-Token': 'token',
        }

        // Soda API v3 endpoints
        const v3MedallionEndpoint = `${openDataHost}/api/v3/views/rhe8-mgbb/query.json`
        const v3FiscalYearEndpoints = fiscalYearResources.map(
          (resource) => `${openDataHost}/api/v3/views/${resource}/query.json`
        )
        const v3OpenParkingAndCameraViolationsEndpoint = `${openDataHost}/api/v3/views/nc67-uf89/query.json`

        const openDataV3Endpoints = [
          v3MedallionEndpoint,
          ...v3FiscalYearEndpoints,
          v3OpenParkingAndCameraViolationsEndpoint,
        ]

        // Soda API v3 queries and headers
        const getV3MedallionQueryAndHeaders = (licensePlate: string) => ({
          query:
            'SELECT `dmv_license_plate_number`, ' +
            `max(\`last_updated_date\`) WHERE \`license_number\` = '${licensePlate}' ` +
            'GROUP BY `dmv_license_plate_number` LIMIT 10000',
          headers: v3Headers,
        })
        const getV3FiscalYearQueryAndHeaders = (
          licensePlate: string,
          selectedPlateTypes?: string[]
        ) => {
          let query =
            `SELECT * WHERE \`plate_id\` = '${licensePlate}' ` +
            "AND `registration_state` = 'NY' "

          if (selectedPlateTypes) {
            const plateTypesString = selectedPlateTypes
              .map((plateType) => `'${plateType}'`)
              .join(',')

            query += `AND \`plate_type\` IN (${plateTypesString}) `
          }
          query += `LIMIT 10000`

          return {
            query,
            headers: v3Headers,
          }
        }
        const getV3OpenParkingAndCameraViolationsQueryAndHeaders = (
          licensePlate: string,
          selectedPlateTypes?: string[]
        ) => {
          let query =
            `SELECT * WHERE \`plate\` = '${licensePlate}' ` +
            "AND `state` = 'NY' "

          if (selectedPlateTypes) {
            const plateTypesString = selectedPlateTypes
              .map((plateType) => `'${plateType}'`)
              .join(',')

            query += `AND \`license_type\` IN (${plateTypesString}) `
          }
          query += `LIMIT 10000`

          return {
            query,
            headers: v3Headers,
          }
        }

        const getOpenDataV3QueriesAndHeaders = (
          licensePlate: string,
          selectedPlateTypes?: string[]
        ) => [
          getV3MedallionQueryAndHeaders(plate),
          ...Array(v3FiscalYearEndpoints.length).fill(
            getV3FiscalYearQueryAndHeaders(plate, selectedPlateTypes)
          ),
          getV3OpenParkingAndCameraViolationsQueryAndHeaders(
            plate,
            selectedPlateTypes
          ),
        ]

        const openDataV3QueriesAndHeaders =
          getOpenDataV3QueriesAndHeaders(plate)

        const axiosFunctionToMock = useSocrataSodaV3Api ? axios.post : axios.get

        it('return a response even when no violations found querying without plate types', async () => {
          const medallionEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/rhe8-mgbb/query.json`
                : `${openDataHost}/resource/rhe8-mgbb.json?${getV3MedallionQueryAndHeaders(
                    plate
                  ).toString()}`,
            },
            data: [],
          }
          const fiscalYear2014EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/jt7v-77mi.json/query.json`
                : `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2015EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/c284-tqph/query.json`
                : `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2016EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kiv2-tbus/query.json`
                : `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2017EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/2bnn-yakx/query.json`
                : `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2018EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/a5td-mswe/query.json`
                : `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2019EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/faiq-9dfq/query.json`
                : `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2020EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/p7t3-5i9s/query.json`
                : `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2021EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kvfd-bves/query.json`
                : `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2022EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/7mxj-7a6y/query.json`
                : `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2023EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/869v-vr48/query.json`
                : `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2024EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/pvqr-7yc4/query.json`
                : `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const openParkingAndCameraViolationsEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/nc67-uf89/query.json`
                : `${openDataHost}/resource/nc67-uf89.json?${openParkingAndCameraViolationsDatabaseQueryParams.toString()}`,
            },
            data: [],
          }

          ;(axiosFunctionToMock as jest.Mock)
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
            .mockResolvedValueOnce(
              openParkingAndCameraViolationsEndpointResponse
            )

          const result = OpenDataService.makeOpenDataVehicleRequest({
            plate,
            state,
          })

          expect(await result).toEqual(
            // There should be one for every request except the first (medallion database).
            [
              fiscalYear2014EndpointResponse,
              fiscalYear2015EndpointResponse,
              fiscalYear2016EndpointResponse,
              fiscalYear2017EndpointResponse,
              fiscalYear2018EndpointResponse,
              fiscalYear2019EndpointResponse,
              fiscalYear2020EndpointResponse,
              fiscalYear2021EndpointResponse,
              fiscalYear2022EndpointResponse,
              fiscalYear2023EndpointResponse,
              fiscalYear2024EndpointResponse,
              openParkingAndCameraViolationsEndpointResponse,
            ]
          )

          if (useSocrataSodaV3Api) {
            Array.from(
              new Array(openDataV3Endpoints.length),
              (_, i) => i
            ).forEach((index) => {
              expect(axios.post).toHaveBeenNthCalledWith(
                index + 1,
                openDataV3Endpoints[index],
                { query: openDataV3QueriesAndHeaders[index].query },
                { headers: openDataV3QueriesAndHeaders[index].headers }
              )
            })
          } else {
            openDataV2Endpoints.forEach((endpoint, index) => {
              expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
            })
          }
        })

        it('return a response when violations are foundX', async () => {
          const rawOpenParkingAndCameraViolation =
            rawOpenParkingAndCameraViolationFactory.build()

          const rawFiscalYearDatabaseViolation: RawViolation =
            rawFiscalYearDatabaseViolationFactory.build()

          const medallionEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/rhe8-mgbb/query.json`
                : `${openDataHost}/resource/rhe8-mgbb.json?${getV3MedallionQueryAndHeaders(
                    plate
                  ).toString()}`,
            },
            data: [],
          }
          const fiscalYear2014EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/jt7v-77mi.json/query.json`
                : `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2015EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/c284-tqph/query.json`
                : `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2016EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kiv2-tbus/query.json`
                : `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2017EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/2bnn-yakx/query.json`
                : `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2018EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/a5td-mswe/query.json`
                : `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2019EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/faiq-9dfq/query.json`
                : `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [rawFiscalYearDatabaseViolation],
          }
          const fiscalYear2020EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/p7t3-5i9s/query.json`
                : `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2021EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kvfd-bves/query.json`
                : `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2022EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/7mxj-7a6y/query.json`
                : `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2023EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/869v-vr48/query.json`
                : `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const fiscalYear2024EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/pvqr-7yc4/query.json`
                : `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParams.toString()}`,
            },
            data: [],
          }
          const openParkingAndCameraViolationsEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/nc67-uf89/query.json`
                : `${openDataHost}/resource/nc67-uf89.json?${openParkingAndCameraViolationsDatabaseQueryParams.toString()}`,
            },
            data: [rawOpenParkingAndCameraViolation],
          }

          ;(axiosFunctionToMock as jest.Mock)
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
            .mockResolvedValueOnce(
              openParkingAndCameraViolationsEndpointResponse
            )

          const result = OpenDataService.makeOpenDataVehicleRequest({
            plate,
            state,
          })

          expect(await result).toEqual(
            // There should be one for every request except the first (medallion database).
            [
              fiscalYear2014EndpointResponse,
              fiscalYear2015EndpointResponse,
              fiscalYear2016EndpointResponse,
              fiscalYear2017EndpointResponse,
              fiscalYear2018EndpointResponse,
              fiscalYear2019EndpointResponse,
              fiscalYear2020EndpointResponse,
              fiscalYear2021EndpointResponse,
              fiscalYear2022EndpointResponse,
              fiscalYear2023EndpointResponse,
              fiscalYear2024EndpointResponse,
              openParkingAndCameraViolationsEndpointResponse,
            ]
          )

          if (useSocrataSodaV3Api) {
            Array.from(
              new Array(openDataV3Endpoints.length),
              (_, i) => i
            ).forEach((index) => {
              expect(axios.post).toHaveBeenNthCalledWith(
                index + 1,
                openDataV3Endpoints[index],
                { query: openDataV3QueriesAndHeaders[index].query },
                { headers: openDataV3QueriesAndHeaders[index].headers }
              )
            })
          } else {
            openDataV2Endpoints.forEach((endpoint, index) => {
              expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
            })
          }
        })

        it('should use the most recent identified medallion plate', async () => {
          const rawOpenParkingAndCameraViolation =
            rawOpenParkingAndCameraViolationFactory.build()

          const rawFiscalYearDatabaseViolation: RawViolation =
            rawFiscalYearDatabaseViolationFactory.build()

          const identifiedMedallionPlate = '1E65H'

          const medallionDatabaseQueryParams = getMedallionDatabaseQueryParams(
            identifiedMedallionPlate
          )

          const fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate =
            getFiscalYearDatabaseQueryParams(identifiedMedallionPlate)

          const v2MedallionEndpointWithIdentifiedMedallionPlate = `${openDataHost}/resource/rhe8-mgbb.json?${medallionDatabaseQueryParams.toString()}`

          const v2OpenDataEndpointsWithIdentifiedMedallionPlate = [
            v2MedallionEndpointWithIdentifiedMedallionPlate,
            ...openDataV2Endpoints.slice(1),
          ]

          // Soda API v3 queries and headers
          const openDataV3QueriesAndHeadersWithIdentifiedMedallionPlate = [
            getV3MedallionQueryAndHeaders(identifiedMedallionPlate),
            ...openDataV3QueriesAndHeaders.slice(1),
          ]

          const medallionEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/rhe8-mgbb/query.json`
                : v2MedallionEndpointWithIdentifiedMedallionPlate,
            },
            data: [
              {
                dmv_license_plate_number: 'ABC1234',
                license_plate: '1E65F',
                max_last_updated_date: '2022-01-20T00:00:00.000',
              },
              {
                dmv_license_plate_number: 'ABC1234',
                license_plate: '1E65G',
                max_last_updated_date: '2024-01-20T00:00:00.000',
              },
              {
                dmv_license_plate_number: 'ABC1234',
                license_plate: '1E65G',
                max_last_updated_date: '2023-01-19T00:00:00.000',
              },
            ],
          }
          const fiscalYear2014EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/jt7v-77mi.json/query.json`
                : `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2015EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/c284-tqph.json/query.json`
                : `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2016EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kiv2-tbus.json/query.json`
                : `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2017EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/2bnn-yakx.json/query.json`
                : `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2018EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/a5td-mswe.json/query.json`
                : `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2019EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/faiq-9dfq.json/query.json`
                : `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [rawFiscalYearDatabaseViolation],
          }
          const fiscalYear2020EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/p7t3-5i9s.json/query.json`
                : `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2021EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kvfd-bves.json/query.json`
                : `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2022EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/7mxj-7a6y.json/query.json`
                : `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2023EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/869v-vr48.json/query.json`
                : `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const fiscalYear2024EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/pvqr-7yc4.json/query.json`
                : `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [],
          }
          const openParkingAndCameraViolationsEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/nc67-uf89.json/query.json`
                : `${openDataHost}/resource/nc67-uf89.json?${fiscalYearDatabaseQueryParamsWithIdentifiedMedallionPlate.toString()}`,
            },
            data: [rawOpenParkingAndCameraViolation],
          }

          ;(axiosFunctionToMock as jest.Mock)
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
            .mockResolvedValueOnce(
              openParkingAndCameraViolationsEndpointResponse
            )

          const result = OpenDataService.makeOpenDataVehicleRequest({
            plate: identifiedMedallionPlate,
            state,
          })

          expect(await result).toEqual(
            // There should be one for every request except the first (medallion database).
            [
              fiscalYear2014EndpointResponse,
              fiscalYear2015EndpointResponse,
              fiscalYear2016EndpointResponse,
              fiscalYear2017EndpointResponse,
              fiscalYear2018EndpointResponse,
              fiscalYear2019EndpointResponse,
              fiscalYear2020EndpointResponse,
              fiscalYear2021EndpointResponse,
              fiscalYear2022EndpointResponse,
              fiscalYear2023EndpointResponse,
              fiscalYear2024EndpointResponse,
              openParkingAndCameraViolationsEndpointResponse,
            ]
          )

          if (useSocrataSodaV3Api) {
            Array.from(
              new Array(openDataV3Endpoints.length),
              (_, i) => i
            ).forEach((index) => {
              expect(axios.post).toHaveBeenNthCalledWith(
                index + 1,
                openDataV3Endpoints[index],
                {
                  query:
                    openDataV3QueriesAndHeadersWithIdentifiedMedallionPlate[
                      index
                    ].query,
                },
                { headers: openDataV3QueriesAndHeaders[index].headers }
              )
            })
          } else {
            v2OpenDataEndpointsWithIdentifiedMedallionPlate.forEach(
              (endpoint, index) => {
                expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
              }
            )
          }
        })

        it('return a response when violations are found querying with plate types', async () => {
          const rawOpenParkingAndCameraViolation =
            rawOpenParkingAndCameraViolationFactory.build()

          const rawFiscalYearDatabaseViolation: RawViolation =
            rawFiscalYearDatabaseViolationFactory.build()

          const medallionDatabaseQueryParamsWithPlateTypes =
            getMedallionDatabaseQueryParams(plate)
          const fiscalYearDatabaseQueryParamsWithPlateTypes =
            getFiscalYearDatabaseQueryParams(plate, plateTypes)
          const openParkingAndCameraViolationsDatabaseQueryParamsWithPlateTypes =
            getOpenParkingAndCameraViolationsDatabaseQueryParams(
              plate,
              plateTypes
            )

          const v2OpenDataEndpointsWithPlateTypes = [
            `${openDataHost}/resource/rhe8-mgbb.json?${medallionDatabaseQueryParamsWithPlateTypes.toString()}`,
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

          const medallionEndpointResponse = {
            config: {
              url: `${openDataHost}/resource/rhe8-mgbb.json?${getV3MedallionQueryAndHeaders(
                plate
              ).toString()}`,
            },
            data: [],
          }
          const fiscalYear2014EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/jt7v-77mi.json/query.json`
                : `${openDataHost}/resource/jt7v-77mi.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2015EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/c284-tqph.json/query.json`
                : `${openDataHost}/resource/c284-tqph.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2016EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kiv2-tbus.json/query.json`
                : `${openDataHost}/resource/kiv2-tbus.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2017EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/2bnn-yakx.json/query.json`
                : `${openDataHost}/resource/2bnn-yakx.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2018EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/a5td-mswe.json/query.json`
                : `${openDataHost}/resource/a5td-mswe.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2019EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/faiq-9dfq.json/query.json`
                : `${openDataHost}/resource/faiq-9dfq.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [rawFiscalYearDatabaseViolation],
          }
          const fiscalYear2020EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/p7t3-5i9s.json/query.json`
                : `${openDataHost}/resource/p7t3-5i9s.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2021EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/kvfd-bves.json/query.json`
                : `${openDataHost}/resource/kvfd-bves.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2022EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/7mxj-7a6y.json/query.json`
                : `${openDataHost}/resource/7mxj-7a6y.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2023EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/869v-vr48.json/query.json`
                : `${openDataHost}/resource/869v-vr48.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const fiscalYear2024EndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/pvqr-7yc4.json/query.json`
                : `${openDataHost}/resource/pvqr-7yc4.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [],
          }
          const openParkingAndCameraViolationsEndpointResponse = {
            config: {
              url: useSocrataSodaV3Api
                ? `${openDataHost}/api/v3/views/nc67-uf89.json/query.json`
                : `${openDataHost}/resource/nc67-uf89.json?${fiscalYearDatabaseQueryParamsWithPlateTypes.toString()}`,
            },
            data: [rawOpenParkingAndCameraViolation],
          }

          ;(axiosFunctionToMock as jest.Mock)
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
            .mockResolvedValueOnce(
              openParkingAndCameraViolationsEndpointResponse
            )

          const result = OpenDataService.makeOpenDataVehicleRequest({
            plate,
            state,
            plateTypes,
          })

          expect(await result).toEqual(
            // There should be one for every request except the first (medallion database).
            [
              fiscalYear2014EndpointResponse,
              fiscalYear2015EndpointResponse,
              fiscalYear2016EndpointResponse,
              fiscalYear2017EndpointResponse,
              fiscalYear2018EndpointResponse,
              fiscalYear2019EndpointResponse,
              fiscalYear2020EndpointResponse,
              fiscalYear2021EndpointResponse,
              fiscalYear2022EndpointResponse,
              fiscalYear2023EndpointResponse,
              fiscalYear2024EndpointResponse,
              openParkingAndCameraViolationsEndpointResponse,
            ]
          )

          if (useSocrataSodaV3Api) {
            Array.from(
              new Array(openDataV3Endpoints.length),
              (_, i) => i
            ).forEach((index) => {
              expect(axios.post).toHaveBeenNthCalledWith(
                index + 1,
                openDataV3Endpoints[index],
                {
                  query: getOpenDataV3QueriesAndHeaders(plate, plateTypes)[
                    index
                  ].query,
                },
                { headers: openDataV3QueriesAndHeaders[index].headers }
              )
            })
          } else {
            v2OpenDataEndpointsWithPlateTypes.forEach((endpoint, index) => {
              expect(axios.get).toHaveBeenNthCalledWith(index + 1, endpoint)
            })
          }
        })

        describe('handling open data errors', () => {
          it('should throw an error if process.env.NYC_OPEN_DATA_APP_TOKEN is missing', async () => {
            // store value
            const nycOpenDataToken = process.env.NYC_OPEN_DATA_APP_TOKEN

            // delete value from process.env
            delete process.env['NYC_OPEN_DATA_APP_TOKEN']

            await expect(
              OpenDataService.makeOpenDataVehicleRequest({ plate, state })
            ).rejects.toEqual(new Error('NYC Open Data app token is missing.'))

            // restore value
            process.env.NYC_OPEN_DATA_APP_TOKEN = nycOpenDataToken
          })

          it('should log and rethrow a non-axios error', async () => {
            const nonAxiosError = new Error('Sorry, that did not work.')

            // Mock the value permanently since the retry behavior will engage
            ;(axiosFunctionToMock as jest.Mock).mockRejectedValue(nonAxiosError)

            await expect(
              OpenDataService.makeOpenDataVehicleRequest({ plate, state })
            ).rejects.toEqual(new Error(nonAxiosError.message))
          })

          it('should log and rethrow an axios error with no request or response object', async () => {
            const axiosError = new AxiosError(
              'Sorry, that did not work.',
              '401'
            )

            // Mock the value permanently since the retry behavior will engage
            ;(axiosFunctionToMock as jest.Mock).mockRejectedValue(axiosError)

            await expect(
              OpenDataService.makeOpenDataVehicleRequest({ plate, state })
            ).rejects.toEqual(new Error(axiosError.message))
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
                statusText: 'Unauthorized',
                headers: {},
                config: {
                  headers: new AxiosHeaders({
                    Accept: 'application/json, text/plain, */*',
                    'User-Agent': 'axios/1.4.0',
                    'Accept-Encoding': 'gzip, compress, deflate, br',
                  }),
                },
              }
            )

            // Mock the value permanently since the retry behavior will engage
            ;(axiosFunctionToMock as jest.Mock).mockRejectedValue(axiosError)

            await expect(
              OpenDataService.makeOpenDataVehicleRequest({ plate, state })
            ).rejects.toEqual(new Error(axiosError.message))
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
                  'strict-transport-security':
                    'max-age=31536000; includeSubDomains',
                  'x-socrata-requestid': '5bd844a4a5b672caaba5cd3273d5927b',
                }),
                method: 'get',
              },
              {}
            )

            // Mock the value permanently since the retry behavior will engage
            ;(axiosFunctionToMock as jest.Mock).mockRejectedValue(axiosError)

            await expect(
              OpenDataService.makeOpenDataVehicleRequest({ plate, state })
            ).rejects.toEqual(simpleError)
          })
        })
      })
    }
  )
})

describe('determineOpenDataLastUpdatedTime', () => {
  it('should return the latest updated at time among the databases', async () => {
    const violationTableMetadataResponse = {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/869v-vr48.json',
      },
      data: {
        dataUpdatedAt: '2023-11-14T17:54:58.000Z',
        dataUri: 'https://data.cityofnewyork.us/resource/869v-vr48',
        id: '869v-vr48',
      },
    }
    const violationTableMetadataResponseWithLatestUpdatedAtTimestamp = {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/869v-vr48.json',
      },
      data: {
        dataUpdatedAt: '2024-12-01T12:34:56.000Z',
        dataUri: 'https://data.cityofnewyork.us/resource/869v-vr48',
        id: '869v-vr48',
      },
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
      .mockResolvedValueOnce(
        violationTableMetadataResponseWithLatestUpdatedAtTimestamp
      ) // FY 2023
      .mockResolvedValueOnce(violationTableMetadataResponse) // FY 2024
      .mockResolvedValueOnce(violationTableMetadataResponse) // OPACV

    await expect(
      OpenDataService.determineOpenDataLastUpdatedTime()
    ).resolves.toEqual(new Date('2024-12-01T12:34:56.000Z'))
  })
})

describe('makeOpenDataMetadataRequest', () => {
  it('should request the metadata for all violation databases', async () => {
    const violationTableMetadataResponse = {
      config: {
        url: 'https://data.cityofnewyork.us/api/views/metadata/v1/869v-vr48.json',
      },
      data: {
        dataUpdatedAt: '2023-11-14T17:54:58.000Z',
        dataUri: 'https://data.cityofnewyork.us/resource/869v-vr48',
        id: '869v-vr48',
      },
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

    await expect(
      OpenDataService.makeOpenDataMetadataRequest()
    ).resolves.toEqual(Array(12).fill(violationTableMetadataResponse))
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
          'x-socrata-requestid': '5bd844a4a5b672caaba5cd3273d5927b',
        }),
        method: 'get',
      },
      {}
    )

    ;(axios.get as jest.Mock).mockRejectedValue(axiosError)

    await expect(OpenDataService.makeOpenDataMetadataRequest()).rejects.toEqual(
      simpleError
    )
  })
})
