const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: 'Internal Server Error',
    status: 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.status = 400;
  }

  // Duplicate key error (PostgreSQL)
  if (err.code === '23505') {
    error.message = 'Resource already exists';
    error.status = 409;
  }

  // Foreign key constraint error (PostgreSQL)
  if (err.code === '23503') {
    error.message = 'Referenced resource does not exist';
    error.status = 400;
  }

  // Not null constraint error (PostgreSQL)
  if (err.code === '23502') {
    error.message = 'Required field is missing';
    error.status = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Custom error handling
  if (err.status) {
    error.status = err.status;
    error.message = err.message;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;