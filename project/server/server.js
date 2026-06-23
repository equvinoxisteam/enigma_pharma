require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
// const { initializeAdmin } = require('./middlewares/admin'); // Admin not needed for now
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const contactRoutes = require('./routes/contactRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const sellRoutes = require('./routes/sellRoutes');
const repairRoutes = require('./routes/repairRoutes');
const recycleRoutes = require('./routes/recycleRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const stockNotificationRoutes = require('./routes/stockNotificationRoutes');
const otpRoutes = require('./routes/otpRoutes');
const businessRoutes = require('./routes/businessRoutes');
const sellerRoutes = require('./routes/sellerRoutes');


const app = express();

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration for both environments
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const productionFallbackOrigins = isProduction ? [
      'https://enigmapharma.equvinoxis.com',
      'https://www.enigmapharma.equvinoxis.com',
      'https://api.enigmapharma.equvinoxis.com',
    ] : [];

    const allowedOrigins = [
      ...envOrigins,
      ...productionFallbackOrigins,
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
      // Development URLs
      ...(isDevelopment ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:3000',
      ] : []),
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Connect to database
connectDB();

// Razorpay disabled for Enigma Pharma — upgrades via admin approval only

// Initialize admin - commented out as not needed
// initializeAdmin();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers for production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// Request logging for development
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
  });
}

// Proxy S3 files in development to avoid CORS issues with CAD viewers
if (isDevelopment) {
  const { createProxyMiddleware } = require('http-proxy-middleware');
  const { getPublicBaseUrl } = require('./config/aws');
  const s3Base = getPublicBaseUrl();

  if (s3Base) {
    app.use('/enigma', createProxyMiddleware({
      target: s3Base,
      changeOrigin: true,
      onProxyRes: (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
      }
    }));
  }
}

// Routes - Enigma API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rfqs', require('./routes/rfqRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/recycle', recycleRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/stock-notifications', stockNotificationRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/seller', sellerRoutes);
// Keep upload route for file uploads
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/upload', uploadRoutes);
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes')); 

// Local file storage (used when S3 IAM is unavailable)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check route with environment info
app.get('/api/health', (req, res) => {
  let storage = 'local';
  let adminConfigured = false;
  try {
    const { getStorageMode } = require('./utils/s3Upload');
    storage = getStorageMode();
  } catch { /* ignore */ }
  try {
    adminConfigured = require('./utils/envUtils').getAdminCredentials().configured;
  } catch { /* ignore */ }

  res.json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    storage,
    adminConfigured,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Enigma Pharma API Server - Pharmaceutical CDMO Procurement Platform',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      upload: '/api/upload',
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);

  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      message: 'Origin not allowed',
      error: isDevelopment ? err.message : 'CORS blocked'
    });
  }

  if (isDevelopment) {
    console.error('Request details:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });
  }
  
  res.status(err.status || 500).json({
    message: 'Server error',
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
const { probeS3WriteAccess } = require('./config/aws');

app.listen(PORT, async () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` CORS enabled for: ${isDevelopment ? 'Development + Production URLs' : 'Production URL only'}`);
  console.log(`Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(` API_URL for file URLs: ${process.env.API_URL || 'not set'}`);

  await probeS3WriteAccess();

  if (isDevelopment) {
    console.log(` Development mode active`);
    console.log(` Local access: http://localhost:${PORT}`);
  } else {
    console.log(` Production mode active`);
  }
});