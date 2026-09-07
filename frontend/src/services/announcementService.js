import api from './api';

export const announcementService = {
  async getFeed(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);

    const qs = query.toString();
    const response = await api.get(qs ? `/announcements?${qs}` : '/announcements');
    return {
      announcements: response.data || [],
      holidays: response.holidays || [],
      celebrations: response.celebrations || []
    };
  },

  async createAnnouncement(payload) {
    const response = await api.post('/announcements', payload);
    return response.data;
  },

  async deleteAnnouncement(id) {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

export default announcementService;
