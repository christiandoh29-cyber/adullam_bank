// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err)

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e: { path: { join: (sep: string) => string }; message: string }) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof Error) {
    const status = (err as { status?: number }).status || 500
    res.status(status).json({
      success: false,
      message: process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal server error'
        : err.message,
    })
    return
  }

  res.status(500).json({ success: false, message: 'Internal server error' })
}

export function createError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}
