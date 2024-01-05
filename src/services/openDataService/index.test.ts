import axios from 'axios'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import { RawViolation } from 'types/violations'

import makeOpenDataVehicleRequest from '.'

jest.mock('axios')

describe('makeOpenDataVehicleRequest', () => {
  describe('querying various open data tables', () => {
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
      `${openDataHost}/resource/uvbq-3m68.json?${openParkingAndCameraViolationsDatabaseQueryParams.toString()}`,
    ]

    it('return a response even when no violations found', async () => {
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

      const result = makeOpenDataVehicleRequest(plate, state)

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

      const result = makeOpenDataVehicleRequest(plate, state)

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

    it('return a response when violations are found', async () => {
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
        `${openDataHost}/resource/uvbq-3m68.json?${openParkingAndCameraViolationsDatabaseQueryParamsWithPlateTypes.toString()}`,
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

      const result = makeOpenDataVehicleRequest(plate, state, plateTypes)

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
  })
})
