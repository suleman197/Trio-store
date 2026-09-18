const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const { slugify } = require('../utils/slugify');

/** GET /api/categories (public — active only) */
exports.getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ name: 1 });
  ok(res, { data: { categories } });
});

/** GET /api/categories/:id */
exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  ok(res, { data: { category } });
});

/** POST /api/categories (admin) */
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description = '', image = '', isActive = true } = req.body;
  const slug = slugify(name);
  const exists = await Category.findOne({ $or: [{ name }, { slug }] });
  if (exists) throw ApiError.conflict('A category with this name already exists');

  const category = await Category.create({ name, slug, description, image, isActive });
  ok(res, { status: 201, message: 'Category created successfully', data: { category } });
});

/** PUT /api/categories/:id (admin) */
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const { name, description, image, isActive } = req.body;
  if (name && name !== category.name) {
    const clash = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
    if (clash) throw ApiError.conflict('A category with this name already exists');
    category.name = name.trim();
    category.slug = slugify(name);
  }
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  ok(res, { message: 'Category updated successfully', data: { category } });
});

/** DELETE /api/categories/:id (admin) */
exports.deleteCategory = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0)
    throw ApiError.badRequest(`Cannot delete — ${productCount} product(s) still reference this category`);

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  ok(res, { message: 'Category deleted successfully' });
});
