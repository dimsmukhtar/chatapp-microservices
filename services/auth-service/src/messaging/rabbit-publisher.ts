import { getRabbitChannel } from '@/utils/rabbitmq'
import { logger } from '@/utils/logger'
import { Channel } from 'amqplib'

export type PublishOptions<T> = {
  exchange: string
  routingKey: string
  message: T
}

const assertedExchanges = new Set<string>()

async function ensureExchange(channel: Channel, exchange: string) {
  if (assertedExchanges.has(exchange)) return
  await channel.assertExchange(exchange, 'topic', { durable: true })
  assertedExchanges.add(exchange)
}

export const publish = async <T>({
  exchange,
  routingKey,
  message
}: PublishOptions<T>) => {
  const channel: Channel = await getRabbitChannel()
  await ensureExchange(channel, exchange)

  const event = {
    type: routingKey,
    payload: message,
    occurredAt: new Date().toISOString(),
    metadata: { version: 1 }
  }

  const ok = channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(event)),
    { contentType: 'application/json', persistent: true }
  )

  if (!ok) {
    logger.warn('RabbitMQ publish failed to publish and returned false', {
      exchange,
      routingKey
    })
  }

  logger.info(
    `Event published -> exchange=${exchange}, routingKey=${routingKey}`
  )
}
