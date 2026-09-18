const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const JWT_SECRET = 'voltiq_jwt_secret_key_2024_production_change_in_real_deployment';
const JWT_EXPIRES_IN = '7d';

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
};

module.exports = { signToken, verifyToken };
