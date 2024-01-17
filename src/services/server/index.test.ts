import axios from 'axios'

import {
  rawFiscalYearDatabaseViolationFactory,
  rawOpenParkingAndCameraViolationFactory,
} from '__fixtures__/violations'
import {
  handleApiLookup,
  handleExistingLookup,
  handleTwitterRequestChallenge,
  handleTwitterWebhookEvent,
} from 'services/requestService'
import createServer from '.'

jest.mock('services/requestService')

describe('createServer', () => {
  const serverPort = 12345
  const apiEndpoint = `http://localhost:${serverPort}/api/v1`
  const twitterWebhookEndpoint = `http://localhost:${serverPort}/webhook/twitter`

  const server = createServer()

  beforeAll(async () => {
    server.listen(serverPort)
  })

  afterAll(async () => {
    server.close()
  })

  it('should query for a vehicle', async () => {
    ;(handleApiLookup as jest.Mock).mockResolvedValueOnce({
      data: [],
      successful_lookup: true,
    })

    await axios.get(`${apiEndpoint}?plate=ABC1234:NY:PAS`)

    expect(handleApiLookup as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should query for an existing lookup', async () => {
    ;(handleExistingLookup as jest.Mock).mockResolvedValueOnce({
      data: [],
      successful_lookup: true,
    })

    await axios.get(`${apiEndpoint}/lookup/a1b2c3d4`)

    expect(handleExistingLookup as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should respond to a Twitter challenge request', async () => {
    ;(handleTwitterRequestChallenge as jest.Mock).mockReturnValueOnce({
      request_token: 'ABCDEFGHIJK',
    })

    await axios.get(twitterWebhookEndpoint)

    expect(handleTwitterRequestChallenge as jest.Mock).toHaveBeenCalledTimes(1)
  })

  it('should handle a Twitter webhook event', async () => {
    ;(handleTwitterWebhookEvent as jest.Mock).mockReturnValueOnce(true)

    await axios.post(twitterWebhookEndpoint)

    expect(handleTwitterWebhookEvent as jest.Mock).toHaveBeenCalledTimes(1)
  })
})
