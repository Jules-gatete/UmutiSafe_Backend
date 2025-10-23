const User = require('./User');
const Medicine = require('./Medicine');
const Disposal = require('./Disposal');
const MedicineImage = require('./MedicineImage');
const PickupRequest = require('./PickupRequest');
const EducationTip = require('./EducationTip');

// Define associations

// User has many Disposals
User.hasMany(Disposal, {
  foreignKey: 'userId',
  as: 'disposals',
  onDelete: 'CASCADE'
});
Disposal.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User (as requester) has many PickupRequests
User.hasMany(PickupRequest, {
  foreignKey: 'userId',
  as: 'pickupRequests',
  onDelete: 'CASCADE'
});
PickupRequest.belongsTo(User, {
  foreignKey: 'userId',
  as: 'requester'
});

// User (as CHW) has many PickupRequests
User.hasMany(PickupRequest, {
  foreignKey: 'chwId',
  as: 'assignedPickups',
  onDelete: 'SET NULL'
});
PickupRequest.belongsTo(User, {
  foreignKey: 'chwId',
  as: 'chw'
});

// Disposal can have one PickupRequest
Disposal.belongsTo(PickupRequest, {
  foreignKey: 'pickupRequestId',
  as: 'pickupRequest',
  onDelete: 'SET NULL'
});
PickupRequest.hasOne(Disposal, {
  foreignKey: 'pickupRequestId',
  as: 'disposal'
});

// Disposal has many MedicineImages
Disposal.hasMany(MedicineImage, {
  foreignKey: 'disposalId',
  as: 'images',
  onDelete: 'CASCADE'
});
MedicineImage.belongsTo(Disposal, {
  foreignKey: 'disposalId',
  as: 'disposal'
});

module.exports = {
  User,
  Medicine,
  Disposal,
  MedicineImage,
  PickupRequest,
  EducationTip
};

