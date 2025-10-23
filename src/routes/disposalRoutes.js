const express = require('express');
const router = express.Router();
const {
  createDisposal,
  getMyDisposals,
  getDisposal,
  updateDisposal,
  deleteDisposal,
  getDisposalStats
} = require('../controllers/disposalController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(getMyDisposals)
  // allow optional image upload when creating disposal
  .post(upload.single('image'), createDisposal);

router.get('/stats', getDisposalStats);

router.route('/:id')
  .get(getDisposal)
  .put(updateDisposal)
  .delete(deleteDisposal);

module.exports = router;

