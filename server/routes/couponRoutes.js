const router = require('express').Router();
const ctrl = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { couponRules, validateCouponRules } = require('../validators/commonValidator');

// Customer — validate at checkout
router.post('/validate', protect, validateCouponRules, validate, ctrl.validateCoupon);

// Admin CRUD
router.use('/', protect, authorize('admin'));
router.get('/', ctrl.getCoupons);
router.post('/', couponRules, validate, ctrl.createCoupon);
router.put('/:id', couponRules, validate, ctrl.updateCoupon);
router.delete('/:id', ctrl.deleteCoupon);

module.exports = router;
