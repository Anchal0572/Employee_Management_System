import api from './api';

/**
 * AI HR Intelligence Service Client
 */
export const aiService = {
  /**
   * Fetch aggregated AI insights and executive summary for the Admin Dashboard
   */
  async getDashboardInsights() {
    const res = await api.get('/ai/insights/dashboard');
    return res.data?.data || res.data;
  },

  /**
   * Fetch detailed attendance insights
   */
  async getAttendanceInsights() {
    const res = await api.get('/ai/insights/attendance');
    return res.data?.data || res.data;
  },

  /**
   * Fetch detailed leave insights
   */
  async getLeaveInsights() {
    const res = await api.get('/ai/insights/leaves');
    return res.data?.data || res.data;
  },

  /**
   * Send question to AI HR Policy Assistant
   * @param {string} message - User query
   * @param {Array<{ role: string, content: string }>} history - Conversation history
   */
  async chatWithAssistant(message, history = []) {
    const res = await api.post('/ai/assistant/chat', { message, history });
    return res.data?.data || res.data;
  },

  /**
   * Get list of indexed company knowledge documents
   */
  async getKnowledgeDocuments() {
    const res = await api.get('/ai/knowledge/documents');
    return res.data?.data || res.data;
  },

  /**
   * Trigger knowledge base re-indexing (admin only)
   */
  async reindexKnowledge() {
    const res = await api.post('/ai/knowledge/reindex');
    return res.data?.data || res.data;
  }
};

export default aiService;
