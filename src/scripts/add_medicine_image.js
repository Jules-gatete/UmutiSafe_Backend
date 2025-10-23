// backend/src/scripts/add_medicine_image.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { MedicineImage, Disposal } = require('../models'); // models/index.js exports them
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    const disposalId = process.argv[2]; // pass disposal id as first arg
    const filePath = process.argv[3];   // pass path to uploaded file as second arg

    if (!disposalId || !filePath) {
      console.error('Usage: node add_medicine_image.js <disposalId> <path/to/file>');
      process.exit(1);
    }

    // Ensure disposal exists
    const disp = await Disposal.findByPk(disposalId);
    if (!disp) {
      throw new Error('Disposal not found: ' + disposalId);
    }

    const filename = path.basename(filePath);
    const url = `/uploads/${filename}`;
    const stat = fs.statSync(filePath);

    const img = await MedicineImage.create({
      id: uuidv4(),
      disposalId: disposalId,
      filename,
      url,
      mimetype: 'image/jpeg', // set appropriately
      size: stat.size
    });

    console.log('Inserted MedicineImage:', img.id);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();