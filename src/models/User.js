const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'chw', 'admin'),
    allowNull: false,
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[+]?[\d\s-()]+$/
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For CHWs - their assigned sector'
  },
  availability: {
    type: DataTypes.ENUM('available', 'busy', 'offline'),
    allowNull: true,
    defaultValue: 'available',
    comment: 'For CHWs - current availability status'
  },
  completedPickups: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'For CHWs - total completed pickups'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    },
    comment: 'For CHWs - average rating'
  },
  coverageArea: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For CHWs - geographical coverage area'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the user account has been approved by admin'
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Admin user ID who approved this account'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the account was approved'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['sector'] }
  ]
});

// Hash password before creating user
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Hash password before updating user
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance method to check password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;

