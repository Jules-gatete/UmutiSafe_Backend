const { Disposal, User, PickupRequest, MedicineImage } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// @desc    Create new disposal
// @route   POST /api/disposals
// @access  Private
exports.createDisposal = async (req, res, next) => {
  try {
    const {
      genericName,
      brandName,
      dosageForm,
      packagingType,
      predictedCategory,
      riskLevel,
      confidence,
      disposalGuidance,
      reason,
      imageUrl
    } = req.body;

    const disposal = await Disposal.create({
      userId: req.user.id,
      genericName,
      brandName,
      dosageForm,
      packagingType,
      predictedCategory,
      riskLevel,
      confidence,
      disposalGuidance,
      reason,
      imageUrl: imageUrl || null,
      status: 'pending_review'
    });

    // If an image file was uploaded via multer (req.file), create a MedicineImage record
    if (req.file) {
      try {
        const urlPath = `/uploads/${req.file.filename}`;
        const img = await MedicineImage.create({
          disposalId: disposal.id,
          filename: req.file.filename,
          url: urlPath,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        // Attach images in the returned object
        disposal.dataValues.images = [img];
      } catch (err) {
        console.error('Error saving medicine image record:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Disposal created successfully',
      data: disposal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all disposals for current user
// @route   GET /api/disposals
// @access  Private
exports.getMyDisposals = async (req, res, next) => {
  try {
    const { status, riskLevel, page = 1, limit = 10 } = req.query;

    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Disposal.findAndCountAll({
      where,
      include: [
        {
          model: PickupRequest,
          as: 'pickupRequest',
          include: [
            {
              model: User,
              as: 'chw',
              attributes: ['id', 'name', 'phone', 'sector']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single disposal
// @route   GET /api/disposals/:id
// @access  Private
exports.getDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: PickupRequest,
          as: 'pickupRequest',
          include: [
            {
              model: User,
              as: 'chw',
              attributes: ['id', 'name', 'phone', 'sector', 'rating']
            }
          ]
        }
      ]
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: disposal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update disposal status
// @route   PUT /api/disposals/:id
// @access  Private
exports.updateDisposal = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const disposal = await Disposal.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal not found'
      });
    }

    if (status) disposal.status = status;
    if (notes) disposal.notes = notes;

    if (status === 'completed') {
      disposal.completedAt = new Date();
    }

    await disposal.save();

    res.status(200).json({
      success: true,
      message: 'Disposal updated successfully',
      data: disposal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete disposal
// @route   DELETE /api/disposals/:id
// @access  Private
exports.deleteDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal not found'
      });
    }

    // Attempt to delete associated uploaded image file (if any)
    if (disposal.imageUrl) {
      try {
        // imageUrl can be a path like '/uploads/filename.ext' or a full URL
        let filename = disposal.imageUrl;

        // If it's a URL, extract pathname
        try {
          const maybeUrl = new URL(filename, 'http://example.com');
          filename = maybeUrl.pathname;
        } catch (err) {
          // not a full URL, ignore
        }

        filename = path.basename(filename);
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Deleted uploaded image file: ${filePath}`);
        }
      } catch (err) {
        console.error('Error deleting image file for disposal:', err.message);
        // don't fail the whole request if file deletion fails
      }
    }

    await disposal.destroy();

    res.status(200).json({
      success: true,
      message: 'Disposal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get disposal statistics for user
// @route   GET /api/disposals/stats
// @access  Private
exports.getDisposalStats = async (req, res, next) => {
  try {
    const totalDisposals = await Disposal.count({
      where: { userId: req.user.id }
    });

    const pendingReview = await Disposal.count({
      where: { userId: req.user.id, status: 'pending_review' }
    });

    const completed = await Disposal.count({
      where: { userId: req.user.id, status: 'completed' }
    });

    const byRiskLevel = await Disposal.findAll({
      where: { userId: req.user.id },
      attributes: [
        'riskLevel',
        [Disposal.sequelize.fn('COUNT', Disposal.sequelize.col('id')), 'count']
      ],
      group: ['riskLevel']
    });

    res.status(200).json({
      success: true,
      data: {
        totalDisposals,
        pendingReview,
        completed,
        byRiskLevel: byRiskLevel.reduce((acc, item) => {
          acc[item.riskLevel] = parseInt(item.get('count'));
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

