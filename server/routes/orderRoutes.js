const router = require('express').Router();
const orderCtrl = require('../controllers/orderController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderRules } = require('../validators/orderValidator');

router.use(protect);
router.post('/', createOrderRules, validate, orderCtrl.placeOrder);
router.get('/', orderCtrl.getMyOrders);
router.get('/:id', orderCtrl.getOrder);
router.put(
  '/:id/bank-screenshot',
  (req, res, next) => {
    upload.single('screenshot')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Screenshot size exceeds the 10MB limit. Please upload a smaller image.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Screenshot upload failed',
        });
      }
      next();
    });
  },
  orderCtrl.uploadBankScreenshot
);

module.exports = router;
