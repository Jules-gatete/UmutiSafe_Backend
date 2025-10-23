const express = require('express');
const router = express.Router();
const {
  createPickupRequest,
  getMyPickupRequests,
  getCHWPickupRequests,
  getPickupRequest,
  updatePickupStatus,
  cancelPickupRequest,
  getCHWStats
} = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMyPickupRequests)
  .post(createPickupRequest);

router.get('/chw', authorize('chw'), getCHWPickupRequests);
router.get('/chw/stats', authorize('chw'), getCHWStats);

router.get('/:id', getPickupRequest);
router.put('/:id/status', authorize('chw'), updatePickupStatus);
router.put('/:id/cancel', cancelPickupRequest);

module.exports = router;

