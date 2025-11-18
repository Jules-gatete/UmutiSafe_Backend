const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendRegistrationEmail } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, location, sector, coverageArea } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Email domain validation
    const emailDomain = email.split('@')[1];
    const isGovEmail = emailDomain === 'umutisafe.gov.rw';

    if (role === 'admin') {
      // Admin MUST use @umutisafe.gov.rw
      if (!isGovEmail) {
        return res.status(400).json({
          success: false,
          message: 'Administrator accounts must use @umutisafe.gov.rw email address'
        });
      }
    } else {
      // Regular users and CHWs CANNOT use @umutisafe.gov.rw
      if (isGovEmail) {
        return res.status(400).json({
          success: false,
          message: 'The @umutisafe.gov.rw domain is reserved for administrators only. Please use a different email address.'
        });
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Determine approval status
    // Admin accounts are auto-approved, regular users need approval
    const isApproved = role === 'admin' ? true : false;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      phone,
      location,
      sector,
      coverageArea,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
      isApproved,
      approvedAt: isApproved ? new Date() : null
    });

    // Send registration email
    await sendRegistrationEmail(user);

    // Don't generate token for unapproved users
    const responseData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    };

    // Only include token if user is approved
    if (isApproved) {
      responseData.token = generateToken(user.id);
    }

    res.status(201).json({
      success: true,
      message: isApproved
        ? 'User registered successfully'
        : 'Registration successful! Your account is pending approval. You will receive an email once approved.',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', user.email, 'isActive:', user.isActive, 'isApproved:', user.isApproved);

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check if user is approved
    if (!user.isApproved) {
      console.log('❌ User is not approved');
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. You will receive an email once your account is approved.'
      });
    }

    // Check password
    console.log('🔑 Checking password...');
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const hadLoggedBefore = Boolean(user.lastLogin);
    const previousLastLogin = user.lastLogin ? user.lastLogin.toISOString() : null;

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);
    console.log('✅ Login successful for:', user.email);

    const userPayload = user.toJSON();
    userPayload.hasLoggedBefore = hadLoggedBefore;
    userPayload.previousLastLogin = previousLastLogin;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userPayload,
        token
      }
    });
  } catch (error) {
    console.log('❌ Login error:', error.message);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, sector, coverageArea, availability } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (sector) user.sector = sector;
    if (coverageArea) user.coverageArea = coverageArea;
    if (availability) user.availability = availability;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findByPk(req.user.id);

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

