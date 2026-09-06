# REST API Specification & Reference

The EMS API conforms to RESTful conventions, utilizing JSON payloads, standard HTTP response status codes, and Bearer Token JWT authentication.

**Base URL**: `http://localhost:5000/api` (or production host `https://api.yourdomain.com/api`)

---

## Standard Response Format

All API responses adhere to the standard envelope schema:

### Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed / Invalid input",
  "errors": [ ... ]
}
```

---

## 1. System Health & Diagnostics

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Standard ping health check returning service status |
| `GET` | `/health/details` | Public | Detailed telemetry: memory usage, uptime, DB connection |

---

## 2. Authentication & Authorization (`/auth`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public (Rate-Limited) | Authenticates credentials and returns JWT Bearer token and user profile |
| `GET` | `/auth/me` | Authenticated | Retrieves the current authenticated user's session profile |

### POST `/auth/login`
**Rate Limit**: 15 requests / 15 minutes per IP  
**Request Payload**:
```json
{
  "email": "admin@ems.internal",
  "password": "AdminPassword123!"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "System Administrator",
      "email": "admin@ems.internal",
      "role": "admin",
      "employeeId": "EMP-001"
    }
  }
}
```

---

## 3. Employee Management (`/employees`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/employees` | Authenticated | Lists employees with pagination, search, and department filter. Salaries are redacted for non-admins. |
| `POST` | `/employees` | Admin | Registers a new employee profile and user account |
| `GET` | `/employees/:id` | Authenticated | Retrieves single employee. Peer salaries redacted for non-admins. |
| `PUT` | `/employees/:id` | Admin | Updates employee profile details, department, or role |
| `DELETE` | `/employees/:id` | Admin | Deactivates or removes employee profile |

---

## 4. Attendance Tracking (`/attendance`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/attendance/check-in` | Authenticated | Records check-in with timestamp, location (office/remote), and notes |
| `POST` | `/attendance/check-out` | Authenticated | Records check-out and computes total working hours |
| `GET` | `/attendance/today` | Authenticated | Retrieves today's attendance record for the caller |
| `GET` | `/attendance/my-records` | Authenticated | Retrieves history of caller's attendance records with date filters |
| `GET` | `/attendance` | Admin | Retrieves workforce attendance register across all employees |

---

## 5. Leave Management (`/leaves`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/leaves` | Authenticated | Submits a new leave request (Casual, Sick, Earned) |
| `GET` | `/leaves/my-leaves` | Authenticated | Lists caller's submitted leave requests |
| `GET` | `/leaves/balance` | Authenticated | Returns caller's remaining leave balances by category |
| `GET` | `/leaves` | Admin | Lists all workforce leave requests with status filters |
| `GET` | `/leaves/summary` | Admin | Aggregated leave utilization metrics across departments |
| `PUT` | `/leaves/:id/review` | Admin | Approves or rejects a leave request with reviewer notes |
| `PATCH` | `/leaves/:id/cancel` | Authenticated | Cancels pending leave (enforces IDOR ownership check) |

---

## 6. Payroll Processing (`/payroll`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/payroll` | Admin | Generates itemized payslip for an employee for specified month |
| `GET` | `/payroll` | Admin | Lists generated payslips across all employees with filters |
| `GET` | `/payroll/my-payslips` | Authenticated | Lists calling employee's payslips (peer payslips blocked) |
| `GET` | `/payroll/:id` | Authenticated | Retrieves single payslip. Non-owners blocked (IDOR check) |
| `PUT` | `/payroll/:id/status` | Admin | Updates payment status (`Draft`, `Approved`, `Paid`) |

---

## 7. Notifications & Background Jobs (`/notifications`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | Lists user's alerts (leave status, payslips, announcements) |
| `PATCH` | `/notifications/:id/read`| Authenticated | Marks a specific notification as read |
| `PATCH` | `/notifications/read-all`| Authenticated | Marks all user notifications as read |

---

## 8. HR Analytics Dashboard (`/dashboard`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/admin` | Admin | Real-time aggregate KPIs: total workforce, attendance rate, absenteeism, monthly payroll cost, department breakdown, growth trend |
| `GET` | `/dashboard/employee` | Authenticated | Personalized employee KPIs: attendance streak, remaining leave balance, latest payslip overview, pending requests |

---

## 9. AI Intelligence & RAG Gateway (`/ai`)

| Verb | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/ai/insights/attendance` | Admin | Analyzes attendance anomalies, streaks, and frequent late arrivals |
| `GET` | `/ai/insights/leaves` | Admin | Identifies high leave utilization and department burnout risks |
| `GET` | `/ai/insights/dashboard` | Admin | Executive summary of workforce attendance, leave, and risk signals |
| `POST`| `/ai/chat` | Authenticated | RAG-powered HR Policy Assistant answering questions based on company policy documents |

### POST `/ai/chat`
**Request Payload**:
```json
{
  "message": "What is the annual sick leave entitlement?",
  "history": []
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reply": "Employees are entitled to 12 paid Sick Leaves annually according to Section 3 of the EMS Leave Policy.",
    "sources": ["leave_policy.md"]
  }
}
```
