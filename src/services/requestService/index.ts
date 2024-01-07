import { HttpStatusCode } from 'axios'
import { createHmac } from 'crypto'
import http from 'http'

import {
  EXISTING_LOOKUP_PATH,
  LOCAL_SERVER_LOCATION,
} from 'constants/endpoints'
import LookupSource from 'constants/lookupSources'
import QueryParser from 'models/queryParser'
import { ExternalData, ResponseBody, VehicleResponse } from 'types/request'
import { PotentialVehicle } from 'types/vehicles'
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
): Promise<ResponseBody> => {
  const requestUrl = request.url as string

  const host = request.headers.host
  const protocol = host === LOCAL_SERVER_LOCATION ? 'http' : 'https'
  const parser = new URL(requestUrl, `${protocol}://${host}`)

  const searchParams = parser.searchParams
  const queryParser = new QueryParser(searchParams)

  const filterFields = queryParser.findFilterFields()

  const parsedQueryResults = queryParser.getPotentialVehicles()

  if ('error' in parsedQueryResults) {
    const errorBody = {
      errorCode: HttpStatusCode.BadRequest,
      errorMessage: parsedQueryResults.error,
    }

    return decamelizeKeys(errorBody)
  }

  const vehicles = detectVehicles(parsedQueryResults.potentialVehicles)

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

      // @ts-expect-error  Figure out how to prevent decamelization of boroughs and violation names
      decamelizedVehicleResponse.vehicle.statistics = decamelizedStatistics
    }

    return decamelizedVehicleResponse
  }) as VehicleResponse[]

  return { data: decamelized }
}

/**
 * Respond to a request for a previous lookup
 *
 * @param request
 */
export const handleExistingLookup = async (
  request: http.IncomingMessage
): Promise<ResponseBody> => {
  const requestUrl = request.url as string

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
      errorCode: HttpStatusCode.BadRequest,
      errorMessage:
        "You must supply the identifier of a lookup, e.g. 'a1b2c3d4'",
    }
    return body
  }

  const previousLookupResult = await getExistingLookupResult(identifier)
  if (!previousLookupResult) {
    return { data: [] }
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

    if (
      vehicleResponse.vehicle?.statistics &&
      decamelizedVehicleResponse.vehicle?.statistics
    ) {
      const decamelizedStatistics = decamelizeKeysOneLevel(
        vehicleResponse.vehicle.statistics
      )

      // @ts-expect-error  Figure out how to prevent decamelization of boroughs and violation names
      decamelizedVehicleResponse.vehicle.statistics = decamelizedStatistics
    }

    return decamelizedVehicleResponse
  }) as VehicleResponse[]

  return { data: decamelized }
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

  request
    .on('data', (chunk: any) => {
      body.push(chunk)
    })
    .on('end', () => {
      // at this point, `body` has the entire request body stored in it as a string
      const completeRequestBody = Buffer.concat(body).toString()

      const hmac = createHmac(
        'sha256',
        process.env.TWITTER_CONSUMER_SECRET ?? ''
      )
      const expectedSHA =
        'sha256=' + hmac.update(completeRequestBody).digest('base64')

      if (request.headers['x-twitter-webhooks-signature'] === expectedSHA) {
        handleTwitterAccountActivityApiEvents(completeRequestBody)
      }
    })
}
