import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodType } from 'zod'

import { BadRequestError } from '../errors/http-error'

type Schema = ZodType
type ParamsRecord = Record<string, string>
type QueryRecord = Record<string, unknown>

export interface RequestValidationSchemas {
  body?: Schema
  params?: Schema
  query?: Schema
}

export const validateRequest = (schemas: RequestValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body) as unknown
        req.body = parsedBody
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params) as ParamsRecord
        req.params = parsedParams as Request['params']
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as QueryRecord
        req.query = parsedQuery as Request['query']
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const requiredIssues = error.issues.filter(
          (issue) =>
            issue.code === 'invalid_type' &&
            issue.message.includes('received undefined')
        )

        if (requiredIssues.length > 0) {
          const fields = requiredIssues.map((i) => i.path.join('.')).join(', ')

          return next(
            new BadRequestError(
              `Dude ${fields} is required, so better you fill it`
            )
          )
        }
        const messages = error.issues.map((e) => e.message).join(', ')
        return next(new BadRequestError(messages))
      }
      next(error)
    }
  }
}
