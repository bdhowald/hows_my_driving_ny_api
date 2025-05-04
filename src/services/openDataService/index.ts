import axios, { AxiosError, AxiosResponse } from 'axios'

import {
  fiscalYearEndpoints,
  MEDALLION_DATABASE_ENDPOINT,
  NYC_OPEN_DATA_PORTAL_HOST,
  NYC_OPEN_DATA_PORTAL_METADATA_PREFIX,
  openParkingAndCameraViolationsEndpoint,
} from 'constants/endpoints'
import { camelizeKeys } from 'utils/camelize'

type MedallionReponse = {
  dmvLicensePlateNumber: string
  maxLastUpdatedDate: string
}

/**
 * Determine the most recent datetime that open data databases were updated.
 * In practice, this will likely be Open Parking and Camera Violations, but
 * could be any of them in practice.
 */
const determineOpenDataLastUpdatedTime = async () => {
  try {
    const openDataMetadata = await makeOpenDataMetadataRequest()
    const databaseUpdatedAtTimes: number[] = openDataMetadata.map((response) => new Date(response.data.dataUpdatedAt).getTime())
    const latestDatabaseUpdatedTime = new Date(Math.max(...databaseUpdatedAtTimes))
    return latestDatabaseUpdatedTime
  } catch(error) {
    console.error
  }

  return new Date()
}

const handleAxiosErrors = (error: AxiosError) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('Non-2xx response')
    console.log(error.response.data)
    console.log(error.response.status)
    console.log(error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(
      `No response received for ${error.config?.method} request to ${error.config?.url}`
    )
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error', error.message)
  }
  console.log(error.config)

  return new Error(error.message)
}

const makeOpenDataViolationDataRequest = (
  endpoint: string,
  isFiscalYearRequest: boolean,
  plate: string,
  state: string,
  plateTypes: string[] | undefined
) => {
  const plateField = isFiscalYearRequest ? 'plate_id' : 'plate'
  const plateTypeField = isFiscalYearRequest ? 'plate_type' : 'license_type'
  const stateField = isFiscalYearRequest ? 'registration_state' : 'state'

  const queryParams = new URLSearchParams({
    $$app_token: process.env.NYC_OPEN_DATA_APP_TOKEN as string,
    $limit: '10000',
    [plateField]: encodeURIComponent(plate.toUpperCase()),
    [stateField]: state.toUpperCase(),
    /**
     * select: fieldsForExternalRequests.join(',')
     */
  })

  if (plateTypes) {
    const plateTypesQuery = plateTypes
      .map((item) => `'${item.toUpperCase().trim()}'`)
      .join(',')

    queryParams.append('$where', `${plateTypeField} in (${plateTypesQuery})`)
    /**
     * queryParams.append(
     *   '$where',
     *   `${plateTypeField}${URL_ENCODED_SPACE}in(${plateTypesQuery})`
     * )
     */
  }

  return new URL(`?${queryParams.toString()}`, endpoint)
  /**
   * return `${endpoint}?${queryParams}`
   */
}

/**
 * Request the metadata for all the violation databases
 */
const makeOpenDataMetadataRequest = async (): Promise<AxiosResponse[]> => {
  const allEndpoints = fiscalYearEndpoints.concat(openParkingAndCameraViolationsEndpoint)

  const promises = allEndpoints.map(async (endpoint: string) => {
    const resourceIdentifier = endpoint.replace(`${NYC_OPEN_DATA_PORTAL_HOST}/resource/`, '')
    const metadataUrl = new URL(resourceIdentifier, NYC_OPEN_DATA_PORTAL_METADATA_PREFIX)

    return axios.get(metadataUrl.toString())
  })

  return await Promise.all(promises)
}

const makeOpenDataVehicleRequest = async (
  plate: string,
  state: string,
  plateTypes?: string[] | undefined
): Promise<AxiosResponse[]> => {
  // Checking for selected fields for violations
  /**
   * const fieldsForExternalRequests = 'violations' in selectedFields
   *   ? Object.keys(selectedFields['violations'])
   *   : {}
   */

  const appToken = process.env.NYC_OPEN_DATA_APP_TOKEN

  if (!appToken) {
    throw Error('NYC Open Data app token is missing.')
  }

  let rectifiedPlate = plate

  try {
    const possibleMedallionPlate = await retrievePossibleMedallionVehiclePlate(
      plate
    )
    if (possibleMedallionPlate) {
      rectifiedPlate = possibleMedallionPlate
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const nonAxiosError = handleAxiosErrors(error)
      throw nonAxiosError
    } else {
      console.error(error)
      throw error
    }
  }

  // Fiscal Year Databases
  const promises = fiscalYearEndpoints.map(
    async (endpoint: string): Promise<AxiosResponse> => {
      const fiscalYearURL = makeOpenDataViolationDataRequest(
        endpoint,
        true,
        rectifiedPlate,
        state,
        plateTypes
      )

      return axios.get(fiscalYearURL.toString())
    }
  )

  // Open Parking & Camera Violations Database
  const openParkingAndCameraViolationsURL = makeOpenDataViolationDataRequest(
    openParkingAndCameraViolationsEndpoint,
    false,
    rectifiedPlate,
    state,
    plateTypes
  )
  promises.push(axios.get(openParkingAndCameraViolationsURL.toString()))

  return await Promise.all(promises)
}

const retrievePossibleMedallionVehiclePlate = async (
  plate: string
): Promise<string | undefined> => {
  const medallionEndpointSearchParams = new URLSearchParams({
    $$app_token: process.env.NYC_OPEN_DATA_APP_TOKEN as string,
    $group: 'dmv_license_plate_number',
    $limit: '10000',
    $select: 'dmv_license_plate_number, max(last_updated_date)',
    $where: `license_number='${encodeURIComponent(plate.toUpperCase())}'`,
  })

  const medallionUrlObject = new URL(
    `?${medallionEndpointSearchParams}`,
    MEDALLION_DATABASE_ENDPOINT
  )

  const medallionEndpointResponse = await axios.get(
    medallionUrlObject.toString()
  )

  const medallionResults = camelizeKeys(
    medallionEndpointResponse.data
  ) as MedallionReponse[]

  if (!medallionResults.length) {
    return undefined
  }

  console.log(medallionResults)

  const currentMedallionHolder = medallionResults.reduce((prev, cur) => {
    const previousDate = new Date(prev.maxLastUpdatedDate)
    const currentDate = new Date(cur.maxLastUpdatedDate)
    return currentDate > previousDate ? cur : prev
  })

  return currentMedallionHolder.dmvLicensePlateNumber
}

export default {
  determineOpenDataLastUpdatedTime,
  makeOpenDataMetadataRequest,
  makeOpenDataVehicleRequest
}
