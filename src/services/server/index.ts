import { HttpStatusCode } from 'axios'
import http from 'http'

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

const returnResponse = (
  responseObj: http.ServerResponse,
  httpStatusCode: number,
  responseBody?: {
    data?: unknown[]
    error?: string
    response_token?: string
  },
  etag?: string
) => {
  responseObj.setHeader('Content-Type', 'application/json; charset=utf-8')
  responseObj.setHeader('Access-Control-Allow-Origin', '*')

  responseObj.statusCode = httpStatusCode

  if (httpStatusCode === HttpStatusCode.NotModified) {
    responseObj.end()
    return
  }

  if (httpStatusCode === HttpStatusCode.Ok && etag) {
    responseObj.setHeader('ETag', etag)
    responseObj.setHeader('Cache-Control', 'public, max-age=0, stale-while-revalidate=600')
  }

  responseObj.end(
    JSON.stringify(responseBody, (_, value) => {
      return typeof value === 'undefined' ? null : value
    })
  )
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

      const receivedAtDate = new Date()

      console.log('--------------------------------------')
      console.log(`request received at: ${receivedAtDate}`)
      console.log(`request url: ${request.url}\n\n`)

      if (request.url?.match(TWITTER_WEBHOOK_ENDPOINT)) {
        if (request.method == 'POST') {
          console.log('Getting a webhook event.')

          handleTwitterWebhookEvent(request)

          returnResponse(response, HttpStatusCode.Ok, {
            data: [{ success: true }],
          })
        } else if (request.method == 'GET') {
          console.log('Getting a challenge request.')

          try {
            const responseChallenge = handleTwitterRequestChallenge(request)
            returnResponse(
              response,
              HttpStatusCode.Ok,
              responseChallenge
            )
          } catch (error) {
            console.log(error)

            const body = {
              error: 'Error responding to challenge request',
            }
            returnResponse(
              response,
              HttpStatusCode.Ok,
              body
            )
          }
        } else {
          console.log('Unknown webhook request from Twitter')

          const body = {
            error: 'Unknown request type',
          }

          returnResponse(
            response,
            HttpStatusCode.Ok,
            body,
          )
        }
      } else if (request.url?.match(EXISTING_LOOKUP_PATH)) {
        const { body, etag, status_code: statusCode }: ExistingLookupResponse = await handleExistingLookup(request)

        returnResponse(response, statusCode, body, etag)
      } else if (request.url?.match(API_LOOKUP_PATH)) {
        const { body, etag, status_code: statusCode }: ExistingLookupResponse = await handleApiLookup(request)

        returnResponse(response, statusCode, body, etag)
      } else {
        console.log('Unknown request path')

        const body = {
          error: 'Unknown request type',
        }

        returnResponse(
          response,
          HttpStatusCode.NotFound,
          body,
        )
      }
    }
  )

export default createServer
