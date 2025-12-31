import express, { Request, Response, Router, type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { errorHandler } from '@/middlewares/error-handler'
import { closeDatabase, connectToDatabase, sequelize } from './db/sequelize'
import { logger } from './utils/logger'
import { Env } from './config/env'

export class App {
  private app: Application
  private server?: ReturnType<Application['listen']>
  constructor(
    private readonly env: Env,
    private readonly routes: Router
  ) {
    this.app = express()
    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
    this.initializeHealthCheck()
  }

  private initializeMiddleware(): void {
    this.app.use(
      cors({
        origin: '*',
        credentials: true
      })
    )
    this.app.use(helmet())
    this.app.use(cookieParser())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
  }

  private initializeRoutes(): void {
    this.app.use('/auth', this.routes)
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }

  private initializeHealthCheck(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'SERVER OK' })
    })

    this.app.get('/health/db', async (_req: Request, res: Response) => {
      try {
        await sequelize.query('SELECT 1')
        res.status(200).json({ message: 'DATABASE OK' })
      } catch (error) {
        logger.error(error)
        res.status(500).json({ message: 'Uunhealthy' })
      }
    })
  }

  public async startServer(): Promise<void> {
    try {
      await connectToDatabase()
      this.server = this.app.listen(this.env.AUTH_SERVICE_PORT, () => {
        logger.info(
          `auth service is running on port ${this.env.AUTH_SERVICE_PORT}`
        )
      })
      this.setupGracefulShutdown()
    } catch (error) {
      logger.error({ error }, 'auth service failed to start server')
      process.exit(1)
    }
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT']
    const shutdown = async (signal: NodeJS.Signals) => {
      logger.warn(`recievied ${signal}, shutting down...`)
      try {
        await closeDatabase()
        if (this.server) this.server.close()
        logger.info('server shutdown gracefully')
        process.exit(0)
      } catch (error) {
        logger.error({ error }, 'failed to shutdown the server')
      }
    }
    signals.forEach((signal) => process.on(signal, shutdown))
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'recieved unhandled rejection')
      shutdown('unhandledRejection' as NodeJS.Signals)
    })
    process.on('uncaughtException', (reason) => {
      logger.error({ reason }, 'recieved uncaught exception')
      shutdown('uncaughtException' as NodeJS.Signals)
    })
  }
}
