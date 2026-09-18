const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

/**
 * Validates a coupon against an order subtotal and returns discount amount.
 * @returns {{ coupon: Document, discount: number }}
 */
const applyCoupon = async (code, subtotal) => {
  const coupon = await Coupon.findOne({ code: String(code || '').toUpperCase().trim() });
  if (!coupon) throw ApiError.notFound('Invalid coupon code');
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    throw ApiError.badRequest('This coupon has reached its usage limit');
  if (subtotal < coupon.minOrderAmount)
    throw ApiError.badRequest(`Minimum order amount for this coupon is $${coupon.minOrderAmount}`);

  let discount =
    coupon.discountType === 'percentage' ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.maxDiscountAmount !== null) discount = Math.min(discount, coupon.maxDiscountAmount);
  discount = Math.min(Math.round(discount * 100) / 100, subtotal);

  return { coupon, discount };
};

module.exports = { applyCoupon };
