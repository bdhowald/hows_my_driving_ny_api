import mysql, { Connection, ConnectionConfig, MysqlError } from 'mysql'

const DATABASE_CONNECTION_LOST = 'PROTOCOL_CONNECTION_LOST'

/**
 * Creates a string summarizing a vehicle's previous lookup details
 *
 * @param error - error raised by mysql
 */
export const closeConnectionHandler = (error?: MysqlError) => {
  if (error) {
    console.error(error)
    return
  }
}

/**
 * initialize a connection to a mysql database
 *
 * @param {ConnectionConfig} config - mysql connection configuration
 * @returns {Connection}
 */
const initializeConnection = (config: ConnectionConfig): Connection => {
  return mysql.createConnection(config)
}

/**
 * instantiate mysql database connection by wrapping
 * initializeConnection
 */
export const instantiateConnection = (): Connection =>
  initializeConnection({
    host: '127.0.0.1',
    user: process.env.MYSQL_DATABASE_USER,
    password: process.env.MYSQL_DATABASE_PASSWORD,
    database: process.env.MYSQL_DATABASE_NAME,
    multipleStatements: true,
  })
