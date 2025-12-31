import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { HttpError, ZodError } from '@chatapp/common'
import { logger } from '@/utils/logger'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isHttpError = (err: unknown): err is HttpError =>
    err instanceof HttpError

  const isBadRequestError = (err: unknown): boolean =>
    err?.constructor?.name === 'BadRequestError'

  if (isHttpError(error)) {
    return res.status(error.statusCode).json(error.serialize())
  }

  if (isBadRequestError(error)) {
    const err = error as any
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: err.timestamp
    })
  }

  const isProduction = process.env.NODE_ENV === 'production'

  const err = error as Error

  res.status(500).json({
    success: false,
    statusCode: 500,
    errorCode: 'Unhandled_Error',
    message: isProduction ? 'SOMETHING WENT WRONG' : err?.message,
    timeStamp: new Date().toISOString(),
    ...(!isProduction && { stack: err?.stack })
  })
}
