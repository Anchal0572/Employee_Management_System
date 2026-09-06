const request = require('supertest');
const app = require('../backend/app');

describe('EMS Health API Endpoints', () => {
  it('GET /api/health - should return success: true and message: "EMS API is running"', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'EMS API is running'
    });
  });

  it('GET /api/health/details - should return detailed telemetry and database status', async () => {
    const response = await request(app).get('/api/health/details');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('EMS API is healthy');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('database');
    expect(response.body.data).toHaveProperty('system');
  });

  it('GET /api/nonexistent-route - should return 404 via global error handler', async () => {
    const response = await request(app).get('/api/nonexistent-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });
});
