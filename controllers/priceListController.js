const PriceList = require('../models/PriceList');
const cloudinary = require('../config/cloudinary');

// Upload PDF to Cloudinary and save to database
const uploadPriceList = async (req, res) => {
  try {
    const { documentName } = req.body;
    const adminId = req.admin.id;

    // Validate required fields
    if (!documentName) {
      return res.status(400).json({
        success: false,
        message: 'Document name is required'
      });
    }

    // Check if a price list already exists (only one allowed)
    const existingPriceList = await PriceList.findOne();
    if (existingPriceList) {
      return res.status(400).json({
        success: false,
        message: 'A price list already exists. Please delete the existing one before uploading a new one.'
      });
    }

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed'
      });
    }

    // Validate file size (1GB = 1073741824 bytes)
    if (req.file.size > 1073741824) {
      return res.status(400).json({
        success: false,
        message: 'File size cannot exceed 1GB'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'price-lists',
          public_id: `price-list-${Date.now()}`,
          format: 'pdf'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Save to database
    const priceList = new PriceList({
      documentName: documentName.trim(),
      pdfUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileSize: req.file.size,
      uploadedBy: adminId
    });

    await priceList.save();

    // Populate the uploadedBy field for response
    await priceList.populate('uploadedBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Price list uploaded successfully',
      data: priceList
    });

  } catch (error) {
    console.error('Upload price list error:', error);
    
    // If there was an error after uploading to Cloudinary, try to delete the file
    if (error.uploadResult && error.uploadResult.public_id) {
      try {
        await cloudinary.uploader.destroy(error.uploadResult.public_id, { resource_type: 'raw' });
      } catch (deleteError) {
        console.error('Error deleting file from Cloudinary:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload price list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all price lists
const getAllPriceLists = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (search) {
      filter.documentName = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get price lists with pagination
    const priceLists = await PriceList.find(filter)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await PriceList.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: priceLists,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get price lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price lists',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single price list by ID
const getPriceListById = async (req, res) => {
  try {
    const { id } = req.params;

    const priceList = await PriceList.findById(id)
      .populate('uploadedBy', 'username email');

    if (!priceList) {
      return res.status(404).json({
        success: false,
        message: 'Price list not found'
      });
    }

    res.status(200).json({
      success: true,
      data: priceList
    });

  } catch (error) {
    console.error('Get price list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update price list
const updatePriceList = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentName, isActive } = req.body;

    const priceList = await PriceList.findById(id);
    if (!priceList) {
      return res.status(404).json({
        success: false,
        message: 'Price list not found'
      });
    }

    // Update fields
    if (documentName !== undefined) priceList.documentName = documentName.trim();
    if (isActive !== undefined) priceList.isActive = isActive;

    // If new PDF file is provided, upload it and replace the old one
    if (req.file) {
      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed'
        });
      }

      // Validate file size (1GB = 1073741824 bytes)
      if (req.file.size > 1073741824) {
        return res.status(400).json({
          success: false,
          message: 'File size cannot exceed 1GB'
        });
      }

      // Upload new file to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'price-lists',
            public_id: `price-list-${Date.now()}`,
            format: 'pdf'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      // Delete old file from Cloudinary
      try {
        await cloudinary.uploader.destroy(priceList.publicId, { resource_type: 'raw' });
      } catch (deleteError) {
        console.error('Error deleting old file from Cloudinary:', deleteError);
      }

      // Update file information
      priceList.pdfUrl = uploadResult.secure_url;
      priceList.publicId = uploadResult.public_id;
      priceList.fileSize = req.file.size;
    }

    await priceList.save();
    await priceList.populate('uploadedBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Price list updated successfully',
      data: priceList
    });

  } catch (error) {
    console.error('Update price list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete price list
const deletePriceList = async (req, res) => {
  try {
    const { id } = req.params;

    const priceList = await PriceList.findById(id);
    if (!priceList) {
      return res.status(404).json({
        success: false,
        message: 'Price list not found'
      });
    }

    // Delete file from Cloudinary
    try {
      await cloudinary.uploader.destroy(priceList.publicId, { resource_type: 'raw' });
    } catch (deleteError) {
      console.error('Error deleting file from Cloudinary:', deleteError);
    }

    // Delete from database
    await PriceList.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Price list deleted successfully'
    });

  } catch (error) {
    console.error('Delete price list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete price list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Toggle active status
const togglePriceListStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const priceList = await PriceList.findById(id);
    if (!priceList) {
      return res.status(404).json({
        success: false,
        message: 'Price list not found'
      });
    }

    priceList.isActive = !priceList.isActive;
    await priceList.save();
    await priceList.populate('uploadedBy', 'username email');

    res.status(200).json({
      success: true,
      message: `Price list ${priceList.isActive ? 'activated' : 'deactivated'} successfully`,
      data: priceList
    });

  } catch (error) {
    console.error('Toggle price list status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle price list status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  uploadPriceList,
  getAllPriceLists,
  getPriceListById,
  updatePriceList,
  deletePriceList,
  togglePriceListStatus
};