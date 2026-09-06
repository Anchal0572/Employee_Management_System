const request = require('supertest');
const app = require('../app');

describe('EMS Server Health Endpoints', () => {
  it('GET /api/health returns exact specification { success: true, message: "EMS API is running" }', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'EMS API is running'
    });
  });

  it('GET /api/health/details returns detailed diagnostics', async () => {
    const res = await request(app).get('/api/health/details');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('ems-api');
    expect(res.body.data.database).toBeDefined();
  });

  it('handles 404 with structured JSON response', async () => {
    const res = await request(app).get('/api/unknown-path');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
