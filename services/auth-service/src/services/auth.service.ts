import { Op } from 'sequelize'
import { RefreshTokens, UserCredentials } from '@/models'
import { AuthToken, LoginInput, RegisterInput, UserData } from '@/types/auth'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError
} from '@chatapp/common'
import { sequelize } from '@/db/sequelize'
import {
  comparePassword,
  generateRefreshToken,
  hashPassword,
  hashRefreshToken
} from '@/utils/token'
import { publishUserRegistered } from '@/messaging/producers/auth-events.pubsliher'
import { signJwt } from '@/utils/jwt'
import { env } from '@/config/env'
import { Request } from 'express'
import redis from '@/utils/redis'

export class AuthService {
  constructor(
    private readonly authModel: typeof UserCredentials,
    private readonly refreshTokenModel: typeof RefreshTokens
  ) {}

  public async register(input: RegisterInput): Promise<UserData> {
    const existing = await this.authModel.findOne({
      where: { email: input.email }
    })

    if (existing) {
      throw new ConflictError(`user with email ${input.email} already exists`)
    }

    const passwordHash = await hashPassword(input.password)
    const user = await this.authModel.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash
    })
    const userData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString()
    }
    // publish event UserRegistered
    publishUserRegistered(userData)
    return userData as UserData
  }

  public async login(input: LoginInput, req: Request): Promise<AuthToken> {
    const user = await this.authModel.findOne({
      where: { email: input.email }
    })
    if (!user) {
      throw new NotFoundError('user not registered')
    }

    const valid = await comparePassword(user.passwordHash, input.password)
    if (!valid) {
      throw new BadRequestError("password doesn't match")
    }

    const refreshToken = generateRefreshToken()
    const refreshTokenHash = hashRefreshToken(refreshToken)
    const now = new Date()
    const refreshTokenExpires = new Date(now.setDate(now.getDate() + 7))
    const accessToken = signJwt(
      { id: user.id },
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as any }
    )
    await this.refreshTokenModel.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpires,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip
    })

    await redis.set(`refresh:${refreshTokenHash}`, '1', 'EX', 7 * 24 * 60 * 60)

    return {
      accessToken,
      refreshToken
    }
  }

  public async refreshToken(
    refreshToken: string,
    req: Request
  ): Promise<AuthToken> {
    const refreshTokenHash = hashRefreshToken(refreshToken)
    const refreshTokenKey = `refresh:${refreshTokenHash}`
    const isExistsInRedis = await redis.get(refreshTokenKey)
    if (!isExistsInRedis) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    const tokenRecord = await this.refreshTokenModel.findOne({
      where: { tokenHash: refreshTokenHash }
    })

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    const newRefreshToken = generateRefreshToken()
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken)
    const now = new Date()
    const refreshTokenExpires = new Date(now.setDate(now.getDate() + 7))
    await this.refreshTokenModel.create({
      userId: tokenRecord.userId,
      tokenHash: newRefreshTokenHash,
      expiresAt: refreshTokenExpires,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip
    })
    await redis.del(refreshTokenKey)
    await redis.set(
      `refresh:${newRefreshTokenHash}`,
      '1',
      'EX',
      7 * 24 * 60 * 60
    )
    const newAccessToken = signJwt(
      { id: tokenRecord.userId },
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as any }
    )
    await tokenRecord.destroy()

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  // public async logout(): Promise<void>{

  // }
}
