const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');

/** Populated cart with per-line + grand totals. */
const buildCartResponse = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug sku images price discountPrice stock lowStockThreshold status brand',
  });
  if (!cart) return { items: [], subtotal: 0, itemCount: 0 };

  // Drop lines whose product was deleted/disabled
  const validItems = [];
  let subtotal = 0;
  for (const item of cart.items) {
    if (!item.product || item.product.status !== 'active') continue;
    const unitPrice =
      item.product.discountPrice && Number(item.product.discountPrice) < Number(item.product.price)
        ? Number(item.product.discountPrice)
        : Number(item.product.price);
    subtotal += unitPrice * item.quantity;
    validItems.push({
      _id: item._id,
      product: item.product,
      variant: Object.fromEntries(item.variant || new Map()),
      quantity: item.quantity,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
    });
  }

  return {
    items: validItems,
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount: validItems.reduce((n, i) => n + i.quantity, 0),
  };
};

/** GET /api/cart */
exports.getCart = asyncHandler(async (req, res) => {
  ok(res, { data: await buildCartResponse(req.user._id) });
});

/** POST /api/cart — body: { productId, quantity?, variant? } */
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant = {} } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not available');
  if (product.stock <= 0) throw ApiError.badRequest('This product is out of stock');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const variantKey = JSON.stringify(variant || {});
  const existing = cart.items.find(
    (i) => i.product.toString() === productId && JSON.stringify(Object.fromEntries(i.variant || new Map())) === variantKey
  );

  const requestedQty = (existing ? existing.quantity : 0) + Number(quantity);
  if (requestedQty > product.stock)
    throw ApiError.badRequest(`Only ${product.stock} unit(s) of "${product.name}" in stock`);

  if (existing) existing.quantity = requestedQty;
  else cart.items.push({ product: productId, variant, quantity: Number(quantity) });

  await cart.save();
  ok(res, { status: 201, message: 'Added to cart', data: await buildCartResponse(req.user._id) });
});

/** PUT /api/cart/:itemId — body: { quantity } (0 removes the line) */
exports.updateCartItem = asyncHandler(async (req, res) => {
  const qty = Number(req.body.quantity);
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (qty <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.product).select('stock');
    if (!product) throw ApiError.notFound('Product no longer exists');
    if (qty > product.stock) throw ApiError.badRequest(`Only ${product.stock} unit(s) in stock`);
    item.quantity = qty;
  }

  await cart.save();
  ok(res, { message: 'Cart updated', data: await buildCartResponse(req.user._id) });
});

/** DELETE /api/cart/:itemId */
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();

  await cart.save();
  ok(res, { message: 'Item removed from cart', data: await buildCartResponse(req.user._id) });
});

/** DELETE /api/cart — empty entire cart */
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.deleteOne({ user: req.user._id });
  ok(res, { message: 'Cart cleared', data: { items: [], subtotal: 0, itemCount: 0 } });
});
