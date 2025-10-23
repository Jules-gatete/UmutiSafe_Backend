const { EducationTip } = require('../models');

// @desc    Get all education tips
// @route   GET /api/education
// @access  Public
exports.getAllTips = async (req, res, next) => {
  try {
    const { category } = req.query;

    const where = { isActive: true };

    if (category) {
      where.category = category;
    }

    const tips = await EducationTip.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: tips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single education tip
// @route   GET /api/education/:id
// @access  Public
exports.getTip = async (req, res, next) => {
  try {
    const tip = await EducationTip.findByPk(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Education tip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create education tip (Admin only)
// @route   POST /api/education
// @access  Private/Admin
exports.createTip = async (req, res, next) => {
  try {
    const { title, icon, summary, content, category, displayOrder } = req.body;

    const tip = await EducationTip.create({
      title,
      icon,
      summary,
      content,
      category,
      displayOrder
    });

    res.status(201).json({
      success: true,
      message: 'Education tip created successfully',
      data: tip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update education tip (Admin only)
// @route   PUT /api/education/:id
// @access  Private/Admin
exports.updateTip = async (req, res, next) => {
  try {
    const tip = await EducationTip.findByPk(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Education tip not found'
      });
    }

    const { title, icon, summary, content, category, displayOrder, isActive } = req.body;

    await tip.update({
      title: title || tip.title,
      icon: icon !== undefined ? icon : tip.icon,
      summary: summary || tip.summary,
      content: content || tip.content,
      category: category !== undefined ? category : tip.category,
      displayOrder: displayOrder !== undefined ? displayOrder : tip.displayOrder,
      isActive: isActive !== undefined ? isActive : tip.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Education tip updated successfully',
      data: tip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete education tip (Admin only)
// @route   DELETE /api/education/:id
// @access  Private/Admin
exports.deleteTip = async (req, res, next) => {
  try {
    const tip = await EducationTip.findByPk(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Education tip not found'
      });
    }

    // Soft delete
    await tip.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Education tip deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

