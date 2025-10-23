require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Disposal, User } = require('../models');

(async () => {
  try {
    const userId = process.argv[2];
    const genericName = process.argv[3] || 'TestMed';
    const brandName = process.argv[4] || 'TestBrand';

    if (!userId) {
      console.error('Usage: node create_disposal.js <userId> [genericName] [brandName]');
      process.exit(1);
    }

    // confirm user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found: ' + userId);
    }

    const id = uuidv4();

    const disposal = await Disposal.create({
      id,
      userId,
      genericName,
      brandName,
      dosageForm: 'Tablet',
      packagingType: 'Blister Pack',
      predictedCategory: 'Analgesic',
      riskLevel: 'LOW',
      confidence: 0.9,
      status: 'pending_review',
      reason: 'scripted_insert',
      disposalGuidance: 'Follow local guidance.'
    });

    console.log('Created disposal:', disposal.id);
    process.exit(0);
  } catch (err) {
    console.error('Error creating disposal:', err.message || err);
    process.exit(1);
  }
})();
