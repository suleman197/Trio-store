const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/** POST /api/admin/upload — upload image via multer */
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  let url, publicId;

  if (isCloudinaryConfigured) {
    // Cloudinary returns file info on req.file
    url = req.file.path;
    publicId = req.file.filename;
  } else {
    // Local disk storage — construct URL from filename
    url = `/uploads/${req.file.filename}`;
    publicId = req.file.filename;
  }

  ok(res, { data: { url, publicId } });
});
