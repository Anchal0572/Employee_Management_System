# REST API Specification & Envelope Standards

## 1. Response Envelopes

### Success Envelope
All successful API responses return status code `200` or `201` with the following structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 148
  }
}
```

### Basic Health Check Contract (GET /api/health)
```json
{
  "success": true,
  "message": "EMS API is running"
}
```

### Error Envelope
All API errors return status code `4xx` or `5xx` with the following structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error occurred",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid enterprise email address"
    }
  ]
}
```

## 2. Phase 1 Core Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API status and root greeting | No |
| `GET` | `/api/health` | Standardized health check | No |
| `GET` | `/api/health/details` | Detailed system telemetry (uptime, memory, DB status) | No |
| `GET` | `/api/ai/health` | Isolated AI service health check (Port 5001) | No |
