const { body } = require('express-validator');

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 200 }),
  body('sku').trim().notEmpty().withMessage('SKU is required').isLength({ max: 40 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional({ nullable: true, checkFalsy: false })
    .custom((v) => v === null || typeof v === 'number' || !isNaN(parseFloat(v)))
    .withMessage('Discount price must be a number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
  body('status').optional().isIn(['active', 'disabled']).withMessage('Invalid status'),
];

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('isActive').optional().isBoolean(),
];

/** Partial updates: everything optional, validated only when present. */
const productUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty').isLength({ max: 200 }),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty').isLength({ max: 40 }),
  body('description').optional().trim().notEmpty(),
  body('brand').optional().trim().notEmpty(),
  body('category').optional().isMongoId().withMessage('Valid category is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional({ nullable: true })
    .custom((v) => v === null || !isNaN(parseFloat(v)))
    .withMessage('Discount price must be a number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
  body('status').optional().isIn(['active', 'disabled']).withMessage('Invalid status'),
];

const categoryUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('image').optional().trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
];

module.exports = { productRules, productUpdateRules, categoryRules, categoryUpdateRules };
