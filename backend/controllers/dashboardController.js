const dashboardService = require('../services/dashboardService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class DashboardController {
  /**
   * Get Admin Analytics and Overview Metrics
   * GET /api/dashboard/admin
   * Query params: department, dateRange, startDate, endDate
   * Accessible by: Admin only
   */
  getAdminDashboard = asyncHandler(async (req, res) => {
    const filters = {
      department: req.query.department,
      dateRange: req.query.dateRange,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const metrics = await dashboardService.getAdminDashboard(filters);

    return ApiResponse.success(
      res,
      'Admin dashboard analytics retrieved successfully',
      metrics
    );
  });

  /**
   * Get Personalized Employee Dashboard Metrics
   * GET /api/dashboard/employee
   * Accessible by: Authenticated users (Employee / Admin)
   */
  getEmployeeDashboard = asyncHandler(async (req, res) => {
    const user = req.user;
    const metrics = await dashboardService.getEmployeeDashboard(user);

    return ApiResponse.success(
      res,
      'Employee dashboard metrics retrieved successfully',
      metrics
    );
  });
}

module.exports = new DashboardController();
