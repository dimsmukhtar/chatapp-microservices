import express, { Request, Response, Router, type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from '@/middlewares/error-handler'
import { closeDatabase, connectToDatabase, sequelize } from './db/sequelize'
import { logger } from './utils/logger'
import { Env } from './config/env'
import { createInternalAuthMiddleware } from '@chatapp/common'
import { initModels } from './models'
import { startAuthUserRegisterConsumer } from './messaging/consumers/auth-user-registered.consumer'

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
    this.app.use(
      createInternalAuthMiddleware(this.env.INTERNAL_API_TOKEN, {
        exemptPaths: ['/health']
      })
    )
  }

  private initializeRoutes(): void {
    this.app.use('/users', this.routes)
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }

  private initializeHealthCheck(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ message: 'USER SERVICE SERVER OK' })
    })

    this.app.get('/health/db', async (_req: Request, res: Response) => {
      try {
        await sequelize.query('SELECT 1')
        res.status(200).json({ message: 'USER POSTGRESQL DATABASE OK' })
      } catch (error) {
        logger.error(error)
        res.status(500).json({ message: 'USER POSTGRESQL DATABASE Unhealthy' })
      }
    })
  }

  public async startServer(): Promise<void> {
    try {
      await connectToDatabase()
      await initModels() // development purposes
      await startAuthUserRegisterConsumer()
      this.server = this.app.listen(this.env.USER_SERVICE_PORT, () => {
        logger.info(
          `user service is running on port ${this.env.USER_SERVICE_PORT}`
        )
      })
      this.setupGracefulShutdown()
    } catch (error) {
      logger.error({
        from: 'app.ts',
        message: 'user service failed to start server'
      })
      process.exit(1)
    }
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT']
    const FORCE_EXIT_TIMEOUT = 10_000

    const shutdown = async (signal: NodeJS.Signals) => {
      logger.warn(`recievied ${signal}, shutting down...`)

      const forceExit = setTimeout(() => {
        logger.error('Force shutdown due to timeout')
        process.exit(1)
      }, FORCE_EXIT_TIMEOUT).unref()
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
        clearTimeout(forceExit)
        logger.info('user server shutdown gracefully')
        process.exit(0)
      } catch (error) {
        logger.error({
          from: 'app.ts',
          message: 'failed to shutdown the user server'
        })
        process.exit(1)
      }
    }
    signals.forEach((signal) => process.once(signal, shutdown))
    process.once('unhandledRejection', (reason) => {
      logger.error({
        from: 'app.ts',
        message: 'recieved unhandled rejection',
        reason
      })
      shutdown('SIGTERM')
    })
    process.once('uncaughtException', (reason) => {
      logger.error({
        from: 'app.ts',
        message: 'recieved uncaught exception',
        reason
      })
      shutdown('SIGTERM')
    })
  }
}
