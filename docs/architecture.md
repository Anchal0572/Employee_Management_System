# System Architecture Specification

## 1. Overview & Architectural Goals
The Employee Management System (EMS) is architected as an enterprise-grade full-stack workforce platform engineered for security, high-throughput data processing, auditability, and intelligent decision support. The platform adheres to **12-Factor App principles**, **Domain-Driven Design (DDD)**, and **OWASP Top 10 security standards**.

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier (React 18 + Vite + Tailwind CSS)"]
        UI[Enterprise UI Components]
        State[React Context & Auth State]
        HTTPClient[Axios Interceptors & API Client]
        UI --> State
        State --> HTTPClient
    end

    subgraph SecurityPerimeter["Edge & Middleware Security Perimeter"]
        RateLimit[MemoryRateLimiter (Sliding Window)]
        Sanitizer[NoSQL & XSS Sanitizer]
        HelmetSec[Helmet Secure Headers & CSP]
        AuthRBAC[JWT Auth & RBAC Middleware]
    end

    subgraph ServerTier["Core Backend Tier (Node.js & Express)"]
        Router[Slim REST Routes]
        Controllers[Controller Layer]
        Services[Business Logic & Service Layer]
        DAL[Mongoose ODM & Models]
        Router --> Controllers --> Services --> DAL
    end

    subgraph Persistence["Persistence & Database"]
        MongoDB[(MongoDB Atlas / Local DB)]
        DAL --> MongoDB
    end

    subgraph AsyncBus["Event-Driven Worker Layer"]
        InngestBus[Inngest Event Engine & Scheduler]
        NotificationWorker[Notification & Email Worker]
        PayrollWorker[Automated Payroll Batch Worker]
        Services -.->|Emit Events| InngestBus
        InngestBus --> NotificationWorker
        InngestBus --> PayrollWorker
    end

    subgraph AIServiceTier["AI Intelligence Microservice (Port 5001)"]
        RAGGateway[RAG Vector Gateway]
        Guardrails[Prompt & RBAC Guardrails]
        PolicyDocs[HR Document Embeddings]
        InsightsEngine[Attendance & Leave Analyzer]
        Services <-->|Internal REST API| AIServiceTier
        RAGGateway --> Guardrails --> PolicyDocs
    end

    HTTPClient --> RateLimit --> Sanitizer --> HelmetSec --> AuthRBAC --> Router
```

---

## 2. Multi-Tier Architecture Breakdown

### 2.1 Presentation Tier (`client/`)
- **Technology Stack**: React 18, Vite 5, Tailwind CSS 3, Lucide Icons, Recharts.
- **State Management & Context**: Modular contexts (`AuthContext`, `NotificationContext`) handle authentication tokens, user profile state, live unread counters, and role boundaries.
- **Network Layer**: Centralized Axios client configured with automatic authorization headers, token expiration handlers, and standard error interceptors.
- **Performance**: Code-split route bundles, responsive viewport layouts (mobile, tablet, desktop), dynamic chart rendering with real-time aggregates.

### 2.2 Application / Server Tier (`server/`)
The backend adheres to a **Controller-Service-Repository** pattern:
1. **Routing Layer (`routes/`)**: Strict route definitions mapping HTTP verbs to controllers. Enforces authentication, RBAC, input sanitization, and rate-limiting.
2. **Controller Layer (`controllers/`)**: Thin controllers responsible only for HTTP request parsing, status code selection, and response formatting via `ApiResponse`.
3. **Service Layer (`services/`)**: Pure business logic isolation. Handles data transformations, cross-entity operations, IDOR ownership validations, role-based field redactions (e.g., masking peer salaries), and event emissions.
4. **Data Access Layer (`models/`)**: Mongoose schemas defining strict schema constraints, unique indices, enum validations, and default values.

### 2.3 Event-Driven Background Worker Tier (`server/jobs/` & Inngest)
- Asynchronous tasks and batch operations are decoupled from HTTP request-response cycles.
- **Event Registry**: Emits typed events (`employee.created`, `leave.submitted`, `leave.reviewed`, `payroll.generated`, `attendance.reminder`).
- **Resilience**: Failed jobs implement exponential backoff retry strategies.
- **Email Delivery**: Asynchronous Nodemailer worker handles template rendering and SMTP transmission without blocking user requests.

### 2.4 Persistence Tier (MongoDB)
- Schema definitions enforce strict validation rules.
- Fast analytical aggregations for HR dashboard KPIs (attendance rate, absenteeism, department distribution, leave utilization).
- Robust indexing on frequently queried lookups (`employeeId`, `date`, `monthYear`, `status`, `userId`).

### 2.5 AI Intelligence Layer (`ai-service/`)
- Architected as a decoupled microservice running on port 5001.
- **Workforce Intelligence**: Heuristic and statistical analysis of attendance streaks, frequent late arrivals, absenteeism patterns, and department leave balance risks.
- **RAG (Retrieval-Augmented Generation)**: Vector cosine similarity matching against corporate HR policy documents (`leave_policy.md`, `attendance_rules.md`, `payroll_faq.md`, `code_of_conduct.md`).
- **Strict Guardrails**: Zero autonomous firing/hiring authority; strictly analytical recommendations. Enforces confidentiality by blocking salary queries across peers.

---

## 3. Communication Protocols & Security Boundaries

```
[Client App] --(HTTPS + Bearer JWT + CSRF/CORS)--> [Core API Server]
[Core API Server] --(Mongoose Wire Protocol + TLS)--> [MongoDB Atlas]
[Core API Server] --(Internal HTTP + API Key)--> [AI Microservice]
[Core API Server] --(Async Webhook / Event Bus)--> [Inngest Worker Engine]
[Inngest Worker] --(SMTP / TLS)--> [Corporate Mail Gateway / Mailtrap]
```

### Security Boundaries
1. **Network Boundary**: Frontend client communicates exclusively through `/api/*` endpoints. Direct database or internal AI access from the browser is blocked.
2. **Authorization Boundary**: RBAC determines endpoint access (`admin` vs. `employee`). Field-level sanitizers redact sensitive compensation data from non-administrative queries.
3. **Execution Boundary**: AI queries are executed inside isolated sandboxes with predefined knowledge scopes to prevent prompt injection and data exfiltration.
