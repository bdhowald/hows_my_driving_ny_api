import { HttpStatusCode } from 'axios'
import { createHmac } from 'crypto'
import http from 'http'

import {
  EXISTING_LOOKUP_PATH,
  LOCAL_SERVER_LOCATION,
} from 'constants/endpoints'
import LookupSource from 'constants/lookupSources'
import QueryParser from 'models/queryParser'
import OpenDataService from 'services/openDataService'
import {
  ExistingLookupResponse,
  ExternalData,
  VehicleResponse
} from 'types/request'
import { PotentialVehicle, } from 'types/vehicles'
import { decamelizeKeys, decamelizeKeysOneLevel } from 'utils/camelize'
import { getExistingLookupResult } from 'utils/databaseQueries'
import detectVehicles from 'utils/detectVehicles'
import getAndProcessApiLookup from 'utils/getAndProcessApiLookup'
import { handleTwitterAccountActivityApiEvents } from 'utils/twitter'

// const externalLookupPath = '/api/v1/external-lookup'

/**
 * Respond to an API lookup
 *
 * @param request
 */
export const handleApiLookup = async (
  request: http.IncomingMessage
): Promise<ExistingLookupResponse> => {
  const requestUrl = request.url as string

  const openDataLastUpdatedTime = await OpenDataService.determineOpenDataLastUpdatedTime()
  const eTagRequestHeader = request.headers['if-none-match']

  const host = request.headers.host
  const protocol = host === LOCAL_SERVER_LOCATION ? 'http' : 'https'
  const parser = new URL(requestUrl, `${protocol}://${host}`)

  const searchParams = parser.searchParams
  const queryParser = new QueryParser(searchParams)

  const filterFields = queryParser.findFilterFields()

  const parsedQueryResults = queryParser.getPotentialVehicles()

  if ('error' in parsedQueryResults) {
    const errorBody = {
      errorMessage: parsedQueryResults.error,
    }

    return decamelizeKeys(
      { body: decamelizeKeysOneLevel(errorBody), statusCode: HttpStatusCode.BadRequest }
    ) as ExistingLookupResponse
  }

  const vehicles = detectVehicles(parsedQueryResults.potentialVehicles)

  const currentETag = `lookup-${parsedQueryResults.potentialVehicles.join('-')}-${openDataLastUpdatedTime.getTime()}`

  if (eTagRequestHeader === currentETag) {
    // If the supplied eTag matches the current one, return a 304 (Not Modified)
    return decamelizeKeysOneLevel({ statusCode: HttpStatusCode.NotModified}) as ExistingLookupResponse
  }

  const analyticsData = queryParser.getAnalyticsData()

  const externalData: ExternalData = {
    ...analyticsData,
    ...{ lookupSource: analyticsData.lookupSource ?? LookupSource.Api },
  }

  // const pathname: string | null = parser.pathname
  //
  // if ((pathname ?? '').match(externalLookupPath)) {
  //   const apiKey = searchParams.get('apiKey')
  //   if (!apiKey) {
  //     const body = {
  //       error:
  //         "You must supply an api key to perform a recorded lookup, e.g. '&api_key=xxx' ",
  //     }
  //     return returnResponse(response, HttpStatusCode.Unauthorized, body)
  //   }

  //   const databaseConnection = instantiateConnection()

  //   databaseConnection.query(
  //     queries.selectExternalLookupSource,
  //     [apiKey],
  //     (error: any, results: any) => {
  //       // Close database connection
  //       databaseConnection.end(closeConnectionHandler)

  //       if (error) {
  //         throw error
  //       }

  //       if (results.length == 0) {
  //         const body = { error: 'You supplied an invalid api key.' }
  //         return returnResponse(response, HttpStatusCode.Forbidden, body)
  //       }
  //     }
  //   )
  // }

  const vehicleResponsePromises = vehicles.map((vehicle: PotentialVehicle) =>
    getAndProcessApiLookup(vehicle, filterFields, externalData)
  )

  const vehicleResponses = await Promise.all(vehicleResponsePromises)

  let anyFailedQueries = false
  let anySuccessfulQueries = false

  const decamelized = vehicleResponses.map((vehicleResponse) => {
    const decamelizedVehicleResponse = decamelizeKeys(
      vehicleResponse
    ) as VehicleResponse

    if (
      vehicleResponse.vehicle?.statistics &&
      decamelizedVehicleResponse.vehicle?.statistics
    ) {
      const decamelizedStatistics = decamelizeKeysOneLevel(
        vehicleResponse.vehicle.statistics
      )

      decamelizedVehicleResponse.vehicle.statistics = decamelizedStatistics
    }

    if ('error' in vehicleResponse) {
      anyFailedQueries = true
    } else {
      anySuccessfulQueries = true
    }

    return decamelizedVehicleResponse
  }) as VehicleResponse[]

  const statusCode = anyFailedQueries
    ? anySuccessfulQueries
      ? HttpStatusCode.MultiStatus
      : HttpStatusCode.BadRequest
    : HttpStatusCode.Ok

  const response = {
    body: { data: decamelized },
    statusCode,
    ...(statusCode === HttpStatusCode.Ok
      ? { etag: currentETag }
      : undefined
    )
  }

  return decamelizeKeysOneLevel(response) as ExistingLookupResponse
}

