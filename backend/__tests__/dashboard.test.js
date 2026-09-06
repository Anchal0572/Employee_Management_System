const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/env');
const dashboardService = require('../services/dashboardService');

let adminToken = '';
let employeeToken = '';

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
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('Phase 8: HR Analytics Dashboard Comprehensive Test Suite', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // 1. ROLE PERMISSIONS & SECURITY
  // ─────────────────────────────────────────────────────────────────────────
  describe('Role Permissions & Authorization', () => {
    it('should reject unauthenticated request to /api/dashboard/admin with 401', async () => {
      const res = await request(app).get('/api/dashboard/admin');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin employee accessing /api/dashboard/admin with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to access /api/dashboard/admin with 200 OK', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated request to /api/dashboard/employee with 401', async () => {
      const res = await request(app).get('/api/dashboard/employee');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow employee to access /api/dashboard/employee with 200 OK', async () => {
      const res = await request(app)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow admin to access /api/dashboard/employee with 200 OK', async () => {
      const res = await request(app)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ADMIN DASHBOARD ANALYTICS & RECHARTS DATA
  // ─────────────────────────────────────────────────────────────────────────
  describe('Admin Analytics Calculations & Charts', () => {
    it('should return complete KPI schema with valid numerical boundaries', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      const { kpis, charts, recentPendingLeaves } = res.body.data;

      expect(typeof kpis.totalEmployees).toBe('number');
      expect(typeof kpis.activeEmployees).toBe('number');
      expect(typeof kpis.newEmployees).toBe('number');
      expect(typeof kpis.attendanceRate).toBe('number');
      expect(typeof kpis.absenteeism).toBe('number');
      expect(typeof kpis.lateArrivals).toBe('number');
      expect(typeof kpis.pendingLeaves).toBe('number');
      expect(typeof kpis.leaveUtilization).toBe('number');
      expect(typeof kpis.monthlyPayroll).toBe('number');

      // Boundary validations
      expect(kpis.totalEmployees).toBeGreaterThanOrEqual(0);
      expect(kpis.activeEmployees).toBeLessThanOrEqual(kpis.totalEmployees);
      expect(kpis.attendanceRate).toBeGreaterThanOrEqual(0);
      expect(kpis.attendanceRate).toBeLessThanOrEqual(100);
      expect(kpis.absenteeism).toBeGreaterThanOrEqual(0);
      expect(kpis.absenteeism).toBeLessThanOrEqual(100);

      // 5 Charts required by Phase 8
      expect(charts).toBeDefined();

      // 1. Attendance Trend
      expect(Array.isArray(charts.attendanceTrend)).toBe(true);
      if (charts.attendanceTrend.length > 0) {
        const item = charts.attendanceTrend[0];
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('day');
        expect(item).toHaveProperty('presentRate');
      }

      // 2. Department Distribution
      expect(Array.isArray(charts.departmentDistribution)).toBe(true);
      if (charts.departmentDistribution.length > 0) {
        const item = charts.departmentDistribution[0];
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('percentage');
      }

      // 3. Leave Statistics
      expect(Array.isArray(charts.leaveStatistics)).toBe(true);
      if (charts.leaveStatistics.length > 0) {
        const item = charts.leaveStatistics[0];
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('approved');
        expect(item).toHaveProperty('pending');
        expect(item).toHaveProperty('rejected');
      }

      // 4. Employee Growth
      expect(Array.isArray(charts.employeeGrowth)).toBe(true);

      // 5. Payroll Overview
      expect(Array.isArray(charts.payrollOverview)).toBe(true);
      if (charts.payrollOverview.length > 0) {
        const item = charts.payrollOverview[0];
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('grossSalary');
        expect(item).toHaveProperty('netSalary');
      }

      expect(Array.isArray(recentPendingLeaves)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. DATE FILTERS
  // ─────────────────────────────────────────────────────────────────────────
  describe('Date Range Filter Operations', () => {
    const ranges = ['7d', '30d', '90d', 'year', 'all'];

    ranges.forEach((range) => {
      it(`should return valid analytics for dateRange=${range}`, async () => {
        const res = await request(app)
          .get(`/api/dashboard/admin?dateRange=${range}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.kpis).toBeDefined();
        expect(res.body.data.charts).toBeDefined();
      });
    });

    it('should support custom startDate and endDate filters', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin?startDate=2026-08-01&endDate=2026-09-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
    });

    it('should handle invalid date string gracefully without crashing', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin?startDate=invalid-date&endDate=not-a-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. DEPARTMENT FILTERS
  // ─────────────────────────────────────────────────────────────────────────
  describe('Department Filter Operations', () => {
    it('should filter metrics by Engineering department', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin?department=Engineering')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.totalEmployees).toBeGreaterThanOrEqual(0);
    });

    it('should filter metrics by Product department', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin?department=Product')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.kpis).toBeDefined();
    });

    it('should return all departments when department=All', async () => {
      const resAll = await request(app)
        .get('/api/dashboard/admin?department=All')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resAll.statusCode).toBe(200);
      expect(resAll.body.data.kpis).toBeDefined();
    });

    it('should handle nonexistent department with 0 employees gracefully', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin?department=NonExistentDept')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.kpis.totalEmployees).toBe(0);
      expect(res.body.data.kpis.activeEmployees).toBe(0);
      expect(res.body.data.kpis.attendanceRate).toBe(0);
      expect(res.body.data.kpis.monthlyPayroll).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. EMPLOYEE PERSONALIZED DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  describe('Personalized Employee Dashboard', () => {
    it('should return complete personal metrics for authenticated user', async () => {
      const res = await request(app)
        .get('/api/dashboard/employee')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      const { profile, personalStats, leaveBalances, attendanceTrend } = res.body.data;

      expect(profile).toBeDefined();
      expect(profile.employeeId).toBeDefined();
      expect(profile.name).toBeDefined();

      expect(personalStats.attendanceRate).toBeGreaterThanOrEqual(0);
      expect(personalStats.attendanceRate).toBeLessThanOrEqual(100);
      expect(personalStats.daysPresent).toBeGreaterThanOrEqual(0);
      expect(personalStats.lateArrivals).toBeGreaterThanOrEqual(0);
      expect(personalStats.absences).toBeGreaterThanOrEqual(0);
      expect(typeof personalStats.averageWorkingHours).toBe('number');

      // Leave Balances for all 4 primary leave types
      expect(leaveBalances.Earned).toBeDefined();
      expect(leaveBalances.Earned.quota).toBe(18);
      expect(leaveBalances.Earned.remaining).toBeLessThanOrEqual(18);

      expect(leaveBalances.Sick).toBeDefined();
      expect(leaveBalances.Sick.quota).toBe(12);

      expect(leaveBalances.Casual).toBeDefined();
      expect(leaveBalances.Casual.quota).toBe(10);

      expect(leaveBalances.Emergency).toBeDefined();
      expect(leaveBalances.Emergency.quota).toBe(5);

      expect(Array.isArray(attendanceTrend)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. EMPTY DATASET & LARGE DATASET RESILIENCE
  // ─────────────────────────────────────────────────────────────────────────
  describe('Edge Cases: Empty Data & Performance Resilience', () => {
    it('should safely calculate metrics when input dataset is completely empty', () => {
      // Direct service calculation test with simulated empty collections
      const res = dashboardService.getAdminDashboardFromMemory({
        department: 'NonExistent',
        start: new Date('2099-01-01'),
        end: new Date('2099-01-02')
      });

      expect(res.kpis.totalEmployees).toBe(0);
      expect(res.kpis.activeEmployees).toBe(0);
      expect(res.kpis.attendanceRate).toBe(0);
      expect(res.kpis.absenteeism).toBe(0);
      expect(res.kpis.lateArrivals).toBe(0);
      expect(res.kpis.monthlyPayroll).toBe(0);
      expect(res.kpis.pendingLeaves).toBe(0);
      expect(res.kpis.leaveUtilization).toBe(0);
    });

    it('should handle high-volume dataset aggregation within performance threshold', async () => {
      const startTime = Date.now();

      // Execute 20 concurrent dashboard queries with different filters
      const promises = Array.from({ length: 20 }, (_, i) => {
        const ranges = ['7d', '30d', '90d', 'year'];
        const depts = ['Engineering', 'Product', 'Finance', 'All'];
        return request(app)
          .get(`/api/dashboard/admin?dateRange=${ranges[i % ranges.length]}&department=${depts[i % depts.length]}`)
          .set('Authorization', `Bearer ${adminToken}`);
      });

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach((res) => {
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      });

      // 20 concurrent queries should easily complete in less than 2000ms
      expect(totalTime).toBeLessThan(2000);
    });
  });
});
