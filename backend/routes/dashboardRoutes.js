const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin Analytics Dashboard Route
router.get('/admin', protect, authorize('admin'), dashboardController.getAdminDashboard);

// Personalized Employee Dashboard Route
router.get('/employee', protect, dashboardController.getEmployeeDashboard);

module.exports = router;
