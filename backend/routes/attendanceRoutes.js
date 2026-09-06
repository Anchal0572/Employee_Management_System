const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All attendance routes require valid JWT authentication
router.use(protect);

// Employee check-in & check-out actions
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/my-history', attendanceController.getMyHistory);
router.get('/my-summary', attendanceController.getMySummary);

// Workforce summary & metrics (Admin & dashboard access)
router.get('/summary', attendanceController.getAttendanceMetrics);

// General attendance register (Admin only)
router.get('/', authorize('admin'), attendanceController.getAdminAttendance);

// Admin-only manual operations & record management
router.post('/manual', authorize('admin'), attendanceController.createManualAttendance);
router.put('/:id', authorize('admin'), attendanceController.updateAttendance);
router.delete('/:id', authorize('admin'), attendanceController.deleteAttendance);

module.exports = router;
