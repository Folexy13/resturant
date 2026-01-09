import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  stack?: string;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle TypeORM errors
  if (error.name === 'QueryFailedError') {
    const response: ErrorResponse = {
      success: false,
      message: 'Database operation failed',
      statusCode: 500,
    };

    if (process.env.NODE_ENV === 'development') {
      response.details = { originalError: error.message };
      response.stack = error.stack;
    }

    res.status(500).json(response);
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    success: false,
    message: 'Internal server error',
    statusCode: 500,
  };

  if (process.env.NODE_ENV === 'development') {
    response.message = error.message;
    response.stack = error.stack;
  }

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
}