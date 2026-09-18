const router = require('express').Router();
const { upload } = require('../config/cloudinary');
const { uploadImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// POST /api/admin/upload — single image upload
router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;
