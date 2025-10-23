// list_disposals_with_images.js
require('dotenv').config();
const { Disposal, MedicineImage } = require('../models');

(async () => {
  try {
    const rows = await Disposal.findAll({
      limit: 50,
      order: [['createdAt', 'DESC']],
      include: [{ model: MedicineImage, as: 'images' }]
    });

    rows.forEach(d => {
      console.log('Disposal:', d.id, d.genericName, 'image_url:', d.imageUrl || '(none)');
      if (d.images && d.images.length) {
        d.images.forEach(img => console.log('  -> image:', img.id, img.url, img.filename));
      }
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();