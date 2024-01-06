import mysql, { Connection, ConnectionConfig, MysqlError } from 'mysql'

const DATABASE_CONNECTION_LOST = 'PROTOCOL_CONNECTION_LOST"'

/**
 * Creates a string summarizing a vehicle's previous lookup details
 *
 * @param {MysqlError} error - error raised by mysql
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
  const addDisconnectHandler = (connection: any) => {
    connection.on('error', (error: MysqlError) => {
      if (error.code === DATABASE_CONNECTION_LOST) {
        console.error(error.stack)
        console.log('Lost connection. Reconnecting...')

        initializeConnection(connection.config)
      } else if (error.fatal) {
        throw error
      }
    })
  }

  const connection = mysql.createConnection(config)

  // Add handlers.
  addDisconnectHandler(connection)

  connection.connect()

  return connection
}

/**
 * instantiate mysql database connection by wrapping
 * initializeConnection
 *
 * @returns {MysqlError.Connection}
 */
export const instantiateConnection = () =>
  initializeConnection({
    host: '127.0.0.1',
    user: process.env.MYSQL_DATABASE_USER ?? '',
    password: process.env.MYSQL_DATABASE_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE_NAME ?? '',
    multipleStatements: true,
  })
