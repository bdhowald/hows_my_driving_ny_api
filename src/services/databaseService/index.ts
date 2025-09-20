import * as mysql from 'mysql2/promise'

let connectionPool: mysql.Pool | undefined = undefined

/**
 * initialize a connection to a mysql database
 *
 * @param {ConnectionConfig} config - mysql connection configuration
 * @returns {Connection}
 */
const initializeConnection = (config: mysql.ConnectionOptions): mysql.Pool => {
  if (!connectionPool) {
    connectionPool = mysql.createPool(config)
  }
  return connectionPool
}

/**
 * instantiate mysql database connection by wrapping
 * initializeConnection
 */
export const instantiateConnection = async (): Promise<mysql.PoolConnection> => {
  const connectionPool = initializeConnection({
    host: '127.0.0.1',
    user: process.env.MYSQL_DATABASE_USER,
    password: process.env.MYSQL_DATABASE_PASSWORD,
    database: process.env.MYSQL_DATABASE_NAME,
    multipleStatements: true,
  })

  return await connectionPool.getConnection()
}

/**
 * return the connection pool itself, most helpful for tests
 */
export const getConnectionPool = (): mysql.Pool | undefined => {
  return connectionPool
}