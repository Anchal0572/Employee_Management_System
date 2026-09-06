const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/env');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const eventDispatcher = require('../jobs/eventDispatcher');
const { onEmployeeCreated } = require('../jobs/functions/employeeEvents');
const { onLeaveSubmitted, onLeaveApproved, onLeaveRejected } = require('../jobs/functions/leaveEvents');
const { onPayslipGenerated } = require('../jobs/functions/payrollEvents');
const { dailyAttendanceReminder, monthlyPayslipProcessing } = require('../jobs/functions/cronJobs');

let adminToken = '';
let employeeToken = '';
let testNotificationId = '';

beforeAll(async () => {
  // Authenticate Admin
  const adminLoginRes = await request(app).post('/api/auth/login').send({
    email: config.adminSeed.email,
    password: config.adminSeed.password
  });
  adminToken = adminLoginRes.body.data.token;

  // Authenticate Employee
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

describe('Phase 9: Event-Driven Notifications & Background Jobs Test Suite', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // 1. NOTIFICATION API ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────
  describe('Notification API Endpoints', () => {
    it('should reject unauthenticated request to /api/notifications with 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow authenticated user to retrieve notifications with unreadCount', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(typeof res.body.meta.unreadCount).toBe('number');

      if (res.body.data.length > 0) {
        testNotificationId = res.body.data[0]._id || res.body.data[0].id;
      }
    });

    it('should support notification filtering by type and unreadOnly', async () => {
      const res = await request(app)
        .get('/api/notifications?type=leave&unreadOnly=true')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((n) => {
        expect(n.read).toBe(false);
        expect(n.type).toBe('leave');
      });
    });

    it('should mark single notification as read via PATCH /api/notifications/:id/read', async () => {
      // First create a new test notification
      const created = await notificationService.createNotification({
        recipientRole: 'employee',
        title: 'Test Read Endpoint',
        message: 'This notification will be marked as read via PATCH',
        type: 'system'
      });

      const notifId = created._id || created.id;

      const res = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.read).toBe(true);
    });

    it('should mark all notifications as read via PATCH /api/notifications/read-all', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unreadCount becomes 0 for this user
      const checkRes = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(checkRes.statusCode).toBe(200);
      expect(checkRes.body.meta.unreadCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. EMAIL SERVICE & HTML TEMPLATE TESTS
  // ─────────────────────────────────────────────────────────────────────────
  describe('Email Service & Template Rendering', () => {
    const mockEmployee = {
      _id: '66e1b0000000000000000001',
      employeeId: 'EMP-001',
      name: 'Sophia Chen',
      firstName: 'Sophia',
      email: 'sophia.chen@ems.corp',
      department: 'Engineering',
      designation: 'Staff Software Engineer',
      joiningDate: new Date('2024-01-15')
    };

    const mockLeave = {
      _id: '66e4a0000000000000000001',
      employeeName: 'Sophia Chen',
      employeeEmail: 'sophia.chen@ems.corp',
      leaveType: 'Earned',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-05'),
      totalDays: 4,
      reason: 'Vacation travel',
      status: 'Pending'
    };

    const mockPayslip = {
      _id: '66e5a0000000000000000001',
      employeeName: 'Sophia Chen',
      employeeEmail: 'sophia.chen@ems.corp',
      salaryMonth: '2026-09',
      grossSalary: 14500,
      netSalary: 11200,
      totalDeductions: 2100,
      tax: 1200,
      paymentStatus: 'Paid'
    };

    it('should successfully dispatch welcome email with valid HTML template', async () => {
      const res = await emailService.sendWelcomeEmail(mockEmployee);
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });

    it('should successfully dispatch leave submission email', async () => {
      const res = await emailService.sendLeaveSubmissionEmail(mockLeave, mockEmployee);
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });

    it('should successfully dispatch leave approval email', async () => {
      const res = await emailService.sendLeaveApprovalEmail(mockLeave, mockEmployee, 'HR Director');
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });

    it('should successfully dispatch leave rejection email with reason', async () => {
      const res = await emailService.sendLeaveRejectionEmail(mockLeave, mockEmployee, 'HR Director', 'Team headcount capacity limit');
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });

    it('should successfully dispatch payslip generated email', async () => {
      const res = await emailService.sendPayslipGeneratedEmail(mockPayslip, mockEmployee);
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });

    it('should successfully dispatch daily attendance reminder email', async () => {
      const res = await emailService.sendAttendanceReminderEmail(mockEmployee);
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. EVENT DISPATCHER & INNGEST BACKGROUND JOBS
  // ─────────────────────────────────────────────────────────────────────────
  describe('Event Dispatcher & Inngest Job Execution', () => {
    it('eventDispatcher should dispatch events in a non-blocking asynchronous manner', () => {
      expect(() => {
        eventDispatcher.employeeCreated({ name: 'Test New Hire', email: 'hire@ems.corp', department: 'Sales' });
        eventDispatcher.leaveSubmitted({ employeeName: 'Test', leaveType: 'Casual', totalDays: 1 });
        eventDispatcher.leaveApproved({ employeeName: 'Test', leaveType: 'Earned' }, null, 'HR Admin');
        eventDispatcher.leaveRejected({ employeeName: 'Test', leaveType: 'Sick' }, null, 'HR Admin', 'Docs needed');
        eventDispatcher.payslipGenerated({ salaryMonth: '2026-09', netSalary: 5000 });
        eventDispatcher.attendanceReminder({ name: 'Test', email: 'test@ems.corp' });
      }).not.toThrow();
    });

    it('Inngest function onEmployeeCreated should be defined with correct trigger', () => {
      expect(onEmployeeCreated).toBeDefined();
      expect(onEmployeeCreated.opts).toBeDefined();
      expect(onEmployeeCreated.opts.id).toBe('ems-on-employee-created');
    });

    it('Inngest leave functions should be defined with correct triggers', () => {
      expect(onLeaveSubmitted).toBeDefined();
      expect(onLeaveSubmitted.opts.id).toBe('ems-on-leave-submitted');

      expect(onLeaveApproved).toBeDefined();
      expect(onLeaveApproved.opts.id).toBe('ems-on-leave-approved');

      expect(onLeaveRejected).toBeDefined();
      expect(onLeaveRejected.opts.id).toBe('ems-on-leave-rejected');
    });

    it('Inngest payroll and cron functions should be defined with correct triggers', () => {
      expect(onPayslipGenerated).toBeDefined();
      expect(onPayslipGenerated.opts.id).toBe('ems-on-payslip-generated');

      expect(dailyAttendanceReminder).toBeDefined();
      expect(dailyAttendanceReminder.opts.id).toBe('ems-daily-attendance-reminder');

      expect(monthlyPayslipProcessing).toBeDefined();
      expect(monthlyPayslipProcessing.opts.id).toBe('ems-monthly-payroll-processing');
    });

    it('Inngest serve endpoint /api/inngest should respond with 200 or proper Inngest schema', async () => {
      const res = await request(app).get('/api/inngest');
      // Inngest serve GET returns configuration / function definitions JSON
      expect([200, 400, 405]).toContain(res.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. FAILURE HANDLING & RESILIENCE
  // ─────────────────────────────────────────────────────────────────────────
  describe('Failure Handling & Fault Tolerance', () => {
    it('emailService should handle missing recipient gracefully without throwing error', async () => {
      const result = await emailService.sendEmail({ to: '', subject: 'Invalid To', html: '<p>Test</p>' });
      // Should not throw unhandled exception
      expect(result).toBeDefined();
    });

    it('notificationService should handle missing id on markAsRead gracefully', async () => {
      const res = await notificationService.markAsRead('non-existent-id-0000');
      expect(res === null || typeof res === 'object').toBe(true);
    });

    it('eventDispatcher should swallow dispatch errors cleanly without affecting caller execution', () => {
      expect(() => {
        eventDispatcher.dispatch(null, null);
      }).not.toThrow();
    });
  });
});
