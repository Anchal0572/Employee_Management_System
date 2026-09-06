const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const ApiResponse = require('../utils/apiResponse');

const router = express.Router();

// Enforce authentication AND admin role authorization across all admin routes
router.use(protect);
router.use(authorize('admin'));

/**
 * GET /api/admin/overview
 * Restricted to administrators only
 */
router.get('/overview', (req, res) => {
  return ApiResponse.success(res, 'Admin overview data retrieved', {
    authorizedRole: req.user.role,
    adminPrivileges: true,
    systemStatus: 'normal'
  });
});

/**
 * GET /api/admin/reports
 * Restricted to administrators only
 */
router.get('/reports', (req, res) => {
  return ApiResponse.success(res, 'Admin workforce report retrieved', {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalEmployees: 148,
      payrollProcessed: true
    }
  });
});

module.exports = router;
