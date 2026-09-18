const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingsRoutes = require('./routes/siteSettingsRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// ---------- Security & parsing ----------
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));

// Request logging
const morgan = require('morgan');
app.use(morgan('dev'));

// ---------- Root / Health ----------
app.get('/api', (req, res) =>
  res.json({ success: true, message: 'Electronics Store API is running', data: { version: '1.0.0', uptime: process.uptime() } })
);
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'APIs is healthy', data: { uptime: process.uptime() } })
);

// ---------- Static uploads ----------
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);

// ---------- Errors ----------
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

module.exports = app;
