const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const config = require('../config/env');

describe('EMS Authentication & Role Authorization Suite', () => {
  let adminToken = '';
  let employeeToken = '';

  // 1. Admin Login
  it('1. Admin login with valid credentials returns 200, JWT token and admin role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: config.adminSeed.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.email).toBe(config.adminSeed.email.toLowerCase());
    expect(res.body.data.user).not.toHaveProperty('password');

    adminToken = res.body.data.token;
  });

  // 2. Employee Login
  it('2. Employee login with valid credentials returns 200, JWT token and employee role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.employeeSeed.email,
        password: config.employeeSeed.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.role).toBe('employee');
    expect(res.body.data.user.email).toBe(config.employeeSeed.email.toLowerCase());

    employeeToken = res.body.data.token;
  });

  // 3. Invalid Login
  it('3. Login with invalid password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: 'CompletelyWrongPassword!999'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  // 4. Logout
  it('4. Logout endpoint acknowledges session termination', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loggedOut).toBe(true);
  });

  // 5. Protected Routes - Access without token
  it('5a. Accessing protected /api/auth/me without token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 5. Protected Routes - Access with valid token
  it('5b. Accessing protected /api/auth/me with valid Bearer token returns 200 and user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(config.adminSeed.email.toLowerCase());
  });

  // 6. Admin-only API accessed by Admin
  it('6. Admin accessing admin-only endpoint (/api/admin/overview) returns 200 OK', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.adminPrivileges).toBe(true);
  });

  // 7. Employee accessing Admin-only API
  it('7. Employee accessing admin-only endpoint (/api/admin/overview) returns 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  // 8. Token Expiration / Malformed Token Handling
  it('8. Accessing protected route with expired or malformed token returns 401 Unauthorized', async () => {
    // Generate an expired token
    const expiredToken = jwt.sign(
      { id: '66e1a0000000000000000001', role: 'admin' },
      config.jwt.secret,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
  });

  // 9. Change Password - Incorrect current password
  it('9. Changing password with incorrect current password returns 400 Bad Request', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'WrongOldPassword123',
        newPassword: 'NewValidPassword@2025'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('incorrect');
  });

  // 10. Change Password - Successful change and login with new password
  it('10. Changing password with valid credentials returns 200 OK', async () => {
    const newPass = 'UpdatedPassword@2025';
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        currentPassword: config.employeeSeed.password,
        newPassword: newPass
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.employeeSeed.email,
        password: newPass
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.data).toHaveProperty('token');
  });
});
