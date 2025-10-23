const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  searchMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  predictFromText,
  predictFromImage
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAllMedicines);
router.get('/search', searchMedicines);
router.post('/predict/text', predictFromText);
router.post('/predict/image', upload.single('image'), predictFromImage);

router.get('/:id', getMedicine);

// Admin only routes
router.post('/', protect, authorize('admin'), createMedicine);
router.put('/:id', protect, authorize('admin'), updateMedicine);
router.delete('/:id', protect, authorize('admin'), deleteMedicine);

module.exports = router;

