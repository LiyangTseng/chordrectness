/**
 * Error handling middleware for Fastify
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Global error handler for Fastify
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    statusCode: error.statusCode || 500
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default error response
  const errorResponse = {
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: request.url
  };

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    (errorResponse as any).stack = error.stack;
  }

  // Handle specific error types
  if (error.statusCode) {
    // Validation errors
    if (error.statusCode === 400) {
      errorResponse.error = 'Bad Request';
      errorResponse.message = error.message || 'Invalid request data';
    }
    
    // Authentication errors
    if (error.statusCode === 401) {
      errorResponse.error = 'Unauthorized';
      errorResponse.message = 'Authentication required';
    }
    
    // Authorization errors
    if (error.statusCode === 403) {
      errorResponse.error = 'Forbidden';
      errorResponse.message = 'Access denied';
    }
    
    // Not found errors
    if (error.statusCode === 404) {
      errorResponse.error = 'Not Found';
      errorResponse.message = error.message || 'Resource not found';
    }
    
    // Rate limit errors
    if (error.statusCode === 429) {
      errorResponse.error = 'Too Many Requests';
      errorResponse.message = 'Rate limit exceeded';
    }
  }

  // Handle Fastify validation errors
  if (error.validation) {
    errorResponse.error = 'Validation Error';
    errorResponse.message = 'Request validation failed';
    errorResponse.statusCode = 400;
    
    if (isDevelopment) {
      (errorResponse as any).validation = error.validation;
    }
  }

  // Handle Fastify schema errors
  if (error.validationContext) {
    errorResponse.error = 'Schema Validation Error';
    errorResponse.message = `Invalid ${error.validationContext}`;
    errorResponse.statusCode = 400;
  }

  // Send error response
  reply.code(errorResponse.statusCode).send(errorResponse);
}

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for common scenarios
 */
export const ErrorTypes = {
  VALIDATION_ERROR: (message: string) => new AppError(message, 400),
  UNAUTHORIZED: (message: string = 'Authentication required') => new AppError(message, 401),
  FORBIDDEN: (message: string = 'Access denied') => new AppError(message, 403),
  NOT_FOUND: (message: string = 'Resource not found') => new AppError(message, 404),
  CONFLICT: (message: string = 'Resource conflict') => new AppError(message, 409),
  RATE_LIMIT: (message: string = 'Rate limit exceeded') => new AppError(message, 429),
  INTERNAL_ERROR: (message: string = 'Internal server error') => new AppError(message, 500),
  SERVICE_UNAVAILABLE: (message: string = 'Service unavailable') => new AppError(message, 503)
};

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await fn(request, reply);
    } catch (error) {
      return errorHandler(error as FastifyError, request, reply);
    }
  };
}
