/** Parse page/limit query params into pagination metadata. */
const getPagination = (query, defaults = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaults.limit || 12, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
});

module.exports = { getPagination, buildMeta };
