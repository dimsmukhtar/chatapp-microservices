import { z } from '@chatapp/common'

export class AuthSchema {
  static registerSchema = z.object({
    body: z.object({
      email: z
        .string()
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
          error: 'Freaking type the right email man'
        }),
      password: z.string().min(6, {
        error: 'Dude the paassword must be at least 6 characters'
      }),
      displayName: z.string().min(2, { error: 'Display name too damn short' })
    })
  })

  static loginSchema = z.object({
    body: z.object({
      email: z
        .string()
        .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
          error: 'Freaking type the right email man'
        }),
      password: z.string().min(6, {
        error: 'Dude the password must be at least 6 characters'
      })
    })
  })
}
