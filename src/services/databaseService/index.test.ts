import { Connection, MysqlError } from 'mysql'

import { closeConnectionHandler, instantiateConnection } from '.'

describe('databaseService', () => {
  describe('closeConnectionHandler', () => {
    const consoleErrorSpy = jest.spyOn(global.console, 'error')

    beforeEach(() => {
      consoleErrorSpy.mockReset()
    })

    it('should console.error an error', () => {
      const error: MysqlError = {
        code: 'ROTOCOL_CONNECTION_LOST',
        errno: 123,
        fatal: true,
        message: 'a fatal error',
        name: 'someError',
      }

      closeConnectionHandler(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(error)
    })

    it('should silently close when no error', () => {
      closeConnectionHandler()

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('instantiateConnection', () => {
    it('should instantiate a connection', () => {
      const databaseConnection = instantiateConnection()

      // The connection is a plain object, so we can't test the
      // class of the returned object.
      expect(databaseConnection).toBeDefined()
      expect(databaseConnection.query).toBeDefined()

      // Close database connection
      databaseConnection.end(closeConnectionHandler)
    })
  })
})
