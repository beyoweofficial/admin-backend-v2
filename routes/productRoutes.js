const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { upload, handleMulterError } = require('../middlewares/uploadMiddleware');
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

router.post('/', protect, upload.array('images', 3), handleMulterError, createProduct);
router.get('/', getAllProducts);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
