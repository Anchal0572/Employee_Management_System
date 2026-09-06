import api from './api';

export const notificationService = {
  /**
   * Get notifications for authenticated user
   * GET /api/notifications
   */
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.unreadOnly) query.append('unreadOnly', 'true');
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const response = await api.get(qs ? `/notifications?${qs}` : '/notifications');
    return {
      notifications: response.data || [],
      unreadCount: response.meta?.unreadCount || 0,
      pagination: response.meta?.pagination || { total: 0, totalPages: 1, page: 1, limit: 20 }
    };
  },

  /**
   * Mark single notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};

export default notificationService;
