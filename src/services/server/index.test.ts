import axios, { AxiosError } from 'axios'

import {
  handleApiLookup,
  handleExistingLookup,
  handleTwitterRequestChallenge,
  handleTwitterWebhookEvent,
} from 'services/requestService'
import { decamelizeKeys } from 'utils/camelize'

import createServer from '.'

jest.mock('services/requestService')

describe('createServer', () => {
  const serverPort = 12345
  const apiEndpoint = `http://localhost:${serverPort}/api/v1`
  const twitterWebhookEndpoint = `http://localhost:${serverPort}/webhook/twitter`

  const server = createServer()

  beforeEach(() => {
    ;(handleApiLookup as jest.Mock).mockClear()
    ;(handleExistingLookup as jest.Mock).mockClear()
    ;(handleTwitterRequestChallenge as jest.Mock).mockClear()
    ;(handleTwitterWebhookEvent as jest.Mock).mockClear()
  })

  beforeAll(async () => {
    server.listen(serverPort)
  })

  afterAll(async () => {
    server.close()
  })

  it('should query for a vehicle', async () => {
    ;(handleApiLookup as jest.Mock).mockResolvedValueOnce(
      decamelizeKeys({
        body: {
          data: [],
        },
        statusCode: 200,
      })
    )

    await axios.get(`${apiEndpoint}?plate=ABC1234:NY:PAS`)

    expect(handleApiLookup as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should handle an unsuccessful query for a vehicle', async () => {
    const errorMessage =  "To query multiple vehicles, use 'plate=<PLATE>:<STATE>', " +
     "ex: 'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny&plate=1234abc:nj'"

    const unsuccessfulResponse = decamelizeKeys({
      body: {
        errorMessage,
      },
      statusCode: 400,
    })

    const expected = decamelizeKeys({
      errorMessage,
    })

    ;(handleApiLookup as jest.Mock).mockResolvedValueOnce(unsuccessfulResponse)

    try {
      await axios.get(`${apiEndpoint}?plate=ABC1234:NY:PAS`)
    } catch(error: unknown) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.data).toEqual(expected)
      } else {
        fail('Error was in unexpected format')
      }
    }

    expect(handleApiLookup as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should query for an existing lookup', async () => {
    ;(handleExistingLookup as jest.Mock).mockResolvedValueOnce(
      decamelizeKeys({
        body: {
          data: [],
        },
        statusCode: 200,
      })
    )

    await axios.get(`${apiEndpoint}/lookup/a1b2c3d4`)

    expect(handleExistingLookup as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should handle an unsuccessful request for an existing lookup', async () => {
    const errorMessage = "You must supply the identifier of a lookup, e.g. 'a1b2c3d4'"

    const unsuccessfulResponse = decamelizeKeys({
      body: {
        errorMessage,
      },
      statusCode: 400,
    })

    const expected = decamelizeKeys({
      errorMessage,
    })

    ;(handleExistingLookup as jest.Mock).mockResolvedValueOnce(unsuccessfulResponse)

    try {
      await axios.get(`${apiEndpoint}/lookup/a1b2c3d4`)
    } catch(error: unknown) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.data).toEqual(expected)
      } else {
        fail('Error was in unexpected format')
      }
    }

    expect(handleExistingLookup as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should respond to a Twitter challenge request', async () => {
    ;(handleTwitterRequestChallenge as jest.Mock).mockReturnValueOnce({
      request_token: 'ABCDEFGHIJK',
    })

    await axios.get(twitterWebhookEndpoint)

    expect(handleTwitterRequestChallenge as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should handle an error when responding to a Twitter challenge request', async () => {
    ;(handleTwitterRequestChallenge as jest.Mock).mockImplementationOnce(
      () => { throw new Error('something went wrong')}
    )

    const response = await axios.get(twitterWebhookEndpoint)

    expect(response.data).toEqual({error: 'Error responding to challenge request'})

    expect(handleTwitterRequestChallenge as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should handle a Twitter webhook event', async () => {
    ;(handleTwitterWebhookEvent as jest.Mock).mockReturnValueOnce(true)

    await axios.post(twitterWebhookEndpoint)

    expect(handleTwitterWebhookEvent as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should handle a Twitter webhook event with an HTTP patch method', async () => {
    ;(handleTwitterWebhookEvent as jest.Mock).mockReturnValueOnce(true)

    const response = await axios.patch(twitterWebhookEndpoint)

    expect(response.data).toEqual({error: 'Unknown request type'})

    expect(handleTwitterWebhookEvent as jest.Mock).not.toHaveBeenCalled()
  })

  it('should handle an unknown request path', async () => {
    const response = await axios.get(`http://localhost:${serverPort}/api/unknown`).catch((_) => null)

    expect(response).toBeNull()
  })
})
