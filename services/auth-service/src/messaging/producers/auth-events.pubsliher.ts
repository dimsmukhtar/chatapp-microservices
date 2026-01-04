import {
  AUTH_EVENT_EXCHANGE,
  AUTH_USER_REGISTERED_ROUTING_KEY,
  AuthUserRegisteredPayload
} from '@chatapp/common'

import { publish } from '../rabbit-publisher'
import { logger } from '@/utils/logger'

export const publishUserRegistered = async (
  payload: AuthUserRegisteredPayload
) => {
  await publish<AuthUserRegisteredPayload>({
    exchange: AUTH_EVENT_EXCHANGE,
    routingKey: AUTH_USER_REGISTERED_ROUTING_KEY,
    message: payload
  })
  logger.info('Publishing a message to rabbit', payload)
}
