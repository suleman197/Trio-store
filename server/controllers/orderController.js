const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { createOrder } = require('../services/orderService');

/** POST /api/orders */
exports.placeOrder = asyncHandler(async (req, res) => {
  const order = await createOrder(req.user, req.body);
  ok(res, { status: 201, message: 'Order placed successfully', data: { order } });
});

/** GET /api/orders — current customer's orders */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const { page, limit, skip } = getPagination(req.query, { limit: 10 });
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  ok(res, { data: { orders, meta: buildMeta({ page, limit }, total) } });
});

/** GET /api/orders/:id — owner or admin */
exports.getOrder = asyncHandler(async (req, res) => {
  const query = /^[a-f\d]{24}$/i.test(req.params.id)
    ? { _id: req.params.id }
    : { orderNumber: req.params.id.toUpperCase() };

  const order = await Order.findOne(query);
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.user && order.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You cannot view this order');

  ok(res, { data: { order } });
});

/** PUT /api/orders/:id/cancel — customer cancels own pending/confirmed order */
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw ApiError.forbidden('You cannot cancel this order');
  if (!['pending', 'confirmed'].includes(order.status))
    throw ApiError.badRequest(`Orders in "${order.status}" state can no longer be cancelled`);

  // Restore stock for every line item + write inventory logs
  const Product = require('../models/Product');
  const InventoryLog = require('../models/InventoryLog');
  for (const item of order.items.filter((i) => i.product)) {
    const updated = await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { new: true }
    );
    if (updated) {
      await InventoryLog.create({
        product: updated._id,
        previousQuantity: updated.stock - item.quantity,
        newQuantity: updated.stock,
        quantityChanged: item.quantity,
        reason: `Order ${order.orderNumber} cancelled by customer`,
        admin: null,
        order: order._id,
      });
    }
  }

  order.status = 'cancelled';
  order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
  order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer', at: new Date() });
  await order.save();

  ok(res, { message: 'Order cancelled', data: { order } });
});

/** PUT /api/orders/:id/bank-screenshot — customer uploads payment screenshot */
exports.uploadBankScreenshot = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw ApiError.forbidden('You cannot modify this order');
  if (order.paymentMethod !== 'bank') throw ApiError.badRequest('This order is not a bank transfer order');
  if (!req.file) throw ApiError.badRequest('No screenshot file provided');

  let screenshotUrl;
  const { isCloudinaryConfigured } = require('../config/cloudinary');
  if (isCloudinaryConfigured) {
    screenshotUrl = req.file.path;
  } else {
    screenshotUrl = `/uploads/${req.file.filename}`;
  }

  order.bankDetails.screenshotUrl = screenshotUrl;
  order.bankDetails.uploadedAt = new Date();
  order.paymentStatus = 'pending_verification';
  await order.save();

  ok(res, { message: 'Screenshot uploaded', data: { order } });
});

/** PUT /api/admin/orders/:id/verify-bank — admin verifies bank payment */
exports.verifyBankPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentMethod !== 'bank') throw ApiError.badRequest('This is not a bank transfer order');

  order.paymentStatus = 'paid';
  order.bankDetails.verifiedAt = new Date();
  order.statusHistory.push({ status: order.status, note: 'Bank payment verified by admin', at: new Date() });
  await order.save();

  ok(res, { message: 'Payment verified', data: { order } });
});

/** PUT /api/admin/orders/:id/reject-bank — admin rejects bank payment */
exports.rejectBankPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentMethod !== 'bank') throw ApiError.badRequest('This is not a bank transfer order');

  order.paymentStatus = 'failed';
  order.bankDetails.rejectionReason = req.body.reason || 'Payment not verified';
  order.statusHistory.push({ status: order.status, note: `Bank payment rejected: ${req.body.reason || 'Not verified'}`, at: new Date() });
  await order.save();

  ok(res, { message: 'Payment rejected', data: { order } });
});
