import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { HttpError } from '@chatapp/common'
import { logger } from '@/utils/logger'

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({ err }, 'unhandled error occurred')
  const error = err instanceof HttpError ? err : undefined
  const statusCode = error?.statusCode ?? 500
  const message =
    statusCode >= 500
      ? 'Internal server error'
      : (error?.message ?? 'unknown error')
  const payload = error?.details
    ? { message, details: error.details }
    : { message }
  res.status(statusCode).json({ success: false, ...payload })
  void next
}
