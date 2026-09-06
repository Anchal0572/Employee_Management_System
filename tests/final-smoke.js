/**
 * Phase 12 Final Quality Check & Smoke Test
 */
const http = require('http');
const config = require('../server/config/env');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(responseData) });
          } catch {
            resolve({ status: res.statusCode, body: responseData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(responseData) });
          } catch {
            resolve({ status: res.statusCode, body: responseData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runSmokeTest() {
  console.log('=== PHASE 12 FINAL SMOKE TEST ===\n');

  // 1. Health Check
  const health = await get('/api/health');
  console.log(`1. Health Check (/api/health): HTTP ${health.status} - Success: ${health.body.success}`);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Admin Login
  const login = await post('/api/auth/login', {
    email: config.adminSeed.email,
    password: config.adminSeed.password,
  });
  console.log(`2. Admin Login (/api/auth/login): HTTP ${login.status} - User: ${login.body.data?.user?.name} (${login.body.data?.user?.role})`);
  if (login.status !== 200) throw new Error('Admin login failed');
  const token = login.body.data?.token;

  // 3. Admin Dashboard
  const dashboard = await get('/api/dashboard/admin', token);
  console.log(`3. Admin Dashboard (/api/dashboard/admin): HTTP ${dashboard.status} - Total Employees: ${dashboard.body.data?.metrics?.totalEmployees}`);
  if (dashboard.status !== 200) throw new Error('Admin dashboard failed');

  // 4. Employee Directory
  const employees = await get('/api/employees', token);
  const count = employees.body.data?.total || employees.body.data?.employees?.length || employees.body.data?.length;
  console.log(`4. Employees Directory (/api/employees): HTTP ${employees.status} - Count: ${count}`);
  if (employees.status !== 200) throw new Error('Employees directory failed');

  // 5. Attendance Summary
  const attendance = await get('/api/attendance/summary', token);
  console.log(`5. Attendance Summary (/api/attendance/summary): HTTP ${attendance.status} - Present Today: ${attendance.body.data?.presentToday ?? 0}`);
  if (attendance.status !== 200) throw new Error('Attendance summary failed');

  // 6. Leave Summary
  const leaves = await get('/api/leaves/summary', token);
  console.log(`6. Leave Summary (/api/leaves/summary): HTTP ${leaves.status} - Total Pending: ${leaves.body.data?.pending ?? leaves.body.data?.totalPending ?? 0}`);
  if (leaves.status !== 200) throw new Error('Leave summary failed');

  // 7. Payroll Summary
  const payroll = await get('/api/payroll', token);
  const payCount = payroll.body.data?.payslips?.length || payroll.body.data?.length;
  console.log(`7. Payroll Records (/api/payroll): HTTP ${payroll.status} - Payslips: ${payCount}`);
  if (payroll.status !== 200) throw new Error('Payroll endpoint failed');

  // 8. Notifications
  const notifications = await get('/api/notifications', token);
  console.log(`8. Notifications (/api/notifications): HTTP ${notifications.status} - Unread: ${notifications.body.data?.unreadCount ?? 0}`);
  if (notifications.status !== 200) throw new Error('Notifications endpoint failed');

  // 9. AI Workforce Insights
  const ai = await get('/api/ai/insights/dashboard', token);
  console.log(`9. AI Insights (/api/ai/insights/dashboard): HTTP ${ai.status} - Total Signals: ${ai.body.data?.summary?.totalSignals ?? 0}`);
  if (ai.status !== 200) throw new Error('AI insights failed');

  // 10. Employee Self-Service Check
  const empLogin = await post('/api/auth/login', {
    email: config.employeeSeed.email,
    password: config.employeeSeed.password,
  });
  console.log(`10. Employee Login (/api/auth/login): HTTP ${empLogin.status} - Role: ${empLogin.body.data?.user?.role}`);
  if (empLogin.status !== 200) throw new Error('Employee login failed');

  const empToken = empLogin.body.data?.token;
  const empDash = await get('/api/dashboard/employee', empToken);
  console.log(`11. Employee Dashboard (/api/dashboard/employee): HTTP ${empDash.status} - Streak: ${empDash.body.data?.metrics?.attendanceStreak ?? 0}`);
  if (empDash.status !== 200) throw new Error('Employee dashboard failed');

  console.log('\n=== ALL SMOKE TEST ENDPOINTS PASSED SUCCESSFULLY (100% OPERATIONAL) ===');
}

runSmokeTest().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
