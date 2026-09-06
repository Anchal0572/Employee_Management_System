import api from './api';

export const authService = {
  /**
   * Log in with corporate email and password
   * POST /api/auth/login
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // { user, token }
  },

  /**
   * Log out session
   * POST /api/auth/logout
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore failure during local logout
    }
  },

  /**
   * Fetch current authenticated user profile
   * GET /api/auth/me
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Change authenticated user password
   * PUT /api/auth/change-password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response;
  }
};
