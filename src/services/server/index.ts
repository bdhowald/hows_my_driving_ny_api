import { HttpStatusCode } from 'axios'
import http from 'http'
import zlib from 'zlib'

import {
  API_LOOKUP_PATH,
  EXISTING_LOOKUP_PATH,
  TWITTER_WEBHOOK_ENDPOINT,
} from 'constants/endpoints'
import {
  handleApiLookup,
  handleExistingLookup,
  handleTwitterRequestChallenge,
  handleTwitterWebhookEvent,
} from 'services/requestService'
import { ExistingLookupResponse } from 'types/request'
import { stat } from 'fs'

type ReturnResponseProps = {
  etag?: string
  httpStatusCode: number,
  responseBody?: {
    data?: unknown[]
    error?: string
    response_token?: string
  },
  responseObject: http.ServerResponse,
  useGZip: boolean
}

const returnResponse = ({
  etag,
  httpStatusCode,
  responseBody,
  responseObject,
  useGZip,
}: ReturnResponseProps) => {
  responseObject.setHeader('Content-Type', 'application/json; charset=utf-8')
  responseObject.setHeader('Access-Control-Allow-Origin', '*')

  responseObject.statusCode = httpStatusCode

  if (httpStatusCode === HttpStatusCode.NotModified) {
    responseObject.end()
    return
  }

  if (httpStatusCode === HttpStatusCode.Ok && etag) {
    responseObject.setHeader('ETag', etag)
    responseObject.setHeader('Cache-Control', 'public, max-age=0, stale-while-revalidate=600')
  }

  const stringifiedBody = JSON.stringify(responseBody, (_, value) => {
    return typeof value === 'undefined' ? null : value
  })

  if (useGZip) {
    responseObject.statusCode = httpStatusCode
    responseObject.setHeader('Content-Encoding', 'gzip')

    const gzip = zlib.createGzip()
    gzip.pipe(responseObject)
    gzip.end(stringifiedBody)
    return
  }

  responseObject.end(stringifiedBody)
}

// const stripReturnData = (obj: any, selectedFields: any) => {
//   // Return only what we want.
//   const fieldNames = Object.getOwnPropertyNames(obj)

//   if (selectedFields && Object.keys(selectedFields).length > 0) {
//     fieldNames.forEach((field) => {
//       if (field in selectedFields) {
//         if (
//           obj[field] != undefined &&
//           Object.keys(selectedFields[field]).length > 0
//         ) {
//           stripReturnData(obj[field], selectedFields[field])
//         }
//       } else {
//         delete obj[field]
//       }
//     })
//   }
//   return obj
// }

const createServer = () =>
  http.createServer(
    async (request: http.IncomingMessage, response: http.ServerResponse) => {
      // Set response headers
      response.setHeader('Content-Type', 'application/json;charset=utf-8')
      response.setHeader('Access-Control-Allow-Origin', '*')

      const acceptEncoding = request.headers['accept-encoding'] || ''
      const useGZip = acceptEncoding.includes('gzip')

      const receivedAtDate = new Date()

      console.log('--------------------------------------')
      console.log(`request received at: ${receivedAtDate}`)
      console.log(`request url: ${request.url}\n\n`)

      if (request.url?.match(TWITTER_WEBHOOK_ENDPOINT)) {
        if (request.method == 'POST') {
          console.log('Getting a webhook event.')

          handleTwitterWebhookEvent(request)

          returnResponse({
            httpStatusCode: HttpStatusCode.Ok,
            responseBody: {
              data: [{ success: true }],
            },
            responseObject: response,
            useGZip
          })
        } else if (request.method == 'GET') {
          console.log('Getting a challenge request.')

          try {
            const responseChallenge = handleTwitterRequestChallenge(request)
            returnResponse({
              httpStatusCode: HttpStatusCode.Ok,
              responseBody: responseChallenge,
              responseObject: response,
              useGZip,
            })
          } catch (error) {
            console.log(error)

            const body = {
              error: 'Error responding to challenge request',
            }
            returnResponse({
              httpStatusCode: HttpStatusCode.Ok,
              responseBody: body,
              responseObject: response,
              useGZip,
            })
          }
        } else {
          console.log('Unknown webhook request from Twitter')

          const body = {
            error: 'Unknown request type',
          }

          returnResponse({
            httpStatusCode: HttpStatusCode.Ok,
            responseBody: body,
            responseObject: response,
            useGZip,
          })
        }
      } else if (request.url?.match(EXISTING_LOOKUP_PATH)) {
        const { body, etag, status_code: statusCode }: ExistingLookupResponse = await handleExistingLookup(request)

        returnResponse({
          etag,
          httpStatusCode: HttpStatusCode.Ok,
          responseBody: body,
          responseObject: response,
          useGZip,
        })
      } else if (request.url?.match(API_LOOKUP_PATH)) {
        const { body, etag, status_code: statusCode }: ExistingLookupResponse = await handleApiLookup(request)

        returnResponse({
          etag,
          httpStatusCode: HttpStatusCode.Ok,
          responseBody: body,
          responseObject: response,
          useGZip,
        })
      } else {
        console.log('Unknown request path')

        const body = {
          error: 'Unknown request type',
        }

        returnResponse({
          httpStatusCode: HttpStatusCode.NotFound,
          responseBody: body,
          responseObject: response,
          useGZip,
        })
      }
    }
  )

export default createServer
