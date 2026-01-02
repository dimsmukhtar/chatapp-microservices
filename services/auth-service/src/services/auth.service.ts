import { Op } from 'sequelize'
import { UserCredentials } from '@/models'
import { LoginInput, RegisterInput, UserData } from '@/types/auth'
import { BadRequestError, ConflictError } from '@chatapp/common'
import { sequelize } from '@/db/sequelize'
import { hashPassword } from '@/utils/token'
import { publishUserRegistered } from '@/messaging/producers/auth-events.pubsliher'

export class AuthService {
  constructor(private readonly model: typeof UserCredentials) {}

  public async register(input: RegisterInput): Promise<UserData> {
    const existing = await this.model.findOne({
      where: { email: input.email }
    })

    if (existing) {
      throw new ConflictError(`user with email ${input.email} already exists`)
    }

    const passwordHash = await hashPassword(input.password)
    const user = await this.model.create({
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

  public async login(input: LoginInput) {}
}
