import api from './api';

export const expenseService = {
  async getExpenses(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.category && params.category !== 'All') query.append('category', params.category);

    const qs = query.toString();
    const response = await api.get(qs ? `/expenses?${qs}` : '/expenses');
    return {
      expenses: response.data || [],
      metrics: response.metrics || {
        totalClaims: 0,
        totalClaimedAmount: 0,
        totalApprovedAmount: 0,
        pendingReviewCount: 0
      }
    };
  },

  async submitExpense(payload) {
    const response = await api.post('/expenses', payload);
    return response.data;
  },

  async reviewExpense(id, { status, adminRemarks }) {
    const response = await api.put(`/expenses/${id}/review`, { status, adminRemarks });
    return response.data;
  }
};

export default expenseService;
