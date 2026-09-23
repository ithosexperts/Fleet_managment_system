# API Error Handling Specification

## 1. Error Response Architecture
All backend endpoints return standardized JSON error responses.

### Error Envelope
```json
{
  "error": "Human-readable description of what failed",
  "code": "OPTIONAL_ERROR_CODE",
  "details": null
}
```

---

## 2. HTTP Status Code Conventions

| Status Code | Meaning | Operational Context |
| :---: | :--- | :--- |
| **`200 OK`** | Success | Standard read/update operation completed successfully. |
| **`201 Created`** | Created | Resource successfully created (manifest, vehicle, document, stop). |
| **`400 Bad Request`** | Validation Failure | Missing mandatory fields (e.g. planned departure time, driver ID). |
| **`401 Unauthorized`** | Authentication Missing | Missing, expired, or cryptographically invalid JWT header. |
| **`403 Forbidden`** | RBAC Violation | Driver account attempting to access manager dispatch configuration. |
| **`404 Not Found`** | Resource Missing | Trip ID or vehicle record does not exist in the database. |
| **`409 Conflict`** | Invariant Violation | Attempting to deactivate a facility referenced by an active in-progress trip. |
| **`500 Server Error`** | Unhandled Server Exception | Global error handler intercepts, logs internally, and returns safe message without leaking stack traces. |

---

## 3. Production Security Guarantees
- **No Stack Traces**: The global error handler (`server/src/index.ts`) sanitizes server errors before responding to clients, preventing internal path or runtime disclosure.
- **No Secret Leaks**: Database connection strings, JWT signing secrets, and API credentials are never returned in error responses.
