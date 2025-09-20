import { SERVER_PORT } from 'constants/endpoints'
import createServer from 'services/server'

const server = createServer()

server.listen(SERVER_PORT)
