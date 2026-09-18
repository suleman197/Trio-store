/**
 * Centralized error handler — converts any thrown error into the
 * standard { success: false, message, error } envelope.
 */
const mongoose = require('mongoose');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose invalid ObjectId
  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }
  // Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }
  // Duplicate key
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}: "${err.keyValue ? err.keyValue[field] : ''}"`;
  }

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    success: false,
    message,
    error: { name: err.name, stack: err.stack },
  });
};

module.exports = errorHandler;
