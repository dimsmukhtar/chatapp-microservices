import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { HttpError, ZodError } from '@chatapp/common'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json(error.serialize())
  }

  const isProduction = process.env.NODE_ENV === 'production'

  const err = error as Error

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: isProduction ? 'SOMETHING WENT WRONG' : err?.message,
    errorCode: 'Unhandled_Error',
    ...(!isProduction && { details: err?.stack }),
    timeStamp: new Date().toISOString()
  })
}
