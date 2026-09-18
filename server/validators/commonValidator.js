const { body } = require('express-validator');

const couponRules = [
  body('code').trim().notEmpty().withMessage('Coupon code is required').isLength({ max: 30 }),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').isFloat({ min: 0.01 }).withMessage('Discount value must be greater than 0'),
  body('minOrderAmount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional({ nullable: true }).isInt({ min: 0 }),
];

const validateCouponRules = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Order subtotal is required'),
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required').isLength({ max: 2000 }),
];

module.exports = { couponRules, validateCouponRules, reviewRules };
