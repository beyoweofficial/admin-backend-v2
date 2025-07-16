const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('./config/db');
const cors = require('cors');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const quickShoppingRoutes = require('./routes/quickShoppingRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./src/docs/swagger');

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quick-shopping', quickShoppingRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Global error handler (must be after all routes)
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size allowed is 1MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Please select fewer files.',
        error: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error.',
      error: error.code
    });
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      error: error.message
    });
  }
  
  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
