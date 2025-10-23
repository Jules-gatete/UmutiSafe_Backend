const { User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all CHWs
// @route   GET /api/chws
// @access  Public
exports.getAllCHWs = async (req, res, next) => {
  try {
    const { sector, availability, search, page = 1, limit = 20 } = req.query;

    const where = {
      role: 'chw',
      isActive: true
    };

    if (sector) {
      where.sector = sector;
    }

    if (availability) {
      where.availability = availability;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sector: { [Op.iLike]: `%${search}%` } },
        { coverageArea: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ['password']
      },
      order: [['rating', 'DESC'], ['name', 'ASC']],
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

// @desc    Get CHWs nearby (by location/sector)
// @route   GET /api/chws/nearby
// @access  Public
exports.getNearbyChws = async (req, res, next) => {
  try {
    const { sector, limit = 5 } = req.query;

    const where = {
      role: 'chw',
      isActive: true,
      availability: 'available'
    };

    if (sector) {
      where.sector = { [Op.iLike]: `%${sector}%` };
    }

    const chws = await User.findAll({
      where,
      attributes: {
        exclude: ['password']
      },
      order: [['rating', 'DESC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: chws
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single CHW
// @route   GET /api/chws/:id
// @access  Public
exports.getCHW = async (req, res, next) => {
  try {
    const chw = await User.findOne({
      where: {
        id: req.params.id,
        role: 'chw'
      },
      attributes: {
        exclude: ['password']
      }
    });

    if (!chw) {
      return res.status(404).json({
        success: false,
        message: 'CHW not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chw
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update CHW availability
// @route   PUT /api/chws/availability
// @access  Private (CHW only)
exports.updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability status'
      });
    }

    const chw = await User.findByPk(req.user.id);

    if (chw.role !== 'chw') {
      return res.status(403).json({
        success: false,
        message: 'Only CHWs can update availability'
      });
    }

    chw.availability = availability;
    await chw.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: chw
    });
  } catch (error) {
    next(error);
  }
};

