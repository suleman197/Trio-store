const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

/** Requires a valid JWT Bearer token. Attaches req.user (full doc). */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw ApiError.unauthorized('Please provide a Bearer token');

    const decoded = verifyToken(header.split(' ')[1]);
    const user = await User.findById(decoded.id);
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Role-based authorization. Usage: router.post('/', protect, authorize('admin'), handler) */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

module.exports = { protect, authorize };
