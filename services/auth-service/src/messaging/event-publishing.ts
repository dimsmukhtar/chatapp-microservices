import {
  AUTH_EVENT_EXCHANGE,
  AUTH_USER_REGISTERED_ROUTING_KEY,
  AuthUserRegisteredPayload
} from '@chatapp/common'
import amqp, { Channel, ChannelModel } from 'amqplib'

import { env } from '@/config/env'
import { logger } from '@/utils/logger'

let connection: ChannelModel | null = null
let channel: Channel | null = null

export const connectToRabbitAndInitPublisher = async () => {
  if (channel) return channel
  if (!env.RABBITMQ_URL) {
    logger.warn(
      'RABBITMQ_URL is not defined. Skipping RabbitMQ connect and initialization'
    )
    return
  }
  try {
    connection = await amqp.connect(env.RABBITMQ_URL)
    channel = await connection.createChannel()
    await channel.assertExchange(AUTH_EVENT_EXCHANGE, 'topic', {
      durable: true
    })

    connection.on('close', () => {
      logger.warn('RabbitMQ connecction closed')
      channel = null
      connection = null
    })
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err })
    })

    logger.info('RabbitMQ successfully connected and publisher initialized')
  } catch (error) {
    logger.error('Error connecting and initializing RabbitMQ', {
      error: (error as any).message
    })
    throw error
  }
}

export const publishUserRegistered = (payload: AuthUserRegisteredPayload) => {
  if (!channel) {
    logger.warn('RabbitMQ channel is not initialized. Cannot publish message')
    return
  }

  const event = {
    type: AUTH_USER_REGISTERED_ROUTING_KEY,
    payload,
    occuredAt: new Date().toISOString(),
    metadata: { version: 1 }
  }

  const published = channel.publish(
    AUTH_EVENT_EXCHANGE,
    AUTH_USER_REGISTERED_ROUTING_KEY,
    Buffer.from(JSON.stringify(event)),
    { contentType: 'application/json', persistent: true }
  )

  if (!published) {
    logger.warn('Failed to publish user registered event', { event })
  }

  logger.info(
    `User Registered event successfully published to exchange: ${AUTH_EVENT_EXCHANGE} and delivered to queue with routing key: ${AUTH_USER_REGISTERED_ROUTING_KEY}`
  )
}

export const closeRabbitAndPublisher = async () => {
  try {
    if (channel) {
      await channel.close()
      channel = null
    }
    if (connection) {
      await connection.close()
      connection = null
    }
  } catch (error) {
    logger.error('Error closing RabbitMQ connection/channel', { error: error })
  }
}
