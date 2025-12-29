import express, { type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from '@/middlewares/error-handler'

export const createApp = (): Application => {
  const app = express()
  app.use(
    cors({
      origin: '*',
      credentials: true
    })
  )
  app.use(helmet())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.get('/', (req, res) => {
    res.send('hehehehe')
  })

  app.use((_req, res) => {
    res.status(404).json({ message: 'not found' })
  })
  app.use(errorHandler)
  return app
}
