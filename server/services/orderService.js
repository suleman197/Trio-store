const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');
const Coupon = require('../models/Coupon');
const SiteSettings = require('../models/SiteSettings');
const { applyCoupon } = require('./couponService');
const { sendOrderConfirmationEmail } = require('./emailService');
const ApiError = require('../utils/ApiError');

const TAX_RATE = 0.02; // 2% sales tax
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 0;

/**
 * Creates an order:
 *  1. Validates every item against live product data (active, stock > 0)
 *  2. Atomically decrements stock ($inc with guard) and writes inventory logs
 *  3. Applies optional coupon (increments usedCount)
 *  4. Applies bank transfer 20% discount if applicable
 *  5. Persists the order with a generated order number
 *  6. Clears the customer's cart
 */
const createOrder = async (user, payload) => {
  const { items, customerInfo, shippingAddress, paymentMethod = 'cod', couponCode, bankDetails } = payload;

  // ---- Validate items & compute subtotal from authoritative prices ----
  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' });

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = productMap.get(item.product);
    if (!product) throw ApiError.badRequest(`Product ${item.product} is unavailable`);
    if (product.stock < item.quantity)
      throw ApiError.badRequest(`Insufficient stock for "${product.name}" (${product.stock} left)`);

    const price = (product.discountPrice && Number(product.discountPrice) < Number(product.price))
      ? Number(product.discountPrice)
      : Number(product.price);
    subtotal += price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: (product.images && product.images[0]) || '',
      variant: item.variant || {},
      price,
      quantity: item.quantity,
    });
  }
  subtotal = Math.round(subtotal * 100) / 100;

  // ---- Coupon discount ----
  let discount = 0;
  let appliedCouponCode = null;
  let couponDoc = null;
  if (couponCode) {
    const result = await applyCoupon(couponCode, subtotal);
    discount = result.discount;
    couponDoc = result.coupon;
    appliedCouponCode = couponDoc.code;
  }

  // ---- Bank transfer discount (Flat PKR discount) ----
  let bankDiscount = 0;
  if (paymentMethod === 'bank') {
    const settings = await SiteSettings.findById('site').lean();
    const flatDiscount = Number(settings?.bankDiscountPercent) || 200;
    bankDiscount = Math.min(Math.max(0, subtotal - discount), flatDiscount);
  }

  // ---- Shipping & tax ----
  const shippingFee = 0;
  const taxableAmount = subtotal - discount - bankDiscount;
  const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  // ---- Atomic stock decrement with inventory logging ----
  for (const item of orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!updated) throw ApiError.conflict(`Stock changed while placing order — please retry "${item.name}"`);

    await InventoryLog.create({
      product: updated._id,
      previousQuantity: updated.stock + item.quantity,
      newQuantity: updated.stock,
      quantityChanged: -item.quantity,
      reason: `Order placement`,
      admin: null,
    });
  }

  // ---- Persist order ----
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
  const order = await Order.create({
    orderNumber,
    user: user._id,
    customerInfo,
    shippingAddress,
    items: orderItems,
    subtotal,
    discount,
    bankDiscount,
    shippingFee,
    tax,
    total,
    couponCode: appliedCouponCode,
    paymentMethod,
    paymentStatus: paymentMethod === 'bank' ? 'pending_verification' : 'pending',
    status: 'pending',
    bankDetails: paymentMethod === 'bank' ? {
      bankName: bankDetails?.bankName || '',
      accountTitle: bankDetails?.accountTitle || '',
      accountNumber: bankDetails?.accountNumber || '',
    } : undefined,
    statusHistory: [{ status: 'pending', note: 'Order placed', at: new Date() }],
  });

  // ---- Coupon usage bookkeeping (non-fatal on failure) ----
  if (couponDoc) {
    try {
      couponDoc.usedCount += 1;
      await couponDoc.save();
    } catch {
      /* usage limit raced; acceptable drift */
    }
  }

  // ---- Clear cart ----
  await Cart.deleteOne({ user: user._id });

  // ---- Dispatch confirmation email to customer ----
  try {
    await sendOrderConfirmationEmail(order);
  } catch (err) {
    console.error('[email] Order confirmation email error:', err.message);
  }

  return order;
};

module.exports = { createOrder };
