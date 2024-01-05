import mysql, { MysqlError } from "mysql"

const initializeConnection = (config: { [key: string]: string | boolean }) => {
  const addDisconnectHandler = (connection: any) => {
    connection.on("error", (error: MysqlError) => {
      if (error.code === "PROTOCOL_CONNECTION_LOST") {
        console.error(error.stack)
        console.log("Lost connection. Reconnecting...")

        initializeConnection(connection.config);
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

export default initializeConnection
