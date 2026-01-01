import express, { Request, Response, Router, type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from '@/middlewares/error-handler'
import { closeDatabase, connectToDatabase, sequelize } from './db/sequelize'
import { logger } from './utils/logger'
import { Env } from './config/env'
import { createInternalAuthMiddleware } from '@chatapp/common'
import { initModels } from './models'
import {
  closeRabbitAndPublisher,
  connectToRabbitAndInitPublisher
} from './messaging/event-publishing'

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
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(createInternalAuthMiddleware(this.env.INTERNAL_AUTH_TOKEN))
  }

  private initializeRoutes(): void {
    this.app.use('/auth', this.routes)
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }

  private initializeHealthCheck(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ message: 'AUTH SERVICE SERVER OK' })
    })

    this.app.get('/health/db', async (_req: Request, res: Response) => {
      try {
        await sequelize.query('SELECT 1')
        res.status(200).json({ message: 'AUTH MYSQL DATABASE OK' })
      } catch (error) {
        logger.error(error)
        res.status(500).json({ message: 'AUTH MYSQL DATABASE Uunhealthy' })
      }
    })
  }

  public async startServer(): Promise<void> {
    try {
      await connectToDatabase()
      await initModels() // development purposes
      await connectToRabbitAndInitPublisher()
      this.server = this.app.listen(this.env.AUTH_SERVICE_PORT, () => {
        logger.info(
          `auth service is running on port ${this.env.AUTH_SERVICE_PORT}`
        )
      })
      this.setupGracefulShutdown()
    } catch (error) {
      logger.error({
        from: 'app.ts',
        message: 'auth service failed to start server'
      })
      process.exit(1)
    }
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT']
    const shutdown = async (signal: NodeJS.Signals) => {
      logger.warn(`recievied ${signal}, shutting down...`)
      try {
        if (this.server) {
          await new Promise<void>((resolve, reject) => {
            this.server!.close((err) => {
              if (err) reject(err)
              else resolve()
            })
          })
        }

        await closeDatabase()
        await closeRabbitAndPublisher()
        logger.info('auth server shutdown gracefully')
      } catch (error) {
        logger.error({
          from: 'app.ts',
          message: 'failed to shutdown the auth server'
        })
      }
    }
    signals.forEach((signal) => process.once(signal, shutdown))
    process.once('unhandledRejection', (reason) => {
      logger.error({
        from: 'app.ts',
        message: 'recieved unhandled rejection',
        reason
      })
      shutdown('unhandledRejection' as NodeJS.Signals)
    })
    process.once('uncaughtException', (reason) => {
      logger.error({
        from: 'app.ts',
        message: 'recieved uncaught exception',
        reason
      })
      shutdown('uncaughtException' as NodeJS.Signals)
    })
  }
}
