import api from './api';

/**
 * Health & Diagnostics Service
 */
export const healthService = {
  /**
   * Basic health check GET /api/health
   */
  async checkHealth() {
    return await api.get('/health');
  },

  /**
   * Detailed system telemetry GET /api/health/details
   */
  async getDetailedDiagnostics() {
    return await api.get('/health/details');
  }
};
