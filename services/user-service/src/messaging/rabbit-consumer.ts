import { Channel, ConsumeMessage } from 'amqplib'
import { getRabbitChannel } from '@/utils/rabbitmq'
import { logger } from '@/utils/logger'

const assertedExchanges = new Set<string>()
const assertedQueues = new Set<string>()
const assertedBindings = new Set<string>()

async function ensureExchange(channel: Channel, exchange: string) {
  if (assertedExchanges.has(exchange)) return
  await channel.assertExchange(exchange, 'topic', { durable: true })
  assertedExchanges.add(exchange)
}

async function ensureQueue(channel: Channel, queue: string) {
  if (assertedQueues.has(queue)) return
  await channel.assertQueue(queue, { durable: true })
  assertedQueues.add(queue)
}

async function ensureBinding(
  channel: Channel,
  exchange: string,
  queue: string,
  routingKey: string
) {
  const key = `${queue}:${exchange}:${routingKey}`
  if (assertedBindings.has(key)) return
  await channel.bindQueue(queue, exchange, routingKey)
  assertedBindings.add(key)
}

export const consumer = async <T>({
  exchange,
  queue,
  routingKey,
  handler
}: {
  exchange: string
  queue: string
  routingKey: string
  handler: (event: T) => Promise<void>
}) => {
  const channel: Channel = await getRabbitChannel()
  await ensureExchange(channel, exchange)
  await ensureQueue(channel, queue)
  await ensureBinding(channel, exchange, queue, routingKey)

  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return
    try {
      const event = JSON.parse(msg.content.toString()) as T
      await handler(event)
      channel.ack(msg)
    } catch (error) {
      logger.error('Failed to consume message', {
        error: (error as any).message
      })
      channel.nack(msg, false, false)
    }
  })

  logger.info(`Consuming routing key=${routingKey} on queue ${queue}`)
}
