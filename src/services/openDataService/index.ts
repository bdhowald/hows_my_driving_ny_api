import axios, { AxiosError, AxiosResponse } from 'axios'
import { LRUCache } from 'lru-cache'

import {
  fiscalYearEndpoints,
  MEDALLION_DATABASE_ENDPOINT,
  NYC_OPEN_DATA_PORTAL_HOST,
  NYC_OPEN_DATA_PORTAL_METADATA_PREFIX,
  openParkingAndCameraViolationsEndpoint,
} from 'constants/endpoints'
import LookupType from 'constants/lookupTypes'
import { BASE_DELAY } from 'constants/requests'
import {
  MILLISECONDS_IN_ONE_SECOND,
  SECONDS_IN_ONE_MINUTE,
  MINUTES_IN_ONE_HOUR,
} from 'constants/time'
import { camelizeKeys } from 'utils/camelize'
import PriorityQueue from 'utils/priorityQueue/priorityQueue'
import getMixpanelInstance from 'utils/tracking/mixpanel/mixpanel'

const MAX_CONCURRENT_OPEN_DATA_REQUESTS = 10
const TEST_ENVIRONMENT = 'test'
const priorityQueue = new PriorityQueue(MAX_CONCURRENT_OPEN_DATA_REQUESTS)

type MedallionReponse = {
  dmvLicensePlateNumber: string
  maxLastUpdatedDate: string
}

type OpenDataVehicleRequestProps = {
  plate: string,
  state: string,
  plateTypes?: string[] | undefined
  lookupType?: LookupType | undefined
}

type RetryOptions = {
  asyncRequestFn: () => Promise<AxiosResponse>
  baseDelay?: number
  jitter?: boolean
  maxRetries?: number
  onRetry?: (attempt: number, error: any, delay: number) => void
  priority?: number
  shouldRetry?: (error: any) => boolean
  shouldTrackRequestTiming?: boolean
}

let lruCache: LRUCache<string, Promise<AxiosResponse>> | null = null

/**
 * Takes arguments for an open data request and turns them into the
 * URL object to be fetched.
 */
const createOpenDataViolationRequestUrl = (
  endpoint: string,
  isFiscalYearRequest: boolean,
  plate: string,
  state: string,
  plateTypes: string[] | undefined
): URL => {
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
 * Determine the most recent datetime that open data databases were updated.
 * In practice, this will likely be Open Parking and Camera Violations, but
 * could be any of them in practice.
 */
const determineOpenDataLastUpdatedTime = async (
  lookupType?: LookupType | undefined
): Promise<Date> => {
  try {
    const openDataMetadata = await makeOpenDataMetadataRequest(lookupType)
    const databaseUpdatedAtTimes: number[] = openDataMetadata.map((response) => new Date(response.data.dataUpdatedAt).getTime())
    const latestDatabaseUpdatedTime = new Date(Math.max(...databaseUpdatedAtTimes))
    return latestDatabaseUpdatedTime
  } catch(error) {
    console.error
  }

  return new Date()
}

const cacheOptions = {
  max: 100,
  ttl: MILLISECONDS_IN_ONE_SECOND * SECONDS_IN_ONE_MINUTE * MINUTES_IN_ONE_HOUR * 6, // six hours
}

/**
 *
 * Initialize the cache if it is not yet ready.
 */
const initializeCache = () => {
  if (process.env.NODE_ENV === TEST_ENVIRONMENT) {
    return new LRUCache(cacheOptions)
  }

  if (!lruCache) {
    lruCache = new LRUCache(cacheOptions)
  }
  return lruCache
}

const handleAxiosErrors = (error: AxiosError): Error => {
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


/**
 * Request the metadata for all the violation databases
 */
const makeOpenDataMetadataRequest = async (
  lookupType?: LookupType | undefined
): Promise<AxiosResponse[]> => {
  const allEndpoints = fiscalYearEndpoints.concat(openParkingAndCameraViolationsEndpoint)

  const promises = allEndpoints.map(async (endpoint: string) => {
    const resourceIdentifier = endpoint.replace(`${NYC_OPEN_DATA_PORTAL_HOST}/resource/`, '')
    const metadataUrl = new URL(resourceIdentifier, NYC_OPEN_DATA_PORTAL_METADATA_PREFIX)

    const stringifiedMetadataUrl = metadataUrl.toString()

    const metadataRequest = makeRequestWithCache({
      asyncRequestFn: () => axios.get(stringifiedMetadataUrl),
      cacheKey: stringifiedMetadataUrl,
      onRetry: () => {
        console.log(
          `Request to ${stringifiedMetadataUrl} failed, possibly retrying`
        )

        const mixpanelInstance = getMixpanelInstance()
        mixpanelInstance?.track('open_data_metadata_request_error_before_retry', {
          endpoint: stringifiedMetadataUrl,
        })
      },
      priority: lookupType === LookupType.NEW_LOOKUP ? 1 : 0,
    })

    return metadataRequest
  })

  const settledPromises = await Promise.allSettled(promises)

  const rejected = settledPromises.filter(result => result.status === 'rejected')
  if (rejected.length > 0) {
    throw (rejected[0] as PromiseRejectedResult).reason
  }

  return settledPromises.map(result => (result as PromiseFulfilledResult<any>).value)
}

const makeOpenDataVehicleRequest = async (
  {
    plate,
    state,
    plateTypes,
    lookupType,
  }: OpenDataVehicleRequestProps
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

      // Construct URL object.
      const fiscalYearUrl = createOpenDataViolationRequestUrl(
        endpoint,
        true,
        rectifiedPlate,
        state,
        plateTypes
      )

      const stringifiedUrl = fiscalYearUrl.toString()

      // Construct promise with retry capability
      const requestPromise = makeRequestWithRetries({
        asyncRequestFn: () => axios.get(stringifiedUrl),
        onRetry: () => {
          console.log(`Request to ${stringifiedUrl} failed, possibly retrying`)

          const mixpanelInstance = getMixpanelInstance()
          mixpanelInstance?.track('open_data_violation_database_request_error_before_retry', {
            endpoint,
            plate: rectifiedPlate,
            plateTypes,
            state,
          })
        },
        priority: lookupType === LookupType.NEW_LOOKUP ? 1 : 0,
      })

      return requestPromise
    }
  )

  // Open Parking & Camera Violations Database
  const openParkingAndCameraViolationsUrl = createOpenDataViolationRequestUrl(
    openParkingAndCameraViolationsEndpoint,
    false,
    rectifiedPlate,
    state,
    plateTypes
  )

  const stringifiedOpenParkingAndCameraViolationsUrl = openParkingAndCameraViolationsUrl.toString()

  const openParkingAndCameraViolationsRequest = makeRequestWithRetries({
    asyncRequestFn: () => axios.get(stringifiedOpenParkingAndCameraViolationsUrl),
    onRetry: () => {
      console.log(
        `Request to ${stringifiedOpenParkingAndCameraViolationsUrl} failed, possibly retrying`
      )

      const mixpanelInstance = getMixpanelInstance()
      mixpanelInstance?.track('open_data_violation_database_request_error_before_retry', {
        endpoint: openParkingAndCameraViolationsEndpoint,
        plate: rectifiedPlate,
        plateTypes,
        state,
      })
    },
    priority: lookupType === LookupType.NEW_LOOKUP ? 1 : 0,
  })

  promises.push(openParkingAndCameraViolationsRequest)

  return await Promise.all(promises)
}

