const express = require('express');
const router = express.Router();
const {
  getAllCHWs,
  getNearbyChws,
  getCHW,
  updateAvailability
} = require('../controllers/chwController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getAllCHWs);
router.get('/nearby', getNearbyChws);
router.get('/:id', getCHW);

router.put('/availability', protect, authorize('chw'), updateAvailability);

module.exports = router;

