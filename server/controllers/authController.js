const crypto = require('crypto');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');

const publicUser = (u) => ({
  id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  name: `${u.firstName} ${u.lastName}`,
  email: u.email,
  phone: u.phone,
  role: u.role,
});

/** POST /api/auth/register */
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ firstName, lastName, email, phone, password });

  // Initialize empty cart & wishlist documents
  await Promise.all([Cart.create({ user: user._id, items: [] }), Wishlist.create({ user: user._id, products: [] })]);

  const token = signToken(user);
  ok(res, { status: 201, message: 'Account created successfully', data: { token, user: publicUser(user) } });
});

/** POST /api/auth/login */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');

  // Merge any guest cart items into the user's server cart
  const guestItems = Array.isArray(req.body.guestCart) ? req.body.guestCart : [];
  if (guestItems.length) {
    let cart = await Cart.findOne({ user: user._id });
    if (!cart) cart = await Cart.create({ user: user._id, items: [] });
    for (const gi of guestItems) {
      const existing = cart.items.find(
        (i) => i.product.toString() === gi.productId && JSON.stringify(i.variant || {}) === JSON.stringify(gi.variant || {})
      );
      if (existing) existing.quantity += gi.quantity;
      else cart.items.push({ product: gi.productId, variant: gi.variant || {}, quantity: gi.quantity });
    }
    await cart.save();
  }

  const token = signToken(user);
  ok(res, { message: 'Logged in successfully', data: { token, user: publicUser(user) } });
});

/** POST /api/auth/logout — stateless JWT; client discards token. */
exports.logout = asyncHandler(async (req, res) => {
  ok(res, { message: 'Logged out successfully' });
});

/** GET /api/auth/me */
exports.getMe = asyncHandler(async (req, res) => {
  ok(res, { data: { user: publicUser(req.user) } });
});

/** PUT /api/auth/me */
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  await req.user.save();
  ok(res, { message: 'Profile updated', data: { user: publicUser(req.user) } });
});

/**
 * POST /api/auth/forgot-password
 * Generates a reset token. In production this would be emailed; we return it in
 * dev mode so the flow is testable end-to-end without an SMTP provider.
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  const genericMessage = 'If that account exists, a reset link has been generated.';
  if (!user) return ok(res, { message: genericMessage });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
  await user.save({ validateBeforeSave: false });

  ok(res, {
    message: genericMessage,
    data: undefined,
  });
});

/** POST /api/auth/reset-password */
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  ok(res, { message: 'Password reset successfully' });
});
