const express = require('express');
const router = express.Router();
const { registerChild, getMyChildren } = require('../controllers/childrenController');
const { protect, authorize } = require('../middleware/auth');

// Protect all children routes; allow CHW and Admin
router.use(protect);

router.route('/')
  .get(authorize('chw', 'admin'), getMyChildren)
  .post(authorize('chw', 'admin'), registerChild);

module.exports = router;
