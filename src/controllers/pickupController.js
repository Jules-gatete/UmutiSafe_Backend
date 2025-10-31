const { PickupRequest, User, Disposal } = require('../models');
const { Op } = require('sequelize');

// @desc    Create pickup request
// @route   POST /api/pickups
// @access  Private
exports.createPickupRequest = async (req, res, next) => {
  try {
    const {
      chwId,
      medicineName,
      disposalGuidance,
      reason,
      pickupLocation,
      latitude,
      longitude,
      preferredTime,
      consentGiven,
      notes,
      disposalId
    } = req.body;

    // Validate CHW exists and has CHW role
    const chw = await User.findOne({
      where: { id: chwId, role: 'chw', isActive: true }
    });

    if (!chw) {
      return res.status(404).json({
        success: false,
        message: 'CHW not found or not available'
      });
    }

    if (!consentGiven) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required to create pickup request'
      });
    }

    // Use a transaction so that pickup creation and optional disposal update are atomic
    const t = await PickupRequest.sequelize.transaction();
    let pickupRequest;
    try {
      pickupRequest = await PickupRequest.create({
        userId: req.user.id,
        chwId,
        medicineName,
        disposalGuidance,
        reason,
        pickupLocation,
        latitude,
        longitude,
        preferredTime,
        consentGiven,
        notes,
        status: 'pending'
      }, { transaction: t });

      // If the client supplied a disposalId, attempt to link it atomically
      if (disposalId) {
        const disposal = await Disposal.findOne({
          where: { id: disposalId, userId: req.user.id },
          transaction: t
        });

        if (disposal) {
          disposal.pickupRequestId = pickupRequest.id;
          disposal.status = 'pickup_requested';
          await disposal.save({ transaction: t });
        } else {
          // disposal not found or not owned by requester; do not fail creation, just log
          console.warn(`Pickup created for user ${req.user.id} but disposal ${disposalId} not found/owned`);
        }
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // Include user and CHW details in response
    const fullRequest = await PickupRequest.findByPk(pickupRequest.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'phone', 'location']
        },
        {
          model: User,
          as: 'chw',
          attributes: ['id', 'name', 'phone', 'sector', 'rating']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Pickup request created successfully',
      data: fullRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pickup requests for current user
// @route   GET /api/pickups
// @access  Private
exports.getMyPickupRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await PickupRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'chw',
          attributes: ['id', 'name', 'phone', 'sector', 'rating', 'availability']
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

// @desc    Get pickup requests assigned to CHW
// @route   GET /api/pickups/chw
// @access  Private (CHW only)
exports.getCHWPickupRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = { chwId: req.user.id };

    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await PickupRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'phone', 'location']
        },
        {
          model: require('../models').Disposal,
          as: 'disposal',
          attributes: ['id', 'genericName', 'brandName', 'dosageForm', 'status', 'pickupRequestId', 'userId']
        }
      ],
      order: [['preferredTime', 'ASC']],
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

// @desc    Get single pickup request
// @route   GET /api/pickups/:id
// @access  Private
exports.getPickupRequest = async (req, res, next) => {
  try {
    const pickupRequest = await PickupRequest.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { userId: req.user.id },
          { chwId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'phone', 'location']
        },
        {
          model: User,
          as: 'chw',
          attributes: ['id', 'name', 'phone', 'sector', 'rating']
        }
      ]
    });

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pickupRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pickup request status (CHW)
// @route   PUT /api/pickups/:id/status
// @access  Private (CHW only)
exports.updatePickupStatus = async (req, res, next) => {
  try {
    const { status, chwNotes, scheduledTime } = req.body;

    const pickupRequest = await PickupRequest.findOne({
      where: {
        id: req.params.id,
        chwId: req.user.id
      }
    });

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    if (status) pickupRequest.status = status;
    if (chwNotes) pickupRequest.chwNotes = chwNotes;
    if (scheduledTime) pickupRequest.scheduledTime = scheduledTime;

    if (status === 'completed') {
      pickupRequest.completedAt = new Date();
      
      // Update CHW's completed pickups count
      await User.increment('completedPickups', {
        where: { id: req.user.id }
      });
    }

    await pickupRequest.save();

    res.status(200).json({
      success: true,
      message: 'Pickup request updated successfully',
      data: pickupRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel pickup request
// @route   PUT /api/pickups/:id/cancel
// @access  Private
exports.cancelPickupRequest = async (req, res, next) => {
  try {
    const pickupRequest = await PickupRequest.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    if (['completed', 'cancelled'].includes(pickupRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled request'
      });
    }

    pickupRequest.status = 'cancelled';
    await pickupRequest.save();

    res.status(200).json({
      success: true,
      message: 'Pickup request cancelled successfully',
      data: pickupRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CHW statistics
// @route   GET /api/pickups/chw/stats
// @access  Private (CHW only)
exports.getCHWStats = async (req, res, next) => {
  try {
    const pending = await PickupRequest.count({
      where: { chwId: req.user.id, status: 'pending' }
    });

    const scheduled = await PickupRequest.count({
      where: { chwId: req.user.id, status: 'scheduled' }
    });

    const completed = await PickupRequest.count({
      where: { chwId: req.user.id, status: 'completed' }
    });

    res.status(200).json({
      success: true,
      data: {
        pending,
        scheduled,
        completed,
        total: pending + scheduled + completed
      }
    });
  } catch (error) {
    next(error);
  }
};