/**
 * Respond to a request for a previous lookup
 *
 * @param request
 */
export const handleExistingLookup = async (
  request: http.IncomingMessage
): Promise<ExistingLookupResponse> => {
  const requestUrl = request.url as string

  const openDataLastUpdatedTime = await OpenDataService.determineOpenDataLastUpdatedTime()
  const eTagRequestHeader = request.headers['if-none-match']

  const host = request.headers.host
  const protocol = host === LOCAL_SERVER_LOCATION ? 'http' : 'https'
  const parser = new URL(requestUrl, `${protocol}://${host}`)
  const pathname = parser.pathname

  const regexString = `${EXISTING_LOOKUP_PATH}[/]*`

  const identifier = pathname.replace(new RegExp(regexString), '')
  const searchParams = parser.searchParams
  const queryParser = new QueryParser(searchParams)

  const filterFields = queryParser.findFilterFields()

  if (!identifier) {
    const body = {
      errorMessage:
        "You must supply the identifier of a lookup, e.g. 'a1b2c3d4'",
    }
    return decamelizeKeys(
      { body, statusCode: HttpStatusCode.BadRequest }
    ) as ExistingLookupResponse
  }

  const currentETag = `lookup-${identifier}-${openDataLastUpdatedTime.getTime()}`

  if (eTagRequestHeader === currentETag) {
    // If the supplied eTag matches the current one, return a 304 (Not Modified)
    return decamelizeKeys(
      { statusCode: HttpStatusCode.NotModified}
    ) as ExistingLookupResponse
  }

  const previousLookupResult = await getExistingLookupResult(identifier)
  if (!previousLookupResult) {
    return decamelizeKeys(
      { body: { data: [] }, statusCode: HttpStatusCode.Ok}
    ) as ExistingLookupResponse
  }

  const potentialVehicle = [
    `${previousLookupResult.plate}:${previousLookupResult.state}${
      previousLookupResult.plateTypes
        ? `:${previousLookupResult.plateTypes}`
        : ''
    }`,
  ]

  const vehicles = detectVehicles(potentialVehicle)

  const externalData: ExternalData = {
    ...queryParser.getAnalyticsData(),
    lookupSource: LookupSource.ExistingLookup,
    uniqueIdentifier: identifier,
    existingLookupCreatedAt: previousLookupResult.createdAt,
  }

  const vehicleResponsePromises = vehicles.map(
    async (vehicle) =>
      await getAndProcessApiLookup(vehicle, filterFields, externalData)
  )
  const vehicleResponses = await Promise.all(vehicleResponsePromises)

  const decamelized = vehicleResponses.map((vehicleResponse) => {
    const decamelizedVehicleResponse = decamelizeKeys(
      vehicleResponse
    ) as VehicleResponse

    const decamelizedStatistics = decamelizeKeysOneLevel(
      (vehicleResponse.vehicle as Record<any, any>).statistics
    ) as Record<any, any>

    (decamelizedVehicleResponse.vehicle as Record<any, any>).statistics = decamelizedStatistics

    return decamelizedVehicleResponse
  }) as VehicleResponse[]

  return decamelizeKeysOneLevel(
    { body: { data: decamelized }, etag: currentETag, statusCode: HttpStatusCode.Ok }
  ) as ExistingLookupResponse
}

/**
 * Respond to a Twitter request challenge
 *
 * @param request
 */
export const handleTwitterRequestChallenge = (
  request: http.IncomingMessage
): {
  response_token: string
} => {
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET

  if (!consumerSecret) {
    console.error('No consumer secret to encrypt challenge responses')
    throw Error('Server Error')
  }

  const requestUrl = request.url as string

  const host = request.headers.host
  const protocol = host === LOCAL_SERVER_LOCATION ? 'http' : 'https'
  const parser = new URL(requestUrl, `${protocol}://${host}`)
  const searchParams = parser.searchParams

  const crcToken = searchParams.get('crc_token') || ''

  // creates HMAC SHA-256 hash from incomming token and your consumer secret
  // construct response data with base64 encoded hash
  const hmac = createHmac('sha256', consumerSecret)

  return {
    response_token: `sha256=${hmac.update(crcToken).digest('base64')}`,
  }
}

/**
 * Parse and respond to a Twitter webhook event
 *
 * @param request
 */
export const handleTwitterWebhookEvent = (request: http.IncomingMessage) => {
  const body: any[] = []

  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET

  if (!consumerSecret) {
    console.error('No consumer secret to encrypt challenge responses')
    throw Error('Server Error')
  }

  request
    .on('data', (chunk: any) => {
      body.push(chunk)
    })
    .on('end', () => {
      // at this point, `body` has the entire request body stored in it as a string
      const completeRequestBody = Buffer.concat(body).toString()

      const hmac = createHmac('sha256', consumerSecret)
      const expectedSHA =
        'sha256=' + hmac.update(completeRequestBody).digest('base64')

      if (request.headers['x-twitter-webhooks-signature'] === expectedSHA) {
        handleTwitterAccountActivityApiEvents(completeRequestBody)
      }
    })
}
