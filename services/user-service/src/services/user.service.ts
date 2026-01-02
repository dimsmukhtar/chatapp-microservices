import { DomainUser, UserRepository } from '@/repositores/user.repository'
import { AuthUserRegisteredPayload } from '@chatapp/common'

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  public async upsertUserFromAuthEvent(
    payload: AuthUserRegisteredPayload
  ): Promise<DomainUser> {
    const user = await this.repository.upsertFromAuthEvent(payload)
    return user
  }
}
