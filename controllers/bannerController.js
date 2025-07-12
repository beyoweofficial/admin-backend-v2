const Banner = require('../models/Banner');
const cloudinary = require('../config/cloudinary');

// Create: Upload 5 banners
exports.uploadBanners = async (req, res) => {
  try {
    const files = req.files;
    const banners = [];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    for (const file of files) {
      const result = await cloudinary.uploader.upload_stream({
        folder: 'banners',
        resource_type: 'image',
      }, async (error, result) => {
        if (error) throw error;

        const banner = new Banner({
          imageUrl: result.secure_url,
          publicId: result.public_id,
          type: req.body.type || 'landscape',
        });

        await banner.save();
        banners.push(banner);

        if (banners.length === files.length) {
          res.status(201).json(banners);
        }
      });

      result.end(file.buffer);
    }
  } catch (error) {
    res.status(500).json({ message: 'Banner upload failed', error: error.message });
  }
};

// Replace: Update a banner image
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    // Delete old image from Cloudinary
    await cloudinary.uploader.destroy(banner.publicId);

    // Upload new image
    cloudinary.uploader.upload_stream({
      folder: 'banners',
    }, async (error, result) => {
      if (error) throw error;

      banner.imageUrl = result.secure_url;
      banner.publicId = result.public_id;
      await banner.save();

      res.status(200).json(banner);
    }).end(file.buffer);
  } catch (error) {
    res.status(500).json({ message: 'Banner update failed', error: error.message });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    await cloudinary.uploader.destroy(banner.publicId);
    await banner.deleteOne();

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete banner', error: error.message });
  }
};
