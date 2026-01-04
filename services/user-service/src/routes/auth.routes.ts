// import { UserController } from '@/controllers/user.controller'
import { Users } from '@/models'
import { UserService } from '@/services/user.service'
import { validateRequest } from '@chatapp/common'
import { Router } from 'express'
import { AuthSchema } from '@/validations/auth.schemas'

export class Routes {
  // private readonly userService: UserService
  // private readonly userController: UserCOntrol
  constructor(public readonly routes: Router) {
    this.routes = Router()
    // this.authService = new AuthService(UserCredentials)
    // this.authController = new AuthController(this.authService)
    this.initializeRoutes()
  }
  private initializeRoutes(): void {
    this.routes.post('/hi', (req, res) => {
      res.send('hiiii')
    })
  }
}
