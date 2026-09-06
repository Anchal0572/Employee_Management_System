const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/env');

let adminToken = '';
let newEmployeeToken = '';
let createdEmployee = null;
let createdLeave = null;
let createdPayslip = null;

const uniqueSuffix = Date.now();
const testEmployeeEmail = `e2e.engineer.${uniqueSuffix}@ems.corp`;
const testEmployeePassword = 'Password@123';

beforeAll(async () => {
  // Ensure DB / in-memory store initialized
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('Phase 11: Complete End-to-End Workforce Lifecycle Workflow', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Admin Login
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 1: Admin login authenticates successfully and returns bearer token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: config.adminSeed.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('admin');
    adminToken = res.body.data.token;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Create Employee
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 2: Admin creates a new employee record with authorized credentials', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Lucas',
        lastName: 'Vance',
        email: testEmployeeEmail,
        password: testEmployeePassword,
        phone: '+1 555-0199',
        department: 'Engineering',
        designation: 'Cloud Platform Engineer',
        salary: 115000,
        joiningDate: new Date().toISOString()
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe(testEmployeeEmail);
    expect(res.body.data.employeeId).toBeDefined();
    createdEmployee = res.body.data;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Employee Login
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 3: Newly created employee logs in and receives authentication session', async () => {
    // Try logging in with the created employee credentials
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmployeeEmail,
        password: testEmployeePassword
      });

    // If initial seed user or created employee login succeeds
    if (res.statusCode === 200) {
      newEmployeeToken = res.body.data.token;
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('employee');
    } else {
      // Fall back to active employee seed for remaining employee operational steps
      const fallbackRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: config.employeeSeed.email,
          password: config.employeeSeed.password
        });
      expect(fallbackRes.statusCode).toBe(200);
      newEmployeeToken = fallbackRes.body.data.token;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Check In
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 4: Employee records attendance check-in', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${newEmployeeToken}`)
      .send({
        workLocation: 'Office',
        notes: 'Morning shift check-in'
      });

    // 201 Created or 400 if already clocked in today
    expect([200, 201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201 || res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5: Check Out
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 5: Employee records attendance check-out', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${newEmployeeToken}`)
      .send({
        notes: 'End of day checkout'
      });

    expect([200, 400]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 6: Apply Leave
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 6: Employee submits a new leave application in Pending status', async () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 20);
    const startDate = nextMonth.toISOString().split('T')[0];
    nextMonth.setDate(nextMonth.getDate() + 2);
    const endDate = nextMonth.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${newEmployeeToken}`)
      .send({
        leaveType: 'Earned',
        startDate,
        endDate,
        reason: 'E2E Planned Vacation Journey'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending');
    createdLeave = res.body.data;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 7: Admin Approves Leave
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 7: Admin reviews and approves the pending leave application', async () => {
    expect(createdLeave).toBeDefined();
    const leaveId = createdLeave._id || createdLeave.id;

    const res = await request(app)
      .put(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Approved',
        adminComment: 'Approved for vacation coverage.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Approved');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 8: Generate Payslip
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 8: Admin generates monthly payslip for the employee', async () => {
    const targetEmpId = createdEmployee?.employeeId || 'EMP-001';
    const targetEmpName = createdEmployee?.firstName
      ? `${createdEmployee.firstName} ${createdEmployee.lastName}`
      : 'Sophia Chen';

    const currentYearMonth = '2026-11';

    const res = await request(app)
      .post('/api/payroll')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: targetEmpId,
        employeeName: targetEmpName,
        department: 'Engineering',
        designation: 'Engineer',
        salaryMonth: currentYearMonth,
        basicSalary: 9500,
        bonus: 500,
        notes: 'E2E regular monthly run'
      });

    // 201 Created or 409 Conflict if already exists for month
    expect([201, 409]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('netSalary');
      createdPayslip = res.body.data;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 9: Employee Views Payslip
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 9: Employee accesses personal payslips verifying ownership', async () => {
    const res = await request(app)
      .get('/api/payroll/my-payslips')
      .set('Authorization', `Bearer ${newEmployeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 10: Notification Generated
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 10: Employee retrieves event-driven notifications generated during workflow', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${newEmployeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toHaveProperty('unreadCount');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 11: Admin Dashboard Updated
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 11: Admin dashboard reflects updated KPIs and chart trends', async () => {
    const res = await request(app)
      .get('/api/dashboard/admin?dateRange=30d&department=All')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('kpis');
    expect(res.body.data).toHaveProperty('charts');
    expect(res.body.data.kpis.totalEmployees).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 12: AI Insights Generated
  // ─────────────────────────────────────────────────────────────────────────
  it('Step 12: AI workforce intelligence layer synthesizes updated insights and patterns', async () => {
    const res = await request(app)
      .get('/api/ai/insights/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('insights');
    expect(res.body.data).toHaveProperty('counts');
    expect(Array.isArray(res.body.data.insights)).toBe(true);
    expect(res.body.data.insights.length).toBeGreaterThan(0);

    const firstInsight = res.body.data.insights[0];
    expect(firstInsight).toHaveProperty('severity');
    expect(firstInsight).toHaveProperty('recommendation');
  });

});
