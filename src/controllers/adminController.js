const { User, Disposal, PickupRequest, Medicine } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { sendApprovalEmail } = require('../services/emailService');

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res, next) => {
  try {
    // Total counts
    const totalUsers = await User.count({ where: { role: 'user', isActive: true } });
    const totalChws = await User.count({ where: { role: 'chw', isActive: true } });
    const totalDisposals = await Disposal.count();
    const pendingPickups = await PickupRequest.count({ where: { status: 'pending' } });

    // This month's completed disposals
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completedThisMonth = await Disposal.count({
      where: {
        status: 'completed',
        completedAt: { [Op.gte]: startOfMonth }
      }
    });

    // High risk collected
    const highRiskCollected = await Disposal.count({
      where: {
        riskLevel: 'HIGH',
        status: 'completed'
      }
    });

    // Risk distribution
    const riskDistribution = await Disposal.findAll({
      attributes: [
        'riskLevel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['riskLevel']
    });

    const riskDist = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0
    };

    riskDistribution.forEach(item => {
      riskDist[item.riskLevel] = parseInt(item.get('count'));
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = await sequelize.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM disposals
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Top medicines
    const topMedicines = await Disposal.findAll({
      attributes: [
        'genericName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['genericName'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5
    });

    const topMeds = topMedicines.map(item => ({
      name: item.genericName,
      count: parseInt(item.get('count'))
    }));

    res.status(200).json({
      success: true,
      data: {
        total_users: totalUsers,
        total_chws: totalChws,
        total_disposals: totalDisposals,
        pending_pickups: pendingPickups,
        completed_this_month: completedThisMonth,
        high_risk_collected: highRiskCollected,
        risk_distribution: riskDist,
        monthly_trend: monthlyTrend,
        top_medicines: topMeds
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
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

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, email, role, phone, location, sector, coverageArea, isActive } = req.body;

    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      phone: phone !== undefined ? phone : user.phone,
      location: location !== undefined ? location : user.location,
      sector: sector !== undefined ? sector : user.sector,
      coverageArea: coverageArea !== undefined ? coverageArea : user.coverageArea,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Hard delete - actually remove from database
    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user account (Admin)
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Activate the user account
    await user.update({ isActive: true });

    res.status(200).json({
      success: true,
      message: 'User account activated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user account (Admin)
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Deactivate the user account
    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'User account deactivated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all disposals (Admin)
// @route   GET /api/admin/disposals
// @access  Private/Admin
exports.getAllDisposals = async (req, res, next) => {
  try {
    const { status, riskLevel, page = 1, limit = 20 } = req.query;

    const where = {};

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
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
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

// @desc    Get all pickup requests (Admin)
// @route   GET /api/admin/pickups
// @access  Private/Admin
exports.getAllPickups = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};

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
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'chw',
          attributes: ['id', 'name', 'phone', 'sector']
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

// @desc    Get pending users (Admin)
// @route   GET /api/admin/users/pending
// @access  Private/Admin
exports.getPendingUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        isApproved: false,
        isActive: true
      },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve user account (Admin)
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    // Approve user
    await user.update({
      isApproved: true,
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    // Send approval email
    await sendApprovalEmail(user);

    res.status(200).json({
      success: true,
      message: 'User approved successfully. Approval email sent.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject user account (Admin)
// @route   PUT /api/admin/users/:id/reject
// @access  Private/Admin
exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Deactivate user (soft delete)
    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'User registration rejected'
    });
  } catch (error) {
    next(error);
  }
};

