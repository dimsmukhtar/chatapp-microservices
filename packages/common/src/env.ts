import type { ZodObject, ZodRawShape } from 'zod'

interface EnvOptions {
  source?: NodeJS.ProcessEnv
  serviceName?: string
}

type SchemaOutput<T extends ZodRawShape> = ZodObject<T>['_output']

export const createEnv = <T extends ZodRawShape>(
  schema: ZodObject<T>,
  options: EnvOptions = {}
): SchemaOutput<T> => {
  const { source = process.env, serviceName = 'service' } = options
  const parsed = schema.safeParse(source)

  if (!parsed.success) {
    const formatedErrors = parsed.error.format()
    throw new Error(
      `[${serviceName}] Environment variable validation failed: ${JSON.stringify(formatedErrors)}`
    )
  }
  return parsed.data
}

// export type EnvSchema<T extends ZodRawShape> = ZodObject<T>
