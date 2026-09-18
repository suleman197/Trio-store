const router = require('express').Router();
const productCtrl = require('../controllers/productController');
const reviewCtrl = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { productRules, productUpdateRules } = require('../validators/productValidator');
const { reviewRules } = require('../validators/commonValidator');

// Public
router.get('/', productCtrl.getProducts);
router.get('/brands', productCtrl.getBrands);

// NOTE: /:id must come after fixed paths above
router.get('/:id', productCtrl.getProduct);
router.get('/:id/reviews', reviewCtrl.getProductReviews);
router.post('/:id/reviews', protect, reviewRules, validate, reviewCtrl.createReview);

// Admin
router.post('/', protect, authorize('admin'), productRules, validate, productCtrl.createProduct);
router.put('/:id', protect, authorize('admin'), productUpdateRules, validate, productCtrl.updateProduct);
router.patch('/:id/status', protect, authorize('admin'), productCtrl.toggleStatus);
router.delete('/:id', protect, authorize('admin'), productCtrl.deleteProduct);

module.exports = router;
