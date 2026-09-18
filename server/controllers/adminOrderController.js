const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../models/Order');

/** GET /api/admin/orders — filter by status/paymentStatus/search(orderNumber or email) */
exports.getOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.paymentStatus && PAYMENT_STATUSES.includes(req.query.paymentStatus))
    filter.paymentStatus = req.query.paymentStatus;

  const q = String(req.query.search || '').trim();
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customerInfo.email': rx }, { 'customerInfo.firstName': rx }, { 'customerInfo.lastName': rx }];
  }

  const { page, limit, skip } = getPagination(req.query, { limit: 15 });
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  ok(res, { data: { orders, meta: buildMeta({ page, limit }, total) } });
});

/** GET /api/admin/orders/:id */
exports.getOrderDetail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone');
  if (!order) throw ApiError.notFound('Order not found');
  ok(res, { data: { order } });
});

/** PUT /api/admin/orders/:id/status — update fulfillment status */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!ORDER_STATUSES.includes(status)) throw ApiError.badRequest('Invalid order status');

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === 'cancelled' && status !== 'cancelled')
    throw ApiError.badRequest('A cancelled order cannot be reopened');

  // Cancelling restores stock
  if (status === 'cancelled' && !['cancelled'].includes(order.status)) {
    const Product = require('../models/Product');
    const InventoryLog = require('../models/InventoryLog');
    for (const item of order.items.filter((i) => i.product)) {
      const updated = await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true });
      if (updated) {
        await InventoryLog.create({
          product: updated._id,
          previousQuantity: updated.stock - item.quantity,
          newQuantity: updated.stock,
          quantityChanged: item.quantity,
          reason: `Order ${order.orderNumber} cancelled by admin`,
          admin: req.user._id,
          order: order._id,
        });
      }
    }
    order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
  }

  order.status = status;
  order.statusHistory.push({ status, note: req.body.note || `Status updated to ${status}`, at: new Date() });
  await order.save();

  ok(res, { message: `Order marked as ${status}`, data: { order } });
});

/** PUT /api/admin/orders/:id/payment — update payment status */
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const paymentStatus = req.body.paymentStatus;
  if (!PAYMENT_STATUSES.includes(paymentStatus)) throw ApiError.badRequest('Invalid payment status');

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus },
    { new: true }
  );
  if (!order) throw ApiError.notFound('Order not found');
  ok(res, { message: `Payment marked as ${paymentStatus}`, data: { order } });
});
