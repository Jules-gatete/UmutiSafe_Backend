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
      imageUrl,
      handlingMethod,
      disposalRemarks,
      categoryCode,
      categoryLabel,
      similarGenericName,
      similarityDistance,
      predictionInputType,
      predictionSource,
      modelVersion,
      analysis,
      disposalMethods,
      dosageForms,
      manufacturers,
      messages,
      metadata,
      medicineName,
      inputGenericName,
      predictedCategoryConfidence,
      predictionDetails,
      errors
    } = req.body;

    const parseMaybeJson = (value, fieldName) => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (err) {
          console.warn(`⚠️  Unable to parse JSON field "${fieldName}". Falling back to raw string.`, err.message);
          return value;
        }
      }
      return value;
    };

    const toNullableNumber = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const clampConfidence = (value) => {
      const num = toNullableNumber(value);
      if (num === null) return null;
      if (num < 0) return 0;
      if (num > 1 && num <= 100) {
        return Math.min(num / 100, 1);
      }
      return num > 1 ? 1 : num;
    };

    const normalizeRisk = (value) => {
      const allowed = ['LOW', 'MEDIUM', 'HIGH'];
      const normalized = typeof value === 'string' ? value.trim().toUpperCase() : value;
      return allowed.includes(normalized) ? normalized : null;
    };

    const normalizeInputType = (value) => {
      const map = ['text', 'image', 'manual'];
      if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (map.includes(lower)) {
          return lower;
        }
      }
      if (req.file) return 'image';
      if (predictedCategory) return 'text';
      return null;
    };

    const disposal = await Disposal.create({
      userId: req.user.id,
      genericName,
      brandName,
      dosageForm,
      packagingType,
  medicineName: medicineName || null,
  inputGenericName: inputGenericName || null,
      predictedCategory,
  predictedCategoryConfidence: clampConfidence(predictedCategoryConfidence),
  riskLevel: normalizeRisk(riskLevel),
  confidence: clampConfidence(confidence || predictedCategoryConfidence),
      disposalGuidance,
      reason,
      imageUrl: imageUrl || null,
      status: 'pending_review',
      handlingMethod: handlingMethod || null,
      disposalRemarks: disposalRemarks || null,
      categoryCode: categoryCode || null,
      categoryLabel: categoryLabel || null,
      similarGenericName: similarGenericName || null,
      similarityDistance: toNullableNumber(similarityDistance),
      predictionInputType: normalizeInputType(predictionInputType),
      predictionSource: predictionSource || null,
      modelVersion: modelVersion || null,
      analysis: analysis || null,
      disposalMethods: parseMaybeJson(disposalMethods, 'disposalMethods'),
      dosageForms: parseMaybeJson(dosageForms, 'dosageForms'),
      manufacturers: parseMaybeJson(manufacturers, 'manufacturers'),
      messages: parseMaybeJson(messages, 'messages'),
      errors: parseMaybeJson(errors, 'errors'),
      predictionDetails: parseMaybeJson(predictionDetails, 'predictionDetails'),
      metadata: parseMaybeJson(metadata, 'metadata')
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
    const { status, notes, pickupRequestId } = req.body;

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
  if (pickupRequestId) disposal.pickupRequestId = pickupRequestId;

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
    // Allow admins to delete any disposal; regular users may only delete their own
    const disposal = await Disposal.findByPk(req.params.id);

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal not found'
      });
    }

    if (req.user.role !== 'admin' && disposal.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this disposal'
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

