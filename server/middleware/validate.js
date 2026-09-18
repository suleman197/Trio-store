const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Runs express-validator chain results; throws 400 with error list on failure. */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest(formatted[0].message, formatted));
};

module.exports = validate;
