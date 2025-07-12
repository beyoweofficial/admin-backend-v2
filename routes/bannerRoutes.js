const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { upload, handleMulterError } = require('../middlewares/uploadMiddleware');
const {
  uploadBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

// Upload banners (up to 5)
router.post('/', protect, upload.array('banners', 5), handleMulterError, uploadBanners);

// Replace single banner
router.put('/:id', protect, upload.single('banner'), handleMulterError, updateBanner);

// Delete
router.delete('/:id', protect, deleteBanner);

module.exports = router;
