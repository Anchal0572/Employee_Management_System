const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/env');
const { authLimiterInstance } = require('../middleware/rateLimiter');
const { sanitizeValue } = require('../middleware/sanitizer');

let adminToken = '';
let employeeToken = '';
let adminUser = null;
let employeeUser = null;

beforeAll(async () => {
  // Authenticate Admin
  const adminRes = await request(app).post('/api/auth/login').send({
    email: config.adminSeed.email,
    password: config.adminSeed.password
  });
  adminToken = adminRes.body.data.token;
  adminUser = adminRes.body.data.user;

  // Authenticate Employee
  const empRes = await request(app).post('/api/auth/login').send({
    email: config.employeeSeed.email,
    password: config.employeeSeed.password
  });
  employeeToken = empRes.body.data.token;
  employeeUser = empRes.body.data.user;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('Phase 11: Production-Readiness Security & Vulnerability Audit Suite', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // 1. RATE LIMITING & BRUTE FORCE PROTECTION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Rate Limiting & Throttling Defense', () => {
    it('should throttle and return 429 when login attempt limit is exceeded', async () => {
      authLimiterInstance.reset();

      // Send 15 requests (allowed threshold)
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: 'bad@login.attempt', password: 'wrong' });
      }

      // The 16th request must be throttled with 429 Too Many Requests
      const throttledRes = await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'true')
        .send({ email: 'bad@login.attempt', password: 'wrong' });

      expect(throttledRes.statusCode).toBe(429);
      expect(throttledRes.body.success).toBe(false);
      expect(throttledRes.headers['retry-after']).toBeDefined();
      expect(throttledRes.headers['ratelimit-remaining']).toBe('0');

      authLimiterInstance.reset();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. INPUT SANITIZATION (NoSQL Injection, XSS, Prototype Pollution)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Input Sanitization & Injection Defense', () => {
    it('sanitizer should strip NoSQL injection operators ($gt, $ne)', () => {
      const maliciousPayload = {
        email: { $gt: '' },
        password: { $ne: null },
        username: 'admin'
      };

      const cleaned = sanitizeValue(maliciousPayload);
      expect(cleaned.email).toBeUndefined();
      expect(cleaned.password).toBeUndefined();
      expect(cleaned.username).toBe('admin');
    });

    it('sanitizer should neutralize malicious XSS script tags and event handlers', () => {
      const maliciousInput = {
        comment: '<script>alert("xss")</script>Hello World',
        handler: 'onerror=alert(document.cookie)'
      };

      const cleaned = sanitizeValue(maliciousInput);
      expect(cleaned.comment).not.toContain('<script>');
      expect(cleaned.comment).toBe('Hello World');
      expect(cleaned.handler).not.toContain('onerror=');
    });

    it('sanitizer should neutralize prototype pollution vectors', () => {
      const payload = JSON.parse('{"__proto__": {"polluted": true}, "name": "Safe"}');
      const cleaned = sanitizeValue(payload);
      expect(cleaned.__proto__.polluted).toBeUndefined();
      expect(cleaned.name).toBe('Safe');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. SALARY DATA LEAKAGE & PEER PRIVACY
  // ─────────────────────────────────────────────────────────────────────────
  describe('Salary Data Leakage & Peer Privacy Protection', () => {
    it('regular employee calling GET /api/employees should NOT see other employees salaries', async () => {
      const res = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify that for all peers, salary is omitted
      const peers = res.body.data.filter(
        emp => emp.email && emp.email.toLowerCase() !== employeeUser.email.toLowerCase()
      );

      expect(peers.length).toBeGreaterThan(0);
      peers.forEach(peer => {
        expect(peer.salary).toBeUndefined();
      });
    });

    it('admin calling GET /api/employees SHOULD see authorized salary fields', async () => {
      const res = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const employeesWithSalary = res.body.data.filter(emp => emp.salary !== undefined);
      expect(employeesWithSalary.length).toBeGreaterThan(0);
    });

    it('regular employee calling GET /api/employees/:id for a peer should NOT see their salary or payslipSummary', async () => {
      // Find admin's employee ID or a peer's ID
      const listRes = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      const peer = listRes.body.data.find(
        e => e.email && e.email.toLowerCase() !== employeeUser.email.toLowerCase()
      );

      expect(peer).toBeDefined();

      const peerRes = await request(app)
        .get(`/api/employees/${peer._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(peerRes.statusCode).toBe(200);
      expect(peerRes.body.data.salary).toBeUndefined();
      expect(peerRes.body.data.payslipSummary).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. IDOR (Insecure Direct Object Reference) PREVENTION
  // ─────────────────────────────────────────────────────────────────────────
  describe('IDOR Vulnerability Defenses', () => {
    it('employee cannot view another employee payslip by ID (403 Forbidden)', async () => {
      // Admin gets all payslips
      const payslipsRes = await request(app)
        .get('/api/payroll')
        .set('Authorization', `Bearer ${adminToken}`);

      const allPayslips = payslipsRes.body.data?.payslips || payslipsRes.body.data || [];
      expect(allPayslips.length).toBeGreaterThan(0);

      // Find a payslip that does NOT belong to the test employee
      const otherPayslip = allPayslips.find(
        p => p.employeeId !== employeeUser.employeeId && p.employeeName !== employeeUser.name
      );

      if (otherPayslip) {
        const idorRes = await request(app)
          .get(`/api/payroll/${otherPayslip._id || otherPayslip.id}`)
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(idorRes.statusCode).toBe(403);
        expect(idorRes.body.success).toBe(false);
      }
    });

    it('employee cannot cancel or modify another employee leave request (403 Forbidden)', async () => {
      // Admin gets leave list
      const leavesRes = await request(app)
        .get('/api/leaves')
        .set('Authorization', `Bearer ${adminToken}`);

      const allLeaves = leavesRes.body.data?.leaves || leavesRes.body.data || [];
      const otherLeave = allLeaves.find(
        l => l.employeeName !== employeeUser.name && l.employeeId !== employeeUser.employeeId
      );

      if (otherLeave) {
        const idorCancelRes = await request(app)
          .put(`/api/leaves/${otherLeave._id || otherLeave.id}/cancel`)
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(idorCancelRes.statusCode).toBe(403);
        expect(idorCancelRes.body.success).toBe(false);
      }
    });

    it('employee cannot view another employee leave details by ID (403 Forbidden)', async () => {
      const leavesRes = await request(app)
        .get('/api/leaves')
        .set('Authorization', `Bearer ${adminToken}`);

      const allLeaves = leavesRes.body.data?.leaves || leavesRes.body.data || [];
      const otherLeave = allLeaves.find(
        l => l.employeeName !== employeeUser.name && l.employeeId !== employeeUser.employeeId
      );

      if (otherLeave) {
        const idorGetRes = await request(app)
          .get(`/api/leaves/${otherLeave._id || otherLeave.id}`)
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(idorGetRes.statusCode).toBe(403);
        expect(idorGetRes.body.success).toBe(false);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. BROKEN ACCESS CONTROL (Admin Endpoints Restriction)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Broken Access Control Enforcement', () => {
    it('employee cannot access general attendance register /api/attendance (403)', async () => {
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('employee cannot access organization-wide leave register /api/leaves (403)', async () => {
      const res = await request(app)
        .get('/api/leaves')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('employee cannot access organization-wide leave summary /api/leaves/summary (403)', async () => {
      const res = await request(app)
        .get('/api/leaves/summary')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('employee cannot access payroll management /api/payroll (403)', async () => {
      const res = await request(app)
        .get('/api/payroll')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('employee cannot trigger knowledge base reindex /api/ai/knowledge/reindex (403)', async () => {
      const res = await request(app)
        .post('/api/ai/knowledge/reindex')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SECURE HEADERS (Helmet & Transport Security)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Secure Headers Verification', () => {
    it('responses should include HSTS, X-Content-Type-Options, X-Frame-Options and CSP headers', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

});
