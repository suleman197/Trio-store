const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Hardcoded Cloudinary credentials — from https://console.cloudinary.com → Account Details
const CLOUDINARY_API_KEY = '211952367235841';
const CLOUDINARY_API_SECRET = 'J9uEJ4HHcv3ecwla2waPEDHF11w';
const CLOUDINARY_CLOUD_NAME = 'dl4joexmw';

// Configure Cloudinary
const isCloudinaryConfigured = CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET && CLOUDINARY_CLOUD_NAME;
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'voltiq/uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Fallback: local disk storage when Cloudinary is not configured
const localDir = path.join(__dirname, '..', 'uploads');
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const fs = require('fs');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    cb(null, localDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: isCloudinaryConfigured ? storage : diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

module.exports = { cloudinary, upload, isCloudinaryConfigured };
