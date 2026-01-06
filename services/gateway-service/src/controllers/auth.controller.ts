import { RequestHandler } from 'express'
import { AuthProxyService } from '@/services/auth.proxy.service'
import { asyncWrapper } from '@chatapp/common'
import { LoginPayload, RegisterPayload } from '@/types/auth'

export class AuthController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  public getAuthServiceHealthHandler: RequestHandler = asyncWrapper(
    async (req, res) => {
      const response = await this.authProxyService.authServiceHealth()
      res.status(200).json(response)
    }
  )

  public getAuthDatabaseHealthHandler: RequestHandler = asyncWrapper(
    async (req, res) => {
      const response = await this.authProxyService.authDatabaseServicehealth()
      res.status(200).json(response)
    }
  )

  public getAuthRabbitHealthHandler: RequestHandler = asyncWrapper(
    async (req, res) => {
      const response = await this.authProxyService.authRabbitServiceHealth()
      res.status(200).json(response)
    }
  )
  public registerHandler: RequestHandler = asyncWrapper(async (req, res) => {
    const payload = req.body as RegisterPayload
    const response = await this.authProxyService.register(payload)
    res.status(201).json(response)
  })

  public loginHandler: RequestHandler = asyncWrapper(async (req, res) => {
    const payload = req.body as LoginPayload
    const response = await this.authProxyService.login(payload)
    res.status(200).json(response)
  })

  public refreshTokenHandler: RequestHandler = asyncWrapper(
    async (req, res) => {
      const response = await this.authProxyService.refreshToken(
        req.body.refreshToken
      )
      res.status(200).json(response)
    }
  )
}
