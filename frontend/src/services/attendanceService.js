import api from './api';

export const attendanceService = {
  /**
   * Check in for today (Employee)
   * POST /api/attendance/check-in
   */
  async checkIn(payload = {}) {
    const response = await api.post('/attendance/check-in', payload);
    return response.data;
  },

  /**
   * Check out for today (Employee)
   * POST /api/attendance/check-out
   */
  async checkOut(payload = {}) {
    const response = await api.post('/attendance/check-out', payload);
    return response.data;
  },

  /**
   * Get today's attendance status & clock state
   * GET /api/attendance/today
   */
  async getTodayStatus() {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  /**
   * Get personal punch history (Employee)
   * GET /api/attendance/my-history
   */
  async getMyHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const qs = query.toString();
    const response = await api.get(qs ? `/attendance/my-history?${qs}` : '/attendance/my-history');
    return {
      records: response.data || [],
      pagination: response.meta?.pagination || { total: 0, totalPages: 1, page: 1, limit: 15 }
    };
  },

  /**
   * Get personal summary metrics (Employee)
   * GET /api/attendance/my-summary
   */
  async getMySummary() {
    const response = await api.get('/attendance/my-summary');
    return response.data;
  },

  /**
   * Admin: Get all attendance logs with filters
   * GET /api/attendance
   */
  async getAdminAttendance(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.department && params.department !== 'All') query.append('department', params.department);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.date) query.append('date', params.date);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const qs = query.toString();
    const response = await api.get(qs ? `/attendance?${qs}` : '/attendance');
    return {
      records: response.data || [],
      pagination: response.meta?.pagination || { total: 0, totalPages: 1, page: 1, limit: 15 }
    };
  },

  /**
   * Admin / Dashboard: Get enterprise workforce attendance metrics
   * GET /api/attendance/summary
   */
  async getAttendanceMetrics(params = {}) {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'All') query.append('department', params.department);
    if (params.date) query.append('date', params.date);

    const qs = query.toString();
    const response = await api.get(qs ? `/attendance/summary?${qs}` : '/attendance/summary');
    return response.data;
  },

  /**
   * Admin: Manual attendance entry
   * POST /api/attendance/manual
   */
  async createManualAttendance(payload) {
    const response = await api.post('/attendance/manual', payload);
    return response.data;
  },

  /**
   * Admin: Update existing attendance record
   * PUT /api/attendance/:id
   */
  async updateAttendance(id, payload) {
    const response = await api.put(`/attendance/${id}`, payload);
    return response.data;
  },

  /**
   * Admin: Delete attendance record
   * DELETE /api/attendance/:id
   */
  async deleteAttendance(id) {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};

export default attendanceService;
