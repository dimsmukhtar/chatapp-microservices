import { NextFunction, Request, Response } from 'express'
import { AuthService } from '@/services/auth.service'
import { LoginInput, RegisterInput } from '@/types/auth'

export class AuthController {
  constructor(private readonly service: AuthService) {}
  public registerHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payload = req.body as RegisterInput
      await this.service.register(payload)
      res.status(201).json({
        success: true,
        message: 'congrats my homie, you registered successfully'
      })
    } catch (e) {
      next(e)
    }
  }
}
