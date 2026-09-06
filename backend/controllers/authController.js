const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  /**
   * User login
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return ApiResponse.success(
      res,
      'Authentication successful',
      result,
      200
    );
  });

  /**
   * User logout
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    // Acknowledge stateless JWT clearance
    return ApiResponse.success(
      res,
      'Logged out successfully',
      { loggedOut: true },
      200
    );
  });

  /**
   * Get current authenticated user details
   * GET /api/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    const userProfile = await authService.getUserProfile(req.user._id || req.user.id);

    return ApiResponse.success(
      res,
      'User profile retrieved',
      userProfile,
      200
    );
  });

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changeUserPassword(
      req.user._id || req.user.id,
      { currentPassword, newPassword }
    );

    return ApiResponse.success(
      res,
      result.message,
      null,
      200
    );
  });
}

module.exports = new AuthController();
