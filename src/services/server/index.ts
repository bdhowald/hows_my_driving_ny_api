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

const returnResponse = (
  responseObj: http.ServerResponse,
  httpStatusCode: number,
  responseBody: {
    data?: unknown[]
    error?: string
    response_token?: string
  }
) => {
  responseObj.setHeader('Content-Type', 'application/json; charset=utf-8')
  responseObj.setHeader('Access-Control-Allow-Origin', '*')
  responseObj.writeHead(httpStatusCode)
  responseObj.end(
    JSON.stringify(responseBody, (_, value) =>
      typeof value === 'undefined' ? null : value
    )
  )
}

const stripReturnData = (obj: any, selectedFields: any) => {
  // Return only what we want.
  const fieldNames = Object.getOwnPropertyNames(obj)

  if (selectedFields && Object.keys(selectedFields).length > 0) {
    fieldNames.forEach((field) => {
      if (field in selectedFields) {
        if (
          obj[field] != undefined &&
          Object.keys(selectedFields[field]).length > 0
        ) {
          stripReturnData(obj[field], selectedFields[field])
        }
      } else {
        delete obj[field]
      }
    })
  }
  return obj
}

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
            const body = {
              error: 'Error responding to challenge request',
            }
            returnResponse(
              response,
              HttpStatusCode.InternalServerError,
              body
            )
          }
        }
      } else if (request.url?.match(EXISTING_LOOKUP_PATH)) {
        const result = await handleExistingLookup(request)

        if ('errorCode' in result) {
          returnResponse(response, HttpStatusCode.BadRequest, result)
        }
        returnResponse(response, HttpStatusCode.Ok, result)
      } else if (request.url?.match(API_LOOKUP_PATH)) {
        const result = await handleApiLookup(request)

        if ('errorCode' in result && result.errorCode) {
          returnResponse(response, result.errorCode, result)
        }
        returnResponse(response, HttpStatusCode.Ok, result)
      }
    }
  )

export default createServer
