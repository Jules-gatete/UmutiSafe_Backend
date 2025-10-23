const express = require('express');
const router = express.Router();
const {
  getAllTips,
  getTip,
  createTip,
  updateTip,
  deleteTip
} = require('../controllers/educationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getAllTips);
router.get('/:id', getTip);

// Admin only routes
router.post('/', protect, authorize('admin'), createTip);
router.put('/:id', protect, authorize('admin'), updateTip);
router.delete('/:id', protect, authorize('admin'), deleteTip);

module.exports = router;

