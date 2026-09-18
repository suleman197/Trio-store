const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/** GET /api/admin/dashboard — KPIs + chart aggregates */
exports.getDashboard = asyncHandler(async (req, res) => {
  const [
    totalSalesAgg,
    totalOrders,
    totalProducts,
    totalCustomers,
    pendingOrders,
    lowStockCount,
    outOfStockCount,
    salesByDay,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({}),
    Product.countDocuments({}),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments({ $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] } }),
    Product.countDocuments({ stock: 0 }),
    // Last 14 days revenue trend
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 13 * 86400000) }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Best sellers by units sold
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5),
  ]);

  ok(res, {
    data: {
      stats: {
        totalSales: totalSalesAgg[0]?.revenue || 0,
        paidOrders: totalSalesAgg[0]?.count || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
        pendingOrders,
        lowStockCount,
        outOfStockCount,
      },
      salesByDay: salesByDay.map((d) => ({ date: d._id, revenue: Math.round(d.revenue), orders: d.orders })),
      topProducts,
      recentOrders,
    },
  });
});

/** GET /api/admin/customers — list with order stats */
exports.getCustomers = asyncHandler(async (req, res) => {
  const q = String(req.query.search || '').trim();
  const filter = { role: 'customer' };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
  }

  const { page, limit, skip } = getPagination(req.query, { limit: 12 });

  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);

  // Aggregate per-customer spend/order counts in one query
  const spends = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
  ]);
  const spendMap = new Map(spends.map((s) => [s._id.toString(), s]));

  const customers = users.map((u) => ({
    id: u._id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone,
    createdAt: u.createdAt,
    isActive: u.isActive,
    orderCount: spendMap.get(u._id.toString())?.orderCount || 0,
    totalSpent: spendMap.get(u._id.toString())?.totalSpent || 0,
  }));

  ok(res, { data: { customers, meta: buildMeta({ page, limit }, total) } });
});

/** GET /api/admin/customers/:id — profile + order history */
exports.getCustomerDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Customer not found');

  const [orders, totals] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).select('orderNumber items.name total paymentStatus status createdAt'),
    Order.aggregate([
      { $match: { user: user._id, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]),
  ]);

  ok(res, {
    data: {
      customer: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        isActive: user.isActive,
      },
      stats: { orderCount: totals[0]?.orderCount || 0, totalSpent: totals[0]?.totalSpent || 0 },
      orders,
    },
  });
});

/** PATCH /api/admin/customers/:id/status — activate/deactivate */
exports.toggleCustomerStatus = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id))
    throw ApiError.badRequest('You cannot deactivate your own account');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Customer not found');
  user.isActive = !user.isActive;
  await user.save();
  ok(res, { message: `Account ${user.isActive ? 'activated' : 'deactivated'}`, data: { customer: { id: user._id, isActive: user.isActive } } });
});

/** GET /api/admin/reviews + moderation actions */
exports.getReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.approved === 'true') filter.isApproved = true;
  if (req.query.approved === 'false') filter.isApproved = false;

  const { page, limit, skip } = getPagination(req.query, { limit: 12 });
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name slug images'),
    Review.countDocuments(filter),
  ]);
  ok(res, { data: { reviews, meta: buildMeta({ page, limit }, total) } });
});

/** PATCH /api/admin/reviews/:id/approve */
exports.approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  review.isApproved = true;
  await review.save();
  await syncRating(review.product);
  ok(res, { message: 'Review approved', data: { review } });
});

/** DELETE /api/admin/reviews/:id */
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  const productId = review.product;
  await review.deleteOne();
  await syncRating(productId);
  ok(res, { message: 'Review deleted successfully' });
});

const syncRating = async (productId) => {
  const [agg] = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: agg ? Math.round(agg.avgRating * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
};
