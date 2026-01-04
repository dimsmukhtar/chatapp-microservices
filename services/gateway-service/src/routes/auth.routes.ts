import { AuthController } from '@/controllers/auth.controller'
import { AuthProxyService } from '@/services/auth.proxy.service'
import { validateRequest } from '@chatapp/common'
import { Router } from 'express'
import { AuthSchema } from '@/validations/auth.schemas'
import axios, { AxiosInstance } from 'axios'
import { env } from '@/config/env'

const authClient: AxiosInstance = axios.create({
  baseURL: env.AUTH_SERVICE_URL,
  timeout: 5000
})

export class Routes {
  private readonly authProxyService: AuthProxyService
  private readonly authController: AuthController
  constructor(public readonly routes: Router) {
    this.routes = Router()
    this.authProxyService = new AuthProxyService(authClient)
    this.authController = new AuthController(this.authProxyService)
    this.initializeRoutes()
  }
  private initializeRoutes(): void {
    this.routes.get('/health', this.authController.getAuthServiceHealthHandler)
    this.routes.get(
      '/health/db',
      this.authController.getAuthDatabaseHealthHandler
    )
    this.routes.get(
      '/health/rabbit',
      this.authController.getAuthRabbitHealthHandler
    )
    this.routes.post(
      '/register',
      validateRequest({ body: AuthSchema.registerSchema }),
      this.authController.registerHandler
    )
  }
}
