# Testing Strategy & Automated Quality Assurance

## 1. Testing Philosophy & Strategy
The Employee Management System (EMS) implements a comprehensive automated testing strategy adhering to the **Testing Pyramid**:
- **Unit & Service Layer Tests**: Validate domain logic, calculation formulas (payroll, hours worked), and input sanitizers in isolation.
- **API Integration Tests**: Supertest-driven HTTP integration tests validating endpoint status codes, RBAC enforcement, pagination, and error responses.
- **Security & Penetration Tests**: Explicit automated regression tests targeting OWASP vulnerabilities (NoSQL injection, XSS, IDOR, brute-force rate limits, salary leaks).
- **End-to-End (E2E) Workflow Tests**: Multi-step user lifecycle test verifying full business flows across Admin and Employee accounts.

---

## 2. Test Execution Matrix

| Test Suite | File Location | Tests | Focus Area | Result |
| :--- | :--- | :---: | :--- | :---: |
| **E2E Lifecycle Workflow** | `server/__tests__/e2e.workflow.test.js` | 12 | Complete 12-step lifecycle (Login &rarr; Leave &rarr; Payroll &rarr; AI) | **PASS** |
| **Security & Vulnerability Audit** | `server/__tests__/security.test.js` | 16 | Rate limiting, NoSQL injection, XSS, IDOR, salary leakage | **PASS** |
| **AI Intelligence & RAG** | `server/__tests__/ai.test.js` | 24 | Guardrails, vector retrieval, attendance & leave heuristics | **PASS** |
| **Notifications & Jobs** | `server/__tests__/notifications.test.js` | 19 | Event-driven alerts, email service, read-receipt updates | **PASS** |
| **Analytics Dashboard** | `server/__tests__/dashboard.test.js` | 26 | MongoDB aggregations, KPIs, trends, department metrics | **PASS** |
| **Employee Management** | `server/__tests__/employees.test.js` | 12 | Employee CRUD, pagination, filtering, unique constraints | **PASS** |
| **Attendance Tracking** | `server/__tests__/attendance.test.js` | 15 | Check-in, check-out, working hours calculation, registers | **PASS** |
| **Leave Management** | `server/__tests__/leaves.test.js` | 12 | Leave submission, balance deduction, admin approval flow | **PASS** |
| **Payroll Processing** | `server/__tests__/payroll.test.js` | 11 | Payslip calculation, allowances, deductions, status updates | **PASS** |
| **Authentication & RBAC** | `server/__tests__/auth.test.js` | 8 | JWT issuance, password verification, route protection | **PASS** |
| **Server Health Telemetry** | `server/__tests__/health.test.js` | 3 | Health check, detailed server diagnostic reports | **PASS** |
| **Root System Diagnostics** | `tests/health.test.js` | 3 | Monorepo root health and connectivity check | **PASS** |
| **Total Automated Tests** | **All 12 Test Suites** | **161** | **Comprehensive Full-Stack Coverage** | **100% PASS** |

---

## 3. End-to-End (E2E) Workflow Verification
The test suite `server/__tests__/e2e.workflow.test.js` verifies the complete enterprise employee lifecycle:
1. **Admin Authentication**: Authenticates admin user and obtains bearer JWT token.
2. **Employee Registration**: Admin provisions a new employee profile (`Lucas Vance`, Engineering).
3. **Employee Authentication**: Newly created employee logs in with issued credentials.
4. **Attendance Check-In**: Employee logs check-in event with location.
5. **Attendance Check-Out**: Employee logs check-out event; system calculates active hours.
6. **Leave Application**: Employee applies for 2 days of Earned Leave.
7. **Managerial Review**: Admin approves the pending leave with reviewer remarks.
8. **Payroll Generation**: Admin generates itemized payslip for the billing cycle.
9. **Employee Payslip Access**: Employee views their newly issued payslip; IDOR barriers prevent accessing peer payslips.
10. **Notification Generation**: System emits and persists in-app alerts for the leave and payslip events.
11. **Dashboard KPI Refresh**: Workforce dashboard metrics dynamically reflect new employee, attendance, and leave stats.
12. **AI Pattern Synthesis**: AI intelligence layer generates real-time pattern insights on the updated dataset.

---

## 4. Running Tests Locally

### Run All Test Suites
```bash
# From the project root
npm test

# Or run sequentially in-band for deterministic output
npx jest --runInBand
```

### Run Specific Test Suites
```bash
# Run Security Audit suite
npx jest server/__tests__/security.test.js

# Run E2E Workflow suite
npx jest server/__tests__/e2e.workflow.test.js

# Run AI Intelligence suite
npx jest server/__tests__/ai.test.js
```

---

## 5. Frontend Production Verification
The frontend client build is validated through Vite's production optimizer:
```bash
cd client
npm run build
```
Build output produces minified and optimized production assets in `client/dist/` with zero module or syntax errors.
