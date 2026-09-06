import api from './api';

export const leaveService = {
  /**
   * Submit leave application (Employee)
   * POST /api/leaves
   */
  async applyLeave(payload) {
    const response = await api.post('/leaves', payload);
    return response.data;
  },

  /**
   * View personal leave history (Employee)
   * GET /api/leaves/my-leaves
   */
  async getMyLeaves(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.leaveType && params.leaveType !== 'All') query.append('leaveType', params.leaveType);

    const qs = query.toString();
    const response = await api.get(qs ? `/leaves/my-leaves?${qs}` : '/leaves/my-leaves');
    return {
      leaves: response.data || [],
      pagination: response.meta?.pagination || { total: 0, totalPages: 1, page: 1, limit: 15 }
    };
  },

  /**
   * View personal leave quota balances (Employee)
   * GET /api/leaves/my-balance
   */
  async getMyLeaveBalance() {
    const response = await api.get('/leaves/my-balance');
    return response.data;
  },

  /**
   * Cancel an eligible pending leave request (Employee)
   * PUT /api/leaves/:id/cancel
   */
  async cancelLeave(id) {
    const response = await api.put(`/leaves/${id}/cancel`);
    return response.data;
  },

  /**
   * Admin: Get all organizational leave requests with filters
   * GET /api/leaves
   */
  async getAdminLeaves(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.department && params.department !== 'All') query.append('department', params.department);
    if (params.leaveType && params.leaveType !== 'All') query.append('leaveType', params.leaveType);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const qs = query.toString();
    const response = await api.get(qs ? `/leaves?${qs}` : '/leaves');
    return {
      leaves: response.data || [],
      pagination: response.meta?.pagination || { total: 0, totalPages: 1, page: 1, limit: 15 }
    };
  },

  /**
   * Admin: Get workforce leave summary statistics
   * GET /api/leaves/summary
   */
  async getLeaveSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'All') query.append('department', params.department);

    const qs = query.toString();
    const response = await api.get(qs ? `/leaves/summary?${qs}` : '/leaves/summary');
    return response.data;
  },

  /**
   * Get single leave details
   * GET /api/leaves/:id
   */
  async getLeaveById(id) {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  /**
   * Admin: Review (Approve or Reject) leave request
   * PUT /api/leaves/:id/review
   */
  async reviewLeave(id, { status, adminComment }) {
    const response = await api.put(`/leaves/${id}/review`, { status, adminComment });
    return response.data;
  }
};

export default leaveService;
