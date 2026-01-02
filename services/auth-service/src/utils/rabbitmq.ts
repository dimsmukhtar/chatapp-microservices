import amqp, { Channel, ChannelModel } from 'amqplib'
import { env } from '@/config/env'
import { logger } from './logger'

let connection: ChannelModel | null = null
let channel: Channel | null = null

export const getRabbitChannel = async (): Promise<Channel> => {
  if (channel) return channel
  if (!env.RABBITMQ_URL) {
    throw new Error('RABBIMQ_URL not defined')
  }
  connection = await amqp.connect(env.RABBITMQ_URL)
  channel = await connection.createChannel()

  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed')
    channel = null
    connection = null
  })

  connection.on('error', (err) => {
    logger.error('RabbitMQ connection error', { error: (err as any).message })
  })

  logger.info('RabbitMQ successfully connected and initialized')
  return channel
}
