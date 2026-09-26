const router = require('express').Router();
const { upload } = require('../config/cloudinary');
const { uploadImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// POST /api/admin/upload — single image upload with error handling
router.post(
  '/upload',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image size exceeds the 10MB limit. Please upload a smaller image.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Image upload failed',
        });
      }
      next();
    });
  },
  uploadImage
);

module.exports = router;
