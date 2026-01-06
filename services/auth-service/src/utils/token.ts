import argon2 from 'argon2'
import crypto from 'node:crypto'
import { env } from '@/config/env'

const REFRESH_TOKEN_BYTES = 32 // 256 bit

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password)
}

export const comparePassword = async (
  userHashPassword: string,
  password: string
): Promise<boolean> => {
  return argon2.verify(userHashPassword, password)
}

export const generateRefreshToken = () => {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex')
}

export const hashRefreshToken = (refreshToken: string) => {
  return crypto
    .createHmac('sha256', env.REFRESH_TOKEN_SECRET)
    .update(refreshToken)
    .digest('hex')
}
