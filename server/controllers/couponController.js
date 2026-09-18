const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { applyCoupon } = require('../services/couponService');

/** POST /api/coupons/validate — body { code, subtotal } → computed discount */
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { coupon, discount } = await applyCoupon(req.body.code, Number(req.body.subtotal));
  ok(res, {
    message: `Coupon applied — you save $${discount.toFixed(2)}`,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
    },
  });
});

// ---------- Admin CRUD ----------
exports.getCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);
  ok(res, { data: { coupons, meta: buildMeta({ page, limit }, total) } });
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').toUpperCase().trim();
  const exists = await Coupon.findOne({ code });
  if (exists) throw ApiError.conflict(`Coupon "${code}" already exists`);
  const coupon = await Coupon.create({ ...req.body, code });
  ok(res, { status: 201, message: 'Coupon created successfully', data: { coupon } });
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  delete req.body.code; // code immutable
  delete req.body.usedCount;
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ok(res, { message: 'Coupon updated successfully', data: { coupon } });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ok(res, { message: 'Coupon deleted successfully' });
});
