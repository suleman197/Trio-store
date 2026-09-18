const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { slugify } = require('../utils/slugify');

/**
 * GET /api/products
 * Query: search, category (slug or id), brand (csv), minPrice, maxPrice, rating,
 *        inStock, featured, bestseller, sort, page, limit
 */
exports.getProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { status: 'active' };

  if (q.search) {
    filter.$or = [
      { name: { $regex: escapeRegex(q.search), $options: 'i' } },
      { brand: { $regex: escapeRegex(q.search), $options: 'i' } },
      { sku: { $regex: escapeRegex(q.search), $options: 'i' } },
    ];
  }

  if (q.category) {
    let categoryDoc = null;
    if (/^[a-f\d]{24}$/i.test(q.category)) categoryDoc = await Category.findById(q.category).select('_id');
    if (!categoryDoc) categoryDoc = await Category.findOne({ slug: q.category });
    if (!categoryDoc) throw ApiError.notFound('Category not found');
    filter.category = categoryDoc._id;
  }

  if (q.brand) {
    const brands = String(q.brand)
      .split(',')
      .map((b) => new RegExp(`^${escapeRegex(b.trim())}$`, 'i'))
      .filter(Boolean);
    if (brands.length) filter.brand = { $in: brands };
  }

  if (q.minPrice || q.maxPrice) {
    filter.price = {};
    if (q.minPrice) filter.price.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
  }

  if (q.rating) filter.rating = { $gte: Number(q.rating) };
  if (q.inStock === 'true') filter.stock = { $gt: 0 };
  if (q.featured === 'true') filter.featured = true;
  if (q.bestseller === 'true') filter.bestseller = true;

  // Price sorts use the *effective* (discounted) price
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-low': { sortPrice: 1 },
    'price-high': { sortPrice: -1 },
    rating: { rating: -1, reviewCount: -1 },
    popular: { reviewCount: -1, rating: -1 },
    name: { name: 1 },
  };
  const sort = sortMap[q.sort] || sortMap.newest;

  const { page, limit, skip } = getPagination(req.query);

  const [result] = await Product.aggregate([
    { $match: filter },
    { $addFields: { sortPrice: { $ifNull: ['$discountPrice', '$price'] } } },
    {
      $facet: {
        items: [
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          { $unset: 'sortPrice' },
        ],
        count: [{ $count: 'total' }],
      },
    },
  ]);

  const products = result?.items || [];
  const total = result?.count[0]?.total || 0;

  ok(res, { data: { products, meta: buildMeta({ page, limit }, total) } });
});

/** GET /api/products/brands — distinct active brands for the shop filter. */
exports.getBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct('brand', { status: 'active' });
  ok(res, { data: { brands: brands.sort() } });
});

/** GET /api/products/:id — accepts MongoId or slug. */
exports.getProduct = asyncHandler(async (req, res) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

  const product = await Product.findOne(query).populate('category', 'name slug');
  if (!product || product.status === 'disabled') throw ApiError.notFound('Product not found');

  // Related products from same category
  const related = await Product.find({
    category: product.category?._id,
    _id: { $ne: product._id },
    status: 'active',
  })
    .limit(4)
    .select('name slug brand images price discountPrice rating reviewCount stock');

  ok(res, { data: { product, related } });
});

/** POST /api/products (admin) */
exports.createProduct = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body);
  payload.slug = await uniqueSlug(payload.name);
  const product = await Product.create(payload);
  ok(res, { status: 201, message: 'Product created successfully', data: { product } });
});

/** PUT /api/products/:id (admin) */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const payload = sanitizePayload(req.body);
  if (payload.name && payload.name !== product.name) payload.slug = await uniqueSlug(payload.name, product._id);

  Object.assign(product, payload);
  await product.save();
  ok(res, { message: 'Product updated successfully', data: { product } });
});

/** DELETE /api/products/:id (admin) */
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  ok(res, { message: 'Product deleted successfully' });
});

/** PATCH /api/products/:id/status (admin) — enable/disable */
exports.toggleStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.status = product.status === 'active' ? 'disabled' : 'active';
  await product.save();
  ok(res, { message: `Product ${product.status}`, data: { product } });
});

// ---------- helpers ----------
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function uniqueSlug(name, excludeId = null) {
  let slug = slugify(name) || `product-${Date.now().toString(36)}`;
  let candidate = slug;
  let counter = 2;
  // Loop until a free slug found
  for (;;) {
    const clash = await Product.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
    if (!clash) return candidate;
    candidate = `${slug}-${counter++}`;
  }
}

function sanitizePayload(body) {
  const p = { ...body };
  ['price'].forEach((f) => {
    if (p[f] !== undefined) p[f] = Number(p[f]);
  });
  ['discountPrice'].forEach((f) => {
    if (p[f] === '' || p[f] === undefined || p[f] === null) p[f] = null;
    else p[f] = Number(p[f]);
  });
  ['stock', 'lowStockThreshold'].forEach((f) => {
    if (p[f] !== undefined && p[f] !== '') p[f] = Math.max(parseInt(p[f], 10) || 0, 0);
  });
  delete p.slug;
  delete p.rating;
  delete p.reviewCount;
  delete p._id;
  return p;
}
