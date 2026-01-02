import amqp, { Channel, ChannelModel, ConsumeMessage, Replies } from 'amqplib'

import {
  AUTH_EVENT_EXCHANGE,
  AUTH_USER_REGISTERED_ROUTING_KEY,
  AuthRegisteredEvent
} from '@chatapp/common'

import { env } from '@/config/env'
import { logger } from '@/utils/logger'
import { UserRepository } from '@/repositores/user.repository'
import { Users } from '@/models'
import { UserService } from '@/services/user.service'

let connection: ChannelModel | null = null
let channel: Channel | null = null
let consumerTag: string | null = null

const QUEUE_NAME = 'auth-service.auth-events'

const userRepository = new UserRepository(Users)
const userService = new UserService(userRepository)

const handleMessage = async (message: ConsumeMessage, ch: Channel) => {
  const row = message.content.toString('utf-8')
  const event = JSON.parse(row) as AuthRegisteredEvent

  await userService.upsertUserFromAuthEvent(event.payload)
  ch.ack(message)
}

export const connectToRabbitAndStartAuthEventConsumer = async () => {
  if (!env.RABBITMQ_URL) {
    logger.warn(
      'RABBITMQ_URL is not defined. Skipping RabbitMQ connect and initialization'
    )
    return
  }
  if (channel) return channel

  try {
    connection = await amqp.connect(env.RABBITMQ_URL)
    channel = await connection.createChannel()
    await channel.assertExchange(AUTH_EVENT_EXCHANGE, 'topic', {
      durable: true
    })

    const queue = await channel.assertQueue(QUEUE_NAME, { durable: true })
    await channel.bindQueue(
      queue.queue,
      AUTH_EVENT_EXCHANGE,
      AUTH_USER_REGISTERED_ROUTING_KEY
    )

    const consumeHandler = (msg: ConsumeMessage | null) => {
      if (!msg) {
        return
      }

      void handleMessage(msg, channel!).catch((error: unknown) => {
        logger.error('Failed to proccess auth event', {
          error: (error as any).message
        })
        channel!.nack(msg, false, false)
      })
    }

    const result: Replies.Consume = await channel.consume(
      queue.queue,
      consumeHandler
    )
    consumerTag = result.consumerTag

    connection.on('close', () => {
      logger.warn('RabbitMQ connecction closed')
      connection = null
      channel = null
      consumerTag = null
    })
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: (err as any).message })
    })

    logger.info('Auth event consumer started')
  } catch (error) {
    logger.error('Error connecting to RabbitMQ and Auth event', {
      error: (error as any).message
    })
    throw error
  }
}

export const closeRabbitAndAuthEventConsume = async () => {
  try {
    if (channel && consumerTag) {
      await channel.cancel(consumerTag)
      consumerTag = null
    }
    if (channel) {
      await channel.close()
      channel = null
    }
    if (connection) {
      await connection.close()
      connection = null
      channel = null
      consumerTag = null
    }
  } catch (error) {
    logger.error('Error closing RabbitMQ connection/channel', { error: error })
  }
}
