import api from './api';

export const performanceService = {
  async getGoals(params = {}) {
    const query = new URLSearchParams();
    if (params.quarter && params.quarter !== 'All') query.append('quarter', params.quarter);
    if (params.status && params.status !== 'All') query.append('status', params.status);

    const qs = query.toString();
    const response = await api.get(qs ? `/performance/goals?${qs}` : '/performance/goals');
    return {
      goals: response.data || [],
      scorecard: response.scorecard || null
    };
  },

  async createGoal(payload) {
    const response = await api.post('/performance/goals', payload);
    return response.data;
  },

  async updateGoal(id, payload) {
    const response = await api.put(`/performance/goals/${id}`, payload);
    return response.data;
  }
};

export default performanceService;
