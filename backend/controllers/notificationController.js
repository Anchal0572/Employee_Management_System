const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class NotificationController {
  /**
   * Get notifications for authenticated user
   * GET /api/notifications
   */
  getUserNotifications = asyncHandler(async (req, res) => {
    const result = await notificationService.getUserNotifications(req.user, req.query);
    return ApiResponse.success(
      res,
      'Notifications retrieved successfully',
      result.notifications,
      200,
      {
        unreadCount: result.unreadCount,
        pagination: result.pagination
      }
    );
  });

  /**
   * Mark single notification as read
   * PUT /api/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const updated = await notificationService.markAsRead(req.params.id);
    return ApiResponse.success(
      res,
      'Notification marked as read',
      updated,
      200
    );
  });

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user);
    return ApiResponse.success(
      res,
      'All notifications marked as read',
      { success: true },
      200
    );
  });
}

module.exports = new NotificationController();
