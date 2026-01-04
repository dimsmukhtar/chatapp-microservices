import {
  AUTH_EVENT_EXCHANGE,
  AUTH_USER_REGISTERED_ROUTING_KEY,
  AuthRegisteredEvent
} from '@chatapp/common'

import { consumer } from '../rabbit-consumer'
import { Users } from '@/models'
import { UserRepository } from '@/repositores/user.repository'
import { UserService } from '@/services/user.service'
import { logger } from '@/utils/logger'

const userRepository = new UserRepository(Users)
const userService = new UserService(userRepository)

export const startAuthUserRegisterConsumer = async () => {
  await consumer<AuthRegisteredEvent>({
    exchange: AUTH_EVENT_EXCHANGE,
    queue: 'user-service.auth-events',
    routingKey: AUTH_USER_REGISTERED_ROUTING_KEY,
    handler: async (event) => {
      logger.info('Recieving message from rabbitmq', event)
      await userService.upsertUserFromAuthEvent(event.payload)
    }
  })
}
