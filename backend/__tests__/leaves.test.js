const request = require('supertest');
const app = require('../app');
const config = require('../config/env');

describe('EMS Leave Management & Lifecycle Suite', () => {
  let adminToken = '';
  let employeeToken = '';
  let createdLeaveId = '';
  let cancelTestLeaveId = '';

  // 1. Authenticate Admin
  it('1. Authenticates admin user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: config.adminSeed.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;
  });

  // 2. Authenticate Employee
  it('2. Authenticates employee user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.employeeSeed.email,
        password: config.employeeSeed.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    employeeToken = res.body.data.token;
  });

  // 3. Employee Applies for Leave
  it('3. Employee POST /api/leaves submits leave application (201)', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Earned',
        startDate: '2025-06-15',
        endDate: '2025-06-18',
        reason: 'Annual family break and personal rest'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.status).toBe('Pending');
    expect(res.body.data.totalDays).toBe(4);
    expect(res.body.data.leaveType).toBe('Earned');

    createdLeaveId = res.body.data._id || res.body.data.id;
  });

  // 4. Date validation: start date after end date
  it('4. POST /api/leaves with start date after end date returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual',
        startDate: '2025-07-20',
        endDate: '2025-07-15',
        reason: 'Invalid timeline'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Start date cannot be after end date');
  });

  // 5. Conflicting overlapping leave prevention
  it('5. POST /api/leaves with overlapping dates returns 400 Conflict', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Sick',
        startDate: '2025-06-16',
        endDate: '2025-06-17',
        reason: 'Overlapping date attempt'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Conflicting leave request');
  });

  // 6. View personal leave history
  it('6. Employee GET /api/leaves/my-leaves returns personal requests', async () => {
    const res = await request(app)
      .get('/api/leaves/my-leaves')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.pagination).toBeDefined();
  });

  // 7. View personal leave balance
  it('7. Employee GET /api/leaves/my-balance returns quotas and balances', async () => {
    const res = await request(app)
      .get('/api/leaves/my-balance')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balances).toHaveProperty('Earned');
    expect(res.body.data.balances).toHaveProperty('Sick');
    expect(res.body.data.balances).toHaveProperty('Casual');
    expect(res.body.data.balances.Earned.total).toBe(18);
  });

  // 8. Employee can cancel their own pending leave
  it('8. Employee PUT /api/leaves/:id/cancel cancels eligible pending request', async () => {
    // Apply for another temporary leave to test cancellation
    const tempRes = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Casual',
        startDate: '2025-08-01',
        endDate: '2025-08-02',
        reason: 'Temporary booking to test cancellation'
      });

    expect(tempRes.statusCode).toBe(201);
    cancelTestLeaveId = tempRes.body.data._id || tempRes.body.data.id;

    const cancelRes = await request(app)
      .put(`/api/leaves/${cancelTestLeaveId}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('Cancelled');
  });

  // 9. Employee role cannot approve or reject leaves (403)
  it('9. Employee attempting PUT /api/leaves/:id/review returns 403 Forbidden', async () => {
    const res = await request(app)
      .put(`/api/leaves/${createdLeaveId}/review`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        status: 'Approved',
        adminComment: 'Unauthorized attempt'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 10. Admin can view all leaves with filters
  it('10. Admin GET /api/leaves returns all organizational requests with filters', async () => {
    const res = await request(app)
      .get('/api/leaves?status=Pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 11. Admin can view leave summary metrics
  it('11. Admin GET /api/leaves/summary returns workforce leave metrics', async () => {
    const res = await request(app)
      .get('/api/leaves/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('pendingCount');
    expect(res.body.data).toHaveProperty('approvedCount');
    expect(res.body.data).toHaveProperty('rejectedCount');
  });

  // 12. Admin approves leave request with comment
  it('12. Admin PUT /api/leaves/:id/review approves request with comment (200)', async () => {
    const res = await request(app)
      .put(`/api/leaves/${createdLeaveId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Approved',
        adminComment: 'Approved. Enjoy your vacation.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Approved');
    expect(res.body.data.adminComment).toBe('Approved. Enjoy your vacation.');
    expect(res.body.data.reviewedAt).toBeDefined();
  });

  // 13. Admin rejects a different leave request with comment
  it('13. Admin can reject a leave request with comment', async () => {
    // Create new leave
    const newReq = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'Emergency',
        startDate: '2025-09-01',
        endDate: '2025-09-02',
        reason: 'Emergency request for testing rejection'
      });

    const rejectId = newReq.body.data._id || newReq.body.data.id;

    const res = await request(app)
      .put(`/api/leaves/${rejectId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Rejected',
        adminComment: 'Coverage not available on this date'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Rejected');
    expect(res.body.data.adminComment).toBe('Coverage not available on this date');
  });

  // 14. Notifications created during lifecycle
  it('14. GET /api/notifications returns system and workflow notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
