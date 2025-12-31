import { Op } from 'sequelize'
import { UserCredentials } from '@/models'
import { LoginInput, RegisterInput } from '@/types/auth'
import { BadRequestError, ConflictError } from '@chatapp/common'
import { sequelize } from '@/db/sequelize'
import { hashPassword } from '@/utils/token'

export class AuthService {
  constructor(private readonly model: typeof UserCredentials) {}

  public async register(input: RegisterInput): Promise<UserCredentials> {
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
      displayname: user.displayName,
      createdAt: user.createdAt.toISOString()
    }
    // publish event UserRegistered
    return user
  }

  public async login(input: LoginInput) {}
}
