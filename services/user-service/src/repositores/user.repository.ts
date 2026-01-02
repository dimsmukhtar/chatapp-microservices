import { AuthUserRegisteredPayload } from '@chatapp/common'

import { Users } from '@/models'
import { UserAttributes } from '@/models/user.model'

export interface DomainUser extends UserAttributes {
  createdAt: Date
  updatedAt: Date
}

const toDomainUser = (model: Users): DomainUser => ({
  id: model.id,
  email: model.email,
  displayName: model.displayName,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt
})

export class UserRepository {
  constructor(private readonly userModel: typeof Users) {}

  public async findById(id: string): Promise<DomainUser | null> {
    const user = await this.userModel.findByPk(id)
    return user ? toDomainUser(user) : null
  }

  public async findAll(): Promise<DomainUser[]> {
    const users = await this.userModel.findAll({
      order: [['displayName', 'ASC']]
    })

    return users.map(toDomainUser)
  }

  public async upsertFromAuthEvent(
    payload: AuthUserRegisteredPayload
  ): Promise<DomainUser> {
    const [user] = await this.userModel.upsert(
      {
        id: payload.id,
        email: payload.email,
        displayName: payload.displayName
      },
      { returning: true }
    )
    return toDomainUser(user)
  }
}
