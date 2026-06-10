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
    
    const allowedOrigins = [
      ...envOrigins,
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
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
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

// Check Razorpay configuration on startup
const razorpay = require('./config/razorpay');
if (!razorpay) {
  console.warn('⚠️  Razorpay not configured - Payment functionality will not work');
  console.warn('   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
} else {
  console.log('✅ Razorpay configured successfully');
}

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

// Proxy CloudFront files to avoid CORS issues in development
if (isDevelopment) {
  const { createProxyMiddleware } = require('http-proxy-middleware');
  
  // Proxy all enigma/* paths through CloudFront
  app.use('/enigma', createProxyMiddleware({
    target: process.env.AWS_CLOUDFRONT_DOMAIN || 'https://d3l60mdhyx2j2v.cloudfront.net',
    changeOrigin: true,
    pathRewrite: {
      '^/enigma': '/enigma'
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }
  }));
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

// Fallback to local uploads rendering
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route with environment info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Enigma API Server - Next-Generation Manufacturing Procurement Platform',
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
  
  // Log more details in development
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

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` CORS enabled for: ${isDevelopment ? 'Development + Production URLs' : 'Production URL only'}`);
  console.log(`Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  
  if (isDevelopment) {
    console.log(` Development mode active`);
    console.log(` Local access: http://localhost:${PORT}`);
  } else {
    console.log(` Production mode active`);
  }
});