/**
 * Error handling middleware
 */

const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.url
  };

  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
}

/**
 * 404 handler
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.url}`);
  error.status = 404;
  next(error);
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
