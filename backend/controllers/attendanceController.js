const attendanceService = require('../services/attendanceService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AttendanceController {
  /**
   * Check in for authenticated employee
   * POST /api/attendance/check-in
   */
  checkIn = asyncHandler(async (req, res) => {
    const record = await attendanceService.checkIn(req.user, req.body);
    return ApiResponse.created(
      res,
      'Check-in recorded successfully',
      record
    );
  });

  /**
   * Check out for authenticated employee
   * POST /api/attendance/check-out
   */
  checkOut = asyncHandler(async (req, res) => {
    const record = await attendanceService.checkOut(req.user, req.body);
    return ApiResponse.success(
      res,
      'Check-out recorded successfully',
      record,
      200
    );
  });

  /**
   * Get today's attendance state for authenticated employee
   * GET /api/attendance/today
   */
  getTodayStatus = asyncHandler(async (req, res) => {
    const status = await attendanceService.getTodayStatus(req.user);
    return ApiResponse.success(
      res,
      'Today attendance status retrieved',
      status,
      200
    );
  });

  /**
   * Get authenticated employee's punch history
   * GET /api/attendance/my-history
   */
  getMyHistory = asyncHandler(async (req, res) => {
    const result = await attendanceService.getMyHistory(req.user, req.query);
    return ApiResponse.paginated(
      res,
      'Attendance history retrieved',
      result.records,
      result.pagination
    );
  });

  /**
   * Get authenticated employee's attendance statistics summary
   * GET /api/attendance/my-summary
   */
  getMySummary = asyncHandler(async (req, res) => {
    const summary = await attendanceService.getMySummary(req.user);
    return ApiResponse.success(
      res,
      'Attendance summary retrieved',
      summary,
      200
    );
  });

  /**
   * Admin / Manager: Get all attendance logs with multi-field filtering
   * GET /api/attendance
   */
  getAdminAttendance = asyncHandler(async (req, res) => {
    const result = await attendanceService.getAdminAttendance(req.query);
    return ApiResponse.paginated(
      res,
      'Attendance records retrieved successfully',
      result.records,
      result.pagination
    );
  });

  /**
   * Admin / Dashboard: Get enterprise attendance metrics
   * GET /api/attendance/summary
   */
  getAttendanceMetrics = asyncHandler(async (req, res) => {
    const metrics = await attendanceService.getAttendanceMetrics(req.query);
    return ApiResponse.success(
      res,
      'Attendance metrics retrieved successfully',
      metrics,
      200
    );
  });

  /**
   * Admin: Manual attendance entry
   * POST /api/attendance/manual
   */
  createManualAttendance = asyncHandler(async (req, res) => {
    const record = await attendanceService.createManualAttendance(req.body);
    return ApiResponse.created(
      res,
      'Manual attendance entry created successfully',
      record
    );
  });

  /**
   * Admin: Update attendance record
   * PUT /api/attendance/:id
   */
  updateAttendance = asyncHandler(async (req, res) => {
    const updated = await attendanceService.updateAttendance(req.params.id, req.body);
    return ApiResponse.success(
      res,
      'Attendance record updated successfully',
      updated,
      200
    );
  });

  /**
   * Admin: Delete attendance record
   * DELETE /api/attendance/:id
   */
  deleteAttendance = asyncHandler(async (req, res) => {
    const result = await attendanceService.deleteAttendance(req.params.id);
    return ApiResponse.success(
      res,
      'Attendance record deleted successfully',
      result,
      200
    );
  });
}

module.exports = new AttendanceController();
