const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All leave endpoints require authentication
router.use(protect);

// Employee operations
router.post('/', leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);
router.get('/my-balance', leaveController.getMyLeaveBalance);
router.put('/:id/cancel', leaveController.cancelLeave);

// Admin & Workforce overview (Restricted to admin)
router.get('/summary', authorize('admin'), leaveController.getLeaveSummary);
router.get('/', authorize('admin'), leaveController.getAdminLeaves);
router.get('/:id', leaveController.getLeaveById);

// Admin only review actions
router.put('/:id/review', authorize('admin'), leaveController.reviewLeave);

module.exports = router;
