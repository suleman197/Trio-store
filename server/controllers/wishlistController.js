const Wishlist = require('../models/Wishlist');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');

/** GET /api/wishlist */
exports.getWishlist = asyncHandler(async (req, res) => {
  let wl = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    select: 'name slug brand images price discountPrice stock status rating reviewCount',
  });
  if (!wl) wl = { products: [] };
  ok(res, { data: { products: wl.products.filter((p) => p && p.status === 'active') } });
});

/** POST /api/wishlist/:productId */
exports.addToWishlist = asyncHandler(async (req, res) => {
  const product = await require('../models/Product').findById(req.params.productId).select('status');
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not found');

  const wl = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: product._id } },
    { upsert: true, new: true }
  ).populate({ path: 'products', select: 'name slug brand images price discountPrice stock status rating reviewCount' });

  ok(res, {
    status: 201,
    message: 'Added to wishlist',
    data: { products: wl.products.filter((p) => p && p.status === 'active') },
  });
});

/** DELETE /api/wishlist/:productId */
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const wl = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } },
    { new: true }
  );
  if (!wl) throw ApiError.notFound('Wishlist not found');
  ok(res, {
    message: 'Removed from wishlist',
    data: { products: wl.products },
  });
});
