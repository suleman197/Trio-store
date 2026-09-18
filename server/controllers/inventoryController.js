const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/admin/inventory
 * Query: search (name/sku), status=in_stock|low_stock|out_of_stock, page, limit
 */
exports.getInventory = asyncHandler(async (req, res) => {
  const filter = {};
  const q = String(req.query.search || '').trim();
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { sku: rx }];
  }

  let products;
  let total;

  if (['in_stock', 'low_stock', 'out_of_stock'].includes(req.query.status)) {
    // Status is computed; use aggregation to filter on it
    const pipeline = [
      ...(q ? [{ $match: filter }] : []),
      {
        $addFields: {
          stockStatus: {
            $switch: {
              branches: [
                { case: { $lte: ['$stock', 0] }, then: 'out_of_stock' },
                { case: { $lte: ['$stock', '$lowStockThreshold'] }, then: 'low_stock' },
              ],
              default: 'in_stock',
            },
          },
        },
      },
      { $match: { stockStatus: req.query.status } },
      { $sort: { stock: 1, name: 1 } },
      {
        $facet: {
          rows: [{ $skip: (parseInt(req.query.page, 10) - 1 || 0) * 20 }, { $limit: Math.min(parseInt(req.query.limit, 10) || 20, 100) }],
          count: [{ $count: 'total' }],
        },
      },
    ];
    const [result] = await Product.aggregate(pipeline);
    total = result.count[0]?.total || 0;
    return ok(res, { data: { inventory: result.rows, meta: buildMeta({ page: parseInt(req.query.page) || 1, limit: 20 }, total) } });
  }

  ({ page, limit, skip } = getPagination(req.query, { limit: 20 }));
  [products, total] = await Promise.all([
    Product.find(filter).select('name sku stock lowStockThreshold images').sort({ name: 1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  const inventory = products.map((p) => ({
    _id: p._id,
    name: p.name,
    sku: p.sku,
    image: p.images?.[0],
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    stockStatus: p.stock <= 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock',
  }));

  ok(res, { data: { inventory, meta: buildMeta({ page, limit }, total) } });
});

/**
 * PATCH /api/admin/inventory/:productId/adjust
 * Body: { type: 'increase'|'decrease'|'set', quantity, reason }
 */
exports.adjustStock = asyncHandler(async (req, res) => {
  const { type, quantity, reason } = req.body;
  if (!['increase', 'decrease', 'set'].includes(type)) throw ApiError.badRequest('Invalid adjustment type');
  if (reason === undefined || String(reason).trim() === '')
    throw ApiError.badRequest('A reason is required for every stock adjustment');

  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || qty < 0) throw ApiError.badRequest('Quantity must be a non-negative number');

  const product = await Product.findById(req.params.productId);
  if (!product) throw ApiError.notFound('Product not found');

  const previousQuantity = product.stock;
  let newQuantity;
  if (type === 'increase') newQuantity = previousQuantity + qty;
  else if (type === 'decrease') newQuantity = previousQuantity - qty;
  else newQuantity = qty;

  if (newQuantity < 0) throw ApiError.badRequest(`Cannot decrease below zero — current stock is ${previousQuantity}`);

  product.stock = newQuantity;
  await product.save();

  await InventoryLog.create({
    product: product._id,
    previousQuantity,
    newQuantity,
    quantityChanged: newQuantity - previousQuantity,
    reason: String(reason).trim(),
    admin: req.user._id,
  });

  ok(res, {
    message: `Stock updated — ${previousQuantity} → ${newQuantity}`,
    data: {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        stockStatus:
          product.stock <= 0 ? 'out_of_stock' : product.stock <= product.lowStockThreshold ? 'low_stock' : 'in_stock',
      },
    },
  });
});

/** GET /api/admin/inventory/:productId/history */
exports.getStockHistory = asyncHandler(async (req, res) => {
  const history = await InventoryLog.find({ product: req.params.productId })
    .sort({ at: -1, createdAt: -1 })
    .limit(50)
    .populate('admin', 'firstName lastName')
    .populate('order', 'orderNumber');
  ok(res, { data: { history } });
});
