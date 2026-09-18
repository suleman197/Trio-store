const { body } = require('express-validator');

const createOrderRules = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Each item needs a valid productId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('customerInfo.firstName').trim().notEmpty().withMessage('First name is required'),
  body('customerInfo.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('customerInfo.email').trim().isEmail().withMessage('Valid email is required'),
  body('customerInfo.phone').trim().notEmpty().withMessage('Phone is required'),
  body('shippingAddress.address').trim().notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State/Province is required'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('paymentMethod').optional().isIn(['cod', 'bank']).withMessage('Unsupported payment method'),
];

module.exports = { createOrderRules };
