import { createApp } from '@/app'
import { createServer } from 'node:http'
import { env } from './config/env'
import { logger } from './utils/logger'
import { connectToDatabase } from './db/sequelize'

const main = async () => {
  try {
    await connectToDatabase()
    const app = createApp()
    const server = createServer(app)
    const port = env.AUTH_SERVICE_PORT
    server.listen(port, () => {
      logger.info({ port }, 'auth service is running')
    })

    const shutdown = () => {
      logger.info('shutting down auth service')
      Promise.all([])
        .catch((error: unknown) => {
          logger.error({ error }, 'error during shutdown auth service')
        })
        .finally(() => {
          server.close(() => process.exit(0))
        })
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    logger.error({ error }, 'failed to start auth service')
    process.exit(1)
  }
}

void main()
