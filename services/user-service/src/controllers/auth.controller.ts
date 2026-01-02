import { RequestHandler } from 'express'
import { AuthService } from '@/services/user.service'
import { LoginInput, RegisterInput } from '@/types/user'
import { asyncWrapper } from '@chatapp/common'

export class AuthController {
  constructor(private readonly service: AuthService) {}
  public registerHandler: RequestHandler = asyncWrapper(async (req, res) => {
    const payload = req.body as RegisterInput
    await this.service.register(payload)
    res.status(201).json({
      success: true,
      message: 'congrats my homie, you registered successfully'
    })
  })
}
