const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/** Recomputes product.rating / reviewCount from approved reviews. */
const syncProductRating = async (productId) => {
  const [agg] = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: agg ? Math.round(agg.avgRating * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
};

/** GET /api/products/:id/reviews — public, approved only */
exports.getProductReviews = asyncHandler(async (req, res) => {
  const filter = { product: req.params.id, isApproved: true };
  const { page, limit, skip } = getPagination(req.query, { limit: 6 });

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName'),
    Review.countDocuments(filter),
  ]);

  ok(res, {
    data: {
      reviews,
      meta: buildMeta({ page, limit }, total),
      breakdown: await buildBreakdown(req.params.id),
    },
  });
});

const buildBreakdown = async (productId) => {
  const rows = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return { 5: map[5] || 0, 4: map[4] || 0, 3: map[3] || 0, 2: map[2] || 0, 1: map[1] || 0 };
};

/** POST /api/products/:id/reviews — verified purchasers only */
exports.createReview = asyncHandler(async (req, res) => {
  const { rating, title = '', comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not found');

  // Verified purchase check — any non-cancelled order containing this product
  const purchase = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    status: { $ne: 'cancelled' },
  });
  if (!purchase)
    throw ApiError.forbidden('Only customers who purchased this product can write a review');

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    isApproved: false, // pending admin moderation
  });

  ok(res, {
    status: 201,
    message: 'Review submitted and awaiting approval',
    data: { review: { ...review.toObject(), user: { firstName: req.user.firstName, lastName: req.user.lastName } } },
  });
});
