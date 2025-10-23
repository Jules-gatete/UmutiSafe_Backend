const express = require('express');
const router = express.Router();
const {
  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllDisposals,
  getAllPickups,
  getPendingUsers,
  approveUser,
  rejectUser,
  activateUser,
  deactivateUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getSystemStats);

router.route('/users')
  .get(getAllUsers);

router.get('/users/pending', getPendingUsers);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/deactivate', deactivateUser);

router.get('/disposals', getAllDisposals);
router.get('/pickups', getAllPickups);

module.exports = router;

