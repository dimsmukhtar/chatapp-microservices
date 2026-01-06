import axios, { AxiosInstance } from 'axios'
import { env } from '@/config/env'
import {
  HttpError,
  InternalServerError,
  ServiceErrorRespose
} from '@chatapp/common'
import { LoginPayload, RegisterPayload } from '@/types/auth'

export class AuthProxyService {
  private readonly authHeader: Object = {
    headers: {
      'x-internal-token': env.INTERNAL_API_TOKEN
    }
  }
  constructor(private readonly authClient: AxiosInstance) {}

  async authServiceHealth() {
    try {
      const response = await this.authClient.get('/health', this.authHeader)
      return response.data
    } catch (e) {
      return this.handleAxiosError(e)
    }
  }

  async authDatabaseServicehealth() {
    try {
      const response = await this.authClient.get('/health/db', this.authHeader)
      return response.data
    } catch (e) {
      return this.handleAxiosError(e)
    }
  }

  async authRabbitServiceHealth() {
    try {
      const response = await this.authClient.get(
        '/health/rabbit',
        this.authHeader
      )
      return response.data
    } catch (e) {
      return this.handleAxiosError(e)
    }
  }

  async register(payload: RegisterPayload) {
    try {
      const response = await this.authClient.post(
        '/auth/register',
        payload,
        this.authHeader
      )
      return response.data
    } catch (e) {
      return this.handleAxiosError(e)
    }
  }

  async login(payload: LoginPayload) {
    try {
      const response = await this.authClient.post(
        '/auth/login',
        payload,
        this.authHeader
      )
      return response.data
    } catch (e) {
      return this.handleAxiosError(e)
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const response = await this.authClient.post(
        '/auth/refresh',
        { refreshToken },
        this.authHeader
      )
      return response.data
    } catch (e) {
      return this.handleAxiosError(e)
    }
  }

  private resolvedMessage = (status: number, data: unknown): string => {
    if (typeof data === 'object' && data && 'message' in data) {
      const message = (data as Record<string, unknown>).message
      if (typeof message === 'string' && message.trim().length > 0) {
        return message
      }
    }

    return status >= 500
      ? 'Authentication service is unavailable'
      : 'An error occurred while processing the request'
  }

  private isServiceErrorResponse(data: unknown): data is ServiceErrorRespose {
    return (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      'errorcode' in data
    )
  }

  private handleAxiosError = (error: unknown): never => {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new InternalServerError('Authentication service is unavailable')
    }

    const { status, data } = error.response as {
      status: number
      data: unknown
    }

    if (this.isServiceErrorResponse(data)) {
      throw new HttpError(status, data.message, data.errorCode)
    }

    throw new HttpError(status, this.resolvedMessage(status, data))
  }
}