/**
 *
 * Fetch a url's response from the cache, if it exists, otherwise undefined.
 */
const makeRequestWithCache = async (
  retryOptions: RetryOptions & { cacheKey?: string }
): Promise<AxiosResponse> => {
  const localLruCache = initializeCache()

  const cacheKey = retryOptions.cacheKey

  if (cacheKey && localLruCache.has(cacheKey)) {
    const cachedResponse = localLruCache.get(cacheKey) as Promise<AxiosResponse>

    if (cachedResponse) {
      return cachedResponse
    }
  }

  // Start retrying with backoff
  const requestPromise = makeRequestWithRetries(retryOptions)
    .then(response => {
      if (cacheKey) {
        // Cache the resolved response wrapped in a resolved Promise
        localLruCache.set(cacheKey, Promise.resolve(response))
      }
      return response
    })
    .catch(error => {
      if (cacheKey && localLruCache.has(cacheKey)) {
        // On failure, remove from cache so next call retries fresh
        localLruCache.delete(cacheKey)
      }
      throw error
    })

  if (cacheKey) {
    // Cache the in-flight promise immediately
    localLruCache.set(cacheKey, requestPromise)
  }

  return requestPromise
}

/**
 *
 * Makes a request with retry capability, taking in arguments like max retries,
 * a base delay amount, a jitter amount, and functions to determine if a retry
 * should happen and what to do when a retry is needed.
 */
const makeRequestWithRetries = async (
  {
    asyncRequestFn,
    maxRetries = 5,
    baseDelay = BASE_DELAY,
    jitter = true,
    onRetry = (args: any) => {},
    priority = 0,
    shouldRetry = (args: any) => true,
    shouldTrackRequestTiming = false,
  }: RetryOptions
): Promise<AxiosResponse> => {
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      const requestStart = Date.now()
      const result = await priorityQueue.add(() => asyncRequestFn(), priority)

      if (shouldTrackRequestTiming) {
        const externalUrl = result.config.url

        if (externalUrl) {
          const urlObject = new URL(externalUrl)
          const mixpanelInstance = getMixpanelInstance()
          const requestFinish = Date.now()

          mixpanelInstance?.track('open_data_database_request_completed', {
            endpoint: urlObject.origin + urlObject.pathname,
            timeToCompleteInSeconds: (requestFinish - requestStart) / MILLISECONDS_IN_ONE_SECOND
          })
        }
      }
      return result
    } catch (error: unknown) {
      if (attempt === maxRetries) {
        console.log(`Requests failed after ${maxRetries+1} attempts, throwing error`)
        throw error
      }

      if (!shouldRetry) {
        console.log(`Retry condition failed, throwing error`)
        throw error
      }

      // delay grows by power of two each time
      const delay = jitter
        ? Math.random() * baseDelay * 2 ** attempt
        : baseDelay * 2 ** attempt

      onRetry(attempt + 1, error, delay)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    attempt++
  }

  throw new Error('Unexpected exit from makeRequestWithRetries')
}

/**
 * Returns a promise of the license plate number of a vehicle with an
 * input medallion number.
 */
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

  const stringifiedMedallionRequestUrl = medallionUrlObject.toString()

  const medallionDatabaseRequest = makeRequestWithRetries({
    asyncRequestFn: () => axios.get(stringifiedMedallionRequestUrl),
    onRetry: () => {
      console.log(
        `Request to ${stringifiedMedallionRequestUrl} failed, possibly retrying`
      )

      const mixpanelInstance = getMixpanelInstance()
      mixpanelInstance?.track('open_data_medallion_database_request_error_before_retry', {
        endpoint: MEDALLION_DATABASE_ENDPOINT,
        plate,
      })
    }
  })

  const medallionEndpointResponse = await medallionDatabaseRequest

  const medallionResults = camelizeKeys(
    medallionEndpointResponse.data
  ) as MedallionReponse[]

  if (!medallionResults.length) {
    return undefined
  }

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
