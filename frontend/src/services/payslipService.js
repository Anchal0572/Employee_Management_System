import api from './api';

/**
 * Client-side payroll service — all API calls to /api/payroll
 * No salary calculations happen here; all values come from the backend.
 */
export const payslipService = {
  // ─── Admin ───────────────────────────────────────────────────────────────

  /**
   * Get all payslips (admin) with optional filters
   * @param {object} params - { salaryMonth, employeeId, paymentStatus, page, limit }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.salaryMonth) query.set('salaryMonth', params.salaryMonth);
    if (params.employeeId) query.set('employeeId', params.employeeId);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString();
    const res = await api.get(`/payroll${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  /**
   * Generate a new payslip
   */
  async generate(payload) {
    const res = await api.post('/payroll', payload);
    return res.data;
  },

  /**
   * Get payroll summary metrics
   * @param {string} salaryMonth - optional filter e.g. "2025-05"
   */
  async getSummary(salaryMonth) {
    const qs = salaryMonth ? `?salaryMonth=${salaryMonth}` : '';
    const res = await api.get(`/payroll/summary${qs}`);
    return res.data;
  },

  /**
   * Preview salary calculation without saving
   */
  async previewCalculation({ basicSalary, bonus = 0 }) {
    const res = await api.get(`/payroll/preview?basicSalary=${basicSalary}&bonus=${bonus}`);
    return res.data;
  },

  /**
   * Update payment status of a payslip
   */
  async updateStatus(id, { paymentStatus, paymentDate, notes }) {
    const res = await api.put(`/payroll/${id}/status`, { paymentStatus, paymentDate, notes });
    return res.data;
  },

  /**
   * Delete a payslip (Draft only)
   */
  async delete(id) {
    const res = await api.delete(`/payroll/${id}`);
    return res.data;
  },

  // ─── Employee ────────────────────────────────────────────────────────────

  /**
   * Get own payslips (employee view)
   * @param {object} params - { salaryMonth, page, limit }
   */
  async getMyPayslips(params = {}) {
    const query = new URLSearchParams();
    if (params.salaryMonth) query.set('salaryMonth', params.salaryMonth);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString();
    const res = await api.get(`/payroll/my-payslips${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  // ─── Shared ──────────────────────────────────────────────────────────────

  /**
   * Get a single payslip by ID
   * (backend enforces ownership for employees)
   */
  async getById(id) {
    const res = await api.get(`/payroll/${id}`);
    return res.data;
  }
};
