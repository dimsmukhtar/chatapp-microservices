import { AuthController } from '@/controllers/auth.controller'
import { RefreshTokens, UserCredentials } from '@/models'
import { AuthService } from '@/services/auth.service'
import { validateRequest } from '@chatapp/common'
import { Router } from 'express'
import { AuthSchema } from '@/validations/auth.schemas'

export class Routes {
  private readonly authService: AuthService
  private readonly authController: AuthController
  constructor(public readonly routes: Router) {
    this.routes = Router()
    this.authService = new AuthService(UserCredentials, RefreshTokens)
    this.authController = new AuthController(this.authService)
    this.initializeRoutes()
  }
  private initializeRoutes(): void {
    this.routes.post(
      '/register',
      validateRequest({ body: AuthSchema.registerSchema.shape.body }),
      this.authController.registerHandler
    )
    this.routes.post(
      '/login',
      validateRequest({ body: AuthSchema.loginSchema.shape.body }),
      this.authController.loginHandler
    )
    this.routes.post(
      '/refresh',
      validateRequest({ body: AuthSchema.refreshSchema.shape.body }),
      this.authController.refreshToken
    )
  }
}
