import { RequestHandler } from 'express'
import { AuthService } from '@/services/auth.service'
import { LoginInput, RegisterInput } from '@/types/auth'
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

  public loginHandler: RequestHandler = asyncWrapper(async (req, res) => {
    const payload = req.body as LoginInput
    const { accessToken, refreshToken } = await this.service.login(payload, req)
    res.status(200).json({
      success: true,
      message: 'congrats mate, your login is success',
      accessToken,
      refreshToken
    })
  })

  public refreshToken: RequestHandler = asyncWrapper(async (req, res) => {
    const { accessToken, refreshToken } = await this.service.refreshToken(
      req.body.refreshToken,
      req
    )
    res.status(200).json({
      success: true,
      message: 'congrats mate, your refresh token rotate is success',
      accessToken,
      refreshToken
    })
  })
}
