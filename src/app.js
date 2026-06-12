const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { AppError } = require('./utils/errors');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const couponRoutes = require('./routes/coupon.routes');

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/coupons', couponRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
  }

  return res.status(500).json({
    success: false,
    message: env.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

module.exports = app;
