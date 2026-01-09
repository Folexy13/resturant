export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, true, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 409, true, details);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, false);
  }
}