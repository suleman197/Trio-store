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
router.put('/:id/cancel', orderCtrl.cancelOrder);
router.put('/:id/bank-screenshot', upload.single('screenshot'), orderCtrl.uploadBankScreenshot);

module.exports = router;
