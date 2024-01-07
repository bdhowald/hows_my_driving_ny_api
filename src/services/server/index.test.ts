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
  it('should query for a vehicle', async () => {
    const server = createServer()
    server.listen(8080)
    ;(handleApiLookup as jest.Mock).mockResolvedValueOnce({
      data: [],
      successful_lookup: true,
    })

    await axios.get('http://localhost:8080/api/v1?plate=ABC1234:NY:PAS')

    expect(handleApiLookup as jest.Mock).toHaveBeenCalledTimes(1)

    server.close()
  })

  it('should query for an existing lookup', async () => {
    const server = createServer()
    server.listen(8080)
    ;(handleExistingLookup as jest.Mock).mockResolvedValueOnce({
      data: [],
      successful_lookup: true,
    })

    await axios.get('http://localhost:8080/api/v1/lookup/a1b2c3d4')

    expect(handleExistingLookup as jest.Mock).toHaveBeenCalledTimes(1)

    server.close()
  })

  it('should respond to a Twitter challenge request', async () => {
    const server = createServer()
    server.listen(8080)
    ;(handleTwitterRequestChallenge as jest.Mock).mockResolvedValueOnce({
      request_token: 'ABCDEFGHIJK',
    })

    await axios.get('http://localhost:8080/webhook/twitter')

    expect(handleTwitterRequestChallenge as jest.Mock).toHaveBeenCalledTimes(1)

    server.close()
  })

  it('should handle a Twitter webhook event', async () => {
    const server = createServer()
    server.listen(8080)
    ;(handleTwitterWebhookEvent as jest.Mock).mockReturnValueOnce(true)

    await axios.post('http://localhost:8080/webhook/twitter')

    expect(handleTwitterWebhookEvent as jest.Mock).toHaveBeenCalledTimes(1)

    server.close()
  })
})
