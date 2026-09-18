const SiteSettings = require('../models/SiteSettings');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');

/** GET /api/settings — public, returns site settings (creates defaults if none exist) */
exports.getSettings = asyncHandler(async (_req, res) => {
  let settings = await SiteSettings.findById('site');
  if (!settings) settings = await SiteSettings.create({ _id: 'site' });
  ok(res, { data: { settings } });
});

/** PUT /api/settings — admin only, updates settings */
exports.updateSettings = asyncHandler(async (req, res) => {
  const allowed = [
    'brandName', 'logoUrl', 'tagline',
    'announcementText', 'announcementEnabled',
    'contactEmail', 'contactPhone', 'address',
    'aboutText', 'footerCopyright',
    'socialLinks',
    'metaTitle', 'metaDescription',
    'bankName', 'bankAccountTitle', 'bankAccountNumber', 'bankDiscountPercent',
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const settings = await SiteSettings.findByIdAndUpdate(
    'site',
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  ok(res, { message: 'Settings updated', data: { settings } });
});
