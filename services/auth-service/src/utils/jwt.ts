import jwt from 'jsonwebtoken'

import { env } from '@/config/env'

export function signJwt(object: Object, options?: jwt.SignOptions | undefined) {
  const basePrivateKey = env.JWT_ACCESS_TOKEN_PRIVATE_KEY
  const privateKeyPem = Buffer.from(basePrivateKey, 'base64').toString('utf-8')
  return jwt.sign(object, privateKeyPem, {
    ...(options && options),
    algorithm: 'RS256'
  })
}

export function verifyJwtToken<T>(token: string): T | null {
  const basePublicKey = env.JWT_ACCESS_TOKEN_PUBLIC_KEY
  const publicKeyPem = Buffer.from(basePublicKey, 'base64').toString('utf-8')
  try {
    const decoded = jwt.verify(token, publicKeyPem) as T
    return decoded
  } catch (error) {
    return null
  }
}
