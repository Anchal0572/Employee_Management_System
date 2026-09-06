const request = require('supertest');
const app = require('../app');
const config = require('../config/env');

describe('EMS Attendance Management & Punctuality Suite', () => {
  let adminToken = '';
  let employeeToken = '';
  let createdManualId = '';

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
  it('2. Authenticates non-admin employee user', async () => {
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

  // 3. Employee Check-In
  it('3. Employee POST /api/attendance/check-in records today check-in (201)', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        location: 'Office HQ - Floor 4',
        remarks: 'Automated test check-in'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('checkIn');
    expect(res.body.data.status).toBeDefined();
  });

  // 4. Duplicate Check-In Prevention
  it('4. Duplicate check-in on the same day is rejected with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        location: 'Office HQ - Floor 4'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already checked in');
  });

  // 5. Impossible timestamp check (future)
  it('5. Check-in with impossible future timestamp is rejected with 400', async () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        checkIn: futureTime
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('future');
  });

  // 6. Employee Check-Out
  it('6. Employee POST /api/attendance/check-out records check-out and calculates workingHours (200)', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        remarks: 'Completed day shift successfully'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('checkOut');
    expect(res.body.data.workingHours).toBeDefined();
  });

  // 7. Invalid Check-Out after already checking out
  it('7. Second check-out attempt returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already completed check-out');
  });

  // 8. Employee Today Status
  it('8. GET /api/attendance/today returns today punch state', async () => {
    const res = await request(app)
      .get('/api/attendance/today')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('isClockedIn');
    expect(res.body.data).toHaveProperty('status');
  });

  // 9. Employee Attendance History
  it('9. GET /api/attendance/my-history returns employee punch logs', async () => {
    const res = await request(app)
      .get('/api/attendance/my-history?page=1&limit=5')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.pagination).toBeDefined();
  });

  // 10. Employee Attendance Summary
  it('10. GET /api/attendance/my-summary returns personal attendance percentages', async () => {
    const res = await request(app)
      .get('/api/attendance/my-summary')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('attendancePercentage');
    expect(res.body.data).toHaveProperty('avgWorkingHours');
  });

  // 11. Admin All Attendance with Filters
  it('11. Admin GET /api/attendance filters by department and status', async () => {
    const res = await request(app)
      .get('/api/attendance?department=Engineering&status=Present')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 12. Admin Attendance Metrics & Summary
  it('12. GET /api/attendance/summary returns calculated enterprise KPI statistics', async () => {
    const res = await request(app)
      .get('/api/attendance/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('attendancePercentage');
    expect(res.body.data).toHaveProperty('presentCount');
    expect(res.body.data).toHaveProperty('absentCount');
    expect(res.body.data).toHaveProperty('lateCount');
    expect(res.body.data).toHaveProperty('averageWorkingHours');
  });

  // 13. Non-admin blocked from manual entry (403)
  it('13. Non-admin POST /api/attendance/manual returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/attendance/manual')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId: 'EMP-003',
        date: '2025-05-18',
        status: 'Present'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 14. Admin can create manual attendance entry (201)
  it('14. Admin POST /api/attendance/manual successfully creates record', async () => {
    const res = await request(app)
      .post('/api/attendance/manual')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: 'EMP-003',
        employeeName: 'Marcus Vance',
        department: 'Product',
        date: '2025-05-18',
        checkIn: '2025-05-18T09:00:00.000Z',
        checkOut: '2025-05-18T17:30:00.000Z',
        status: 'Present',
        remarks: 'Manual correction for client demo'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id || res.body.data.id).toBeDefined();

    createdManualId = res.body.data._id || res.body.data.id;
  });

  // 15. Admin can update and delete manual attendance entry (200)
  it('15. Admin PUT and DELETE /api/attendance/:id updates and removes record', async () => {
    // Update
    const updateRes = await request(app)
      .put(`/api/attendance/${createdManualId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        remarks: 'Verified by HR Manager'
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.remarks).toBe('Verified by HR Manager');

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/attendance/${createdManualId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
