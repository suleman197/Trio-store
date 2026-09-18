const Product = require('../models/Product');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');

/** GET /api/search/suggest?q= — lightweight autocomplete for header search */
exports.suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return ok(res, { data: { suggestions: [] } });

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const products = await Product.find({
    status: 'active',
    $or: [{ name: rx }, { brand: rx }, { sku: rx }],
  })
    .limit(6)
    .select('name slug brand images price discountPrice');

  ok(res, { data: { suggestions: products } });
});

/** POST /api/newsletter — subscribe email */
exports.subscribeNewsletter = asyncHandler(async (req, res) => {
  const Subscriber = require('../models/Subscriber');
  await Subscriber.updateOne({ email: req.body.email }, { $set: { email: req.body.email } }, { upsert: true });
  ok(res, { status: 201, message: 'Subscribed successfully' });
});
