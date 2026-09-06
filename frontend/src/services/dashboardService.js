import api from './api';

/**
 * Client service for HR Analytics Dashboard API endpoints
 */
export const dashboardService = {
  /**
   * Fetch complete Admin HR analytics and charts
   * @param {object} params - { department, dateRange, startDate, endDate }
   */
  async getAdminDashboard(params = {}) {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'All') {
      query.set('department', params.department);
    }
    if (params.dateRange) {
      query.set('dateRange', params.dateRange);
    }
    if (params.startDate) {
      query.set('startDate', params.startDate);
    }
    if (params.endDate) {
      query.set('endDate', params.endDate);
    }

    const qs = query.toString();
    const res = await api.get(`/dashboard/admin${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Fetch personalized statistics for the currently logged-in employee
   */
  async getEmployeeDashboard() {
    const res = await api.get('/dashboard/employee');
    return res.data;
  }
};
