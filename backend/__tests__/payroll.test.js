const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/env');
const { getDbStatus } = require('../config/db');

let adminToken = '';
let employeeToken = '';
let employeeId = 'EMP-001'; // Default seed employee ID

beforeAll(async () => {
  // 1. Authenticate Admin
  const adminLoginRes = await request(app).post('/api/auth/login').send({
    email: config.adminSeed.email,
    password: config.adminSeed.password
  });
  adminToken = adminLoginRes.body.data.token;

  // 2. Authenticate Employee
  const empLoginRes = await request(app).post('/api/auth/login').send({
    email: config.employeeSeed.email,
    password: config.employeeSeed.password
  });
  employeeToken = empLoginRes.body.data.token;
  
  // Get employee profile to get their ID
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${employeeToken}`);
  if (meRes.body.data && meRes.body.data.employeeId) {
    employeeId = meRes.body.data.employeeId;
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('Payroll API Tests', () => {

  let generatedPayslipId;

  it('should preview salary calculation correctly', async () => {
    const res = await request(app)
      .get('/api/payroll/preview?basicSalary=10000&bonus=500')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    
    // Check calculations based on service logic
    expect(data.grossSalary).toBe(10000 + 500 + data.totalAllowances);
    expect(data.netSalary).toBe(data.grossSalary - data.totalDeductions - data.tax);
  });

  it('admin should generate a payslip', async () => {
    const res = await request(app)
      .post('/api/payroll')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId,
        salaryMonth: '2026-10',
        basicSalary: 10000,
        bonus: 1000,
        notes: 'Test generated payslip'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId).toBe(employeeId);
    expect(res.body.data.paymentStatus).toBe('Draft');
    generatedPayslipId = res.body.data._id || res.body.data.id;
  });

  it('admin cannot generate duplicate payslip for same month', async () => {
    const res = await request(app)
      .post('/api/payroll')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId,
        salaryMonth: '2026-10',
        basicSalary: 10000
      });

    expect(res.statusCode).toBe(409); // Conflict
  });

  it('employee cannot generate a payslip (forbidden)', async () => {
    const res = await request(app)
      .post('/api/payroll')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId,
        salaryMonth: '2026-11',
        basicSalary: 10000
      });

    expect(res.statusCode).toBe(403);
  });

  it('admin can view all payslips', async () => {
    const res = await request(app)
      .get('/api/payroll')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('employee can view their own payslips', async () => {
    const res = await request(app)
      .get('/api/payroll/my-payslips')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].employeeId).toBe(employeeId);
  });

  it('admin can view specific payslip details', async () => {
    const res = await request(app)
      .get(`/api/payroll/${generatedPayslipId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.employeeId).toBe(employeeId);
  });

  it('admin can update payment status', async () => {
    const res = await request(app)
      .put(`/api/payroll/${generatedPayslipId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentStatus: 'Paid' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.paymentStatus).toBe('Paid');
  });

  it('employee cannot view another employee payslip', async () => {
    // Generate a payslip for another employee
    const adminRes = await request(app)
      .post('/api/payroll')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: 'EMP-ANOTHER',
        salaryMonth: '2026-10',
        basicSalary: 10000
      });

    const otherPayslipId = adminRes.body.data._id || adminRes.body.data.id;

    const empRes = await request(app)
      .get(`/api/payroll/${otherPayslipId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(empRes.statusCode).toBe(403); // Forbidden
  });

});
