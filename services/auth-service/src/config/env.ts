import 'dotenv/config'

import { createEnv, z } from '@chatapp/common'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  AUTH_SERVICE_PORT: z.coerce.number().int().min(0).max(65_536).default(4003),
  AUTH_DB_NAME: z.string().min(1),
  AUTH_DB_USER: z.string().min(1),
  AUTH_DB_PASSWORD: z.string().min(1),
  AUTH_DB_HOST: z.string().min(1),
  AUTH_DB_PORT: z.coerce.number().int().min(1).max(65535),
  AUTH_DB_SSL: z.coerce.boolean().default(false),
  JWT_ACCESS_TOKEN_PRIVATE_KEY: z.string().min(1),
  JWT_ACCESS_TOKEN_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  INTERNAL_API_TOKEN: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  REDIS_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).default(6379)
})

type EnvType = z.infer<typeof envSchema>

export const env: EnvType = createEnv(envSchema, {
  serviceName: 'auth-service'
})
export type Env = typeof env
