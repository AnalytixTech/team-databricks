import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { errorResponse } from '../utils/helpers';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error('❌ Error:', err);

  // Default error
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_ERROR;

  // Handle operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate field value entered';
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid ID format';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.INVALID_TOKEN;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json(errorResponse(message, err.message));
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const message = `Route ${req.originalUrl} not found`;
  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse(message));
};

