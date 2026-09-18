/**
 * Consistent API response helpers.
 * Success: { success: true, message, data }
 * Error:   { success: false, message, error }
 */
const ok = (res, { status = 200, message = 'Success', data = null } = {}) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, { status = 500, message = 'Server error', error = null } = {}) =>
  res.status(status).json({ success: false, message, error });

module.exports = { ok, fail };
