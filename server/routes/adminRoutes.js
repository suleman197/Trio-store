const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const adminOrderCtrl = require('../controllers/adminOrderController');
const orderCtrl = require('../controllers/orderController');
const inventoryCtrl = require('../controllers/inventoryController');
const couponCtrl = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Every /api/admin/* route requires an authenticated admin
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', adminCtrl.getDashboard);

// Orders
router.get('/orders', adminOrderCtrl.getOrders);
router.get('/orders/:id', adminOrderCtrl.getOrderDetail);
router.put('/orders/:id/status', validate, adminOrderCtrl.updateOrderStatus);
router.put('/orders/:id/payment', validate, adminOrderCtrl.updatePaymentStatus);
router.put('/orders/:id/verify-bank', orderCtrl.verifyBankPayment);
router.put('/orders/:id/reject-bank', orderCtrl.rejectBankPayment);

// Customers
router.get('/customers', adminCtrl.getCustomers);
router.get('/customers/:id', adminCtrl.getCustomerDetail);
router.patch('/customers/:id/status', adminCtrl.toggleCustomerStatus);

// Inventory
router.get('/inventory', inventoryCtrl.getInventory);
router.get('/inventory/:productId/history', inventoryCtrl.getStockHistory);
router.patch('/inventory/:productId/adjust', inventoryCtrl.adjustStock);

// Reviews moderation
router.get('/reviews', adminCtrl.getReviews);
router.patch('/reviews/:id/approve', adminCtrl.approveReview);
router.delete('/reviews/:id', adminCtrl.deleteReview);

// Coupons
router.get('/coupons', couponCtrl.getCoupons);

module.exports = router;
