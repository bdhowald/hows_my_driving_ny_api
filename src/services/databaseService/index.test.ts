import { getConnectionPool, instantiateConnection } from '.'

describe('databaseService', () => {

  afterAll(() => {
    const connectionPool = getConnectionPool()
    connectionPool?.end()
  })

  describe('instantiateConnection', () => {
    it('should instantiate a connection', async () => {
      const databaseConnection = await instantiateConnection()

      // The connection is a plain object, so we can't test the
      // class of the returned object.
      expect(databaseConnection).toBeDefined()
      expect(databaseConnection.query).toBeDefined()
    })
  })

  describe('getConnectionPool', () => {
    it('the connection pool should be defined', async () => {
      const databaseConnection = await instantiateConnection()

      expect(getConnectionPool()).not.toBeUndefined()
    })
  })
})
