const { Medicine } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Public
exports.getAllMedicines = async (req, res, next) => {
  try {
    const { search, category, riskLevel, page = 1, limit = 50 } = req.query;

    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { genericName: { [Op.iLike]: `%${search}%` } },
        { brandName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Medicine.findAndCountAll({
      where,
      order: [['genericName', 'ASC']],
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

// @desc    Search medicines (autocomplete)
// @route   GET /api/medicines/search
// @access  Public
exports.searchMedicines = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const medicines = await Medicine.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { genericName: { [Op.iLike]: `%${q}%` } },
          { brandName: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: 10,
      order: [['genericName', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: medicines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Public
exports.getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create medicine (Admin only)
// @route   POST /api/medicines
// @access  Private/Admin
exports.createMedicine = async (req, res, next) => {
  try {
    const {
      genericName,
      brandName,
      dosageForm,
      strength,
      category,
      riskLevel,
      manufacturer,
      fdaApproved,
      disposalInstructions
    } = req.body;

    const medicine = await Medicine.create({
      genericName,
      brandName,
      dosageForm,
      strength,
      category,
      riskLevel,
      manufacturer,
      fdaApproved,
      disposalInstructions
    });

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine (Admin only)
// @route   PUT /api/medicines/:id
// @access  Private/Admin
exports.updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const {
      genericName,
      brandName,
      dosageForm,
      strength,
      category,
      riskLevel,
      manufacturer,
      fdaApproved,
      disposalInstructions,
      isActive
    } = req.body;

    await medicine.update({
      genericName: genericName || medicine.genericName,
      brandName: brandName !== undefined ? brandName : medicine.brandName,
      dosageForm: dosageForm || medicine.dosageForm,
      strength: strength !== undefined ? strength : medicine.strength,
      category: category || medicine.category,
      riskLevel: riskLevel || medicine.riskLevel,
      manufacturer: manufacturer !== undefined ? manufacturer : medicine.manufacturer,
      fdaApproved: fdaApproved !== undefined ? fdaApproved : medicine.fdaApproved,
      disposalInstructions: disposalInstructions !== undefined ? disposalInstructions : medicine.disposalInstructions,
      isActive: isActive !== undefined ? isActive : medicine.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete medicine (Admin only)
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Soft delete
    await medicine.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Predict medicine from text
// @route   POST /api/medicines/predict/text
// @access  Public
exports.predictFromText = async (req, res, next) => {
  try {
    const { generic_name, brand_name, dosage_form } = req.body;

    if (!generic_name) {
      return res.status(400).json({
        success: false,
        message: 'Generic name is required'
      });
    }

    // Find medicine in database
    const medicine = await Medicine.findOne({
      where: {
        genericName: { [Op.iLike]: generic_name },
        isActive: true
      }
    });

    // Default guidance based on risk level
    const guidanceMap = {
      'LOW': 'Mix with coffee grounds or kitty litter, seal in plastic bag, and dispose in regular trash. Remove personal information from labels.',
      'MEDIUM': 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush down toilet. This medicine requires proper disposal to prevent environmental contamination.',
      'HIGH': 'MUST be returned to CHW or authorized collection site immediately. NEVER dispose in household trash. This is a controlled substance with high risk for misuse and environmental harm.'
    };

    const safetyNotes = {
      'LOW': 'Low environmental impact. Standard household disposal acceptable with precautions.',
      'MEDIUM': 'Moderate risk. Professional disposal recommended to prevent water contamination and antibiotic resistance.',
      'HIGH': 'CRITICAL: High risk for misuse, overdose, and severe environmental damage. Mandatory professional disposal.'
    };

    const riskLevel = medicine ? medicine.riskLevel : 'MEDIUM';
    const confidence = medicine ? 0.85 + Math.random() * 0.12 : 0.65 + Math.random() * 0.15;

    res.status(200).json({
      success: true,
      data: {
        predicted_category: medicine ? medicine.category : 'Unknown',
        risk_level: riskLevel,
        confidence: parseFloat(confidence.toFixed(2)),
        disposal_guidance: medicine?.disposalInstructions || guidanceMap[riskLevel],
        safety_notes: safetyNotes[riskLevel],
        requires_chw: riskLevel === 'HIGH',
        medicine_info: {
          generic_name: generic_name,
          brand_name: brand_name || 'N/A',
          dosage_form: dosage_form || 'N/A'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Predict medicine from image (placeholder)
// @route   POST /api/medicines/predict/image
// @access  Public
exports.predictFromImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // In production, this would use OCR and ML model
    // For now, return mock data
    const randomMedicine = await Medicine.findOne({
      where: { isActive: true },
      order: Medicine.sequelize.random()
    });

    const confidence = 0.75 + Math.random() * 0.2;

    const guidanceMap = {
      'LOW': 'Mix with coffee grounds or kitty litter, seal in plastic bag, and dispose in regular trash.',
      'MEDIUM': 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush down toilet.',
      'HIGH': 'MUST be returned to CHW or authorized collection site immediately. NEVER dispose in household trash.'
    };

    res.status(200).json({
      success: true,
      data: {
        ocr_text: {
          medicine_name: randomMedicine?.genericName || 'Unknown',
          brand_name: randomMedicine?.brandName || 'N/A',
          dosage: randomMedicine?.strength || 'N/A',
          expiry_date: '2024-12-31'
        },
        predicted_category: randomMedicine?.category || 'Unknown',
        risk_level: randomMedicine?.riskLevel || 'MEDIUM',
        confidence: parseFloat(confidence.toFixed(2)),
        disposal_guidance: randomMedicine?.disposalInstructions || guidanceMap[randomMedicine?.riskLevel || 'MEDIUM'],
        requires_chw: randomMedicine?.riskLevel === 'HIGH',
        warnings: randomMedicine?.riskLevel === 'HIGH' ? ['Controlled substance', 'Requires supervised disposal'] : [],
        image_url: `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
};

