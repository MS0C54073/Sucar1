/**
 * Global Error Handler Middleware
 * 
 * Handles all errors in the application and returns consistent error responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  code?: string;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      code: err.code,
    };

    // Add validation errors if present
    if ('errors' in err && (err as any).errors) {
      response.errors = (err as any).errors as Record<string, string[]>;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
      response.error = err.message;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError' || 'errors' in err) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: (err as any).errors,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // Handle database errors
  if (err.name === 'DatabaseError' || err.message?.includes('database')) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: 'Database error occurred',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
