const leaveService = require('../services/leaveService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class LeaveController {
  /**
   * Apply for leave (Employee)
   * POST /api/leaves
   */
  applyLeave = asyncHandler(async (req, res) => {
    const leave = await leaveService.applyLeave(req.user, req.body);
    return ApiResponse.created(
      res,
      'Leave application submitted successfully',
      leave
    );
  });

  /**
   * View personal leave history (Employee)
   * GET /api/leaves/my-leaves
   */
  getMyLeaves = asyncHandler(async (req, res) => {
    const result = await leaveService.getMyLeaves(req.user, req.query);
    return ApiResponse.paginated(
      res,
      'Personal leave records retrieved',
      result.leaves,
      result.pagination
    );
  });

  /**
   * View personal leave quota balance (Employee)
   * GET /api/leaves/my-balance
   */
  getMyLeaveBalance = asyncHandler(async (req, res) => {
    const balance = await leaveService.getMyLeaveBalance(req.user);
    return ApiResponse.success(
      res,
      'Leave balance retrieved successfully',
      balance,
      200
    );
  });

  /**
   * Cancel eligible pending leave (Employee)
   * PUT /api/leaves/:id/cancel
   */
  cancelLeave = asyncHandler(async (req, res) => {
    const updated = await leaveService.cancelLeave(req.user, req.params.id);
    return ApiResponse.success(
      res,
      'Leave request cancelled successfully',
      updated,
      200
    );
  });

  /**
   * Admin / Manager: Get all leave requests with filters
   * GET /api/leaves
   */
  getAdminLeaves = asyncHandler(async (req, res) => {
    const result = await leaveService.getAdminLeaves(req.query);
    return ApiResponse.paginated(
      res,
      'Leave applications retrieved successfully',
      result.leaves,
      result.pagination
    );
  });

  /**
   * Admin / Dashboard: Get workforce leave summary statistics
   * GET /api/leaves/summary
   */
  getLeaveSummary = asyncHandler(async (req, res) => {
    const summary = await leaveService.getLeaveSummary(req.query);
    return ApiResponse.success(
      res,
      'Leave summary retrieved successfully',
      summary,
      200
    );
  });

  /**
   * Get single leave details
   * GET /api/leaves/:id
   */
  getLeaveById = asyncHandler(async (req, res) => {
    const leave = await leaveService.getLeaveById(req.params.id, req.user);
    return ApiResponse.success(
      res,
      'Leave details retrieved successfully',
      leave,
      200
    );
  });

  /**
   * Admin: Review (Approve / Reject) leave request
   * PUT /api/leaves/:id/review
   */
  reviewLeave = asyncHandler(async (req, res) => {
    const reviewed = await leaveService.reviewLeave(req.user, req.params.id, req.body);
    return ApiResponse.success(
      res,
      `Leave request ${req.body.status.toLowerCase()} successfully`,
      reviewed,
      200
    );
  });
}

module.exports = new LeaveController();
