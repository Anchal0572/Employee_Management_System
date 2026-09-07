import api from './api';

export const documentService = {
  async getDocuments(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    const response = await api.get(qs ? `/documents?${qs}` : '/documents');
    return response.data || [];
  },

  async uploadDocument(payload) {
    const response = await api.post('/documents', payload);
    return response.data;
  },

  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  }
};

export default documentService;
