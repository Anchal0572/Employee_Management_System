const request = require('supertest');
const app = require('../app');
const config = require('../config/env');

describe('EMS Employee Management CRUD & RBAC Suite', () => {
  let adminToken = '';
  let employeeToken = '';
  let createdEmployeeId = '';
  let testEmployeeEmail = `test.dev.${Date.now()}@ems.corp`;

  // Authenticate Admin
  it('1. Authenticates admin user for management suite', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: config.adminSeed.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;
  });

  // Authenticate Employee
  it('2. Authenticates non-admin employee user for RBAC barrier verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.employeeSeed.email,
        password: config.employeeSeed.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    employeeToken = res.body.data.token;
  });

  // 3. Unauthenticated access rejected
  it('3. Unauthenticated request to GET /api/employees returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/employees');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 4. Employee role cannot create employee (403)
  it('4. Employee role attempting POST /api/employees returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        firstName: 'Unauthorized',
        lastName: 'Attempt',
        email: 'unauthorized@ems.corp',
        department: 'Engineering',
        designation: 'Intern',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  // 5. Validation error: Missing required fields (400)
  it('5. Admin POST /api/employees with missing fields returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Incomplete',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 6. Admin can create employee with full fields (201)
  it('6. Admin POST /api/employees successfully creates employee record (201)', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Alexander',
        lastName: 'Wright',
        email: testEmployeeEmail,
        phone: '+1 (555) 432-8899',
        department: 'Engineering',
        designation: 'Staff Security Engineer',
        employmentType: 'full-time',
        status: 'active',
        joiningDate: '2025-01-15',
        salary: {
          base: 145000,
          currency: 'USD',
          payFrequency: 'monthly',
        },
        address: {
          street: '450 Tech Parkway, Suite 300',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          country: 'USA',
        },
        emergencyContact: {
          name: 'Sarah Wright',
          relationship: 'Spouse',
          phone: '+1 (555) 432-8890',
        },
        skills: ['Cloud Security', 'OAuth2', 'Zero-Trust', 'Node.js'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id || res.body.data.id).toBeDefined();
    expect(res.body.data.employeeId).toBeDefined();
    expect(res.body.data.email).toBe(testEmployeeEmail);
    expect(res.body.data.firstName).toBe('Alexander');
    expect(res.body.data.designation).toBe('Staff Security Engineer');

    createdEmployeeId = res.body.data._id || res.body.data.id;
  });

  // 7. Duplicate email rejection (409)
  it('7. Admin POST /api/employees with duplicate email returns 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'User',
        email: testEmployeeEmail,
        phone: '+1 (555) 000-1122',
        department: 'Engineering',
        designation: 'Developer',
        salary: 90000,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  // 8. Retrieve list with pagination
  it('8. GET /api/employees returns paginated list of employees', async () => {
    const res = await request(app)
      .get('/api/employees?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.pagination).toBeDefined();
    expect(res.body.meta.pagination.page).toBe(1);
    expect(res.body.meta.pagination.limit).toBe(5);
    expect(res.body.meta.pagination.total).toBeGreaterThanOrEqual(1);
  });

  // 9. Search and filter employees
  it('9. GET /api/employees?search=Alexander filters correctly', async () => {
    const res = await request(app)
      .get('/api/employees?search=Alexander')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].firstName).toBe('Alexander');
  });

  // 10. Single employee details with 360-degree summaries
  it('10. GET /api/employees/:id returns detailed employee record with 360 summaries', async () => {
    const res = await request(app)
      .get(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmployeeEmail);
    expect(res.body.data).toHaveProperty('attendanceSummary');
    expect(res.body.data).toHaveProperty('leaveSummary');
    expect(res.body.data).toHaveProperty('payslipSummary');
    expect(res.body.data.attendanceSummary.presentDays).toBeDefined();
  });

  // 11. Employee role cannot update employee (403)
  it('11. Employee role attempting PUT /api/employees/:id returns 403 Forbidden', async () => {
    const res = await request(app)
      .put(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        designation: 'VP of Engineering',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 12. Admin can update employee details (200)
  it('12. Admin PUT /api/employees/:id updates employee designation and salary', async () => {
    const res = await request(app)
      .put(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        designation: 'Principal Security Architect',
        salary: {
          base: 160000,
          currency: 'USD',
          payFrequency: 'monthly',
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.designation).toBe('Principal Security Architect');
    expect(res.body.data.salary === 160000 || (res.body.data.salary && res.body.data.salary.base === 160000)).toBe(true);
  });

  // 13. Employee role cannot delete employee (403)
  it('13. Employee role attempting DELETE /api/employees/:id returns 403 Forbidden', async () => {
    const res = await request(app)
      .delete(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 14. Admin can delete employee (200)
  it('14. Admin DELETE /api/employees/:id successfully removes employee', async () => {
    const res = await request(app)
      .delete(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify subsequent lookup returns 404
    const getRes = await request(app)
      .get(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.statusCode).toBe(404);
  });
});
