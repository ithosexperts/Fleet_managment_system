# Application Security Specification

## 1. Authentication & JWT Architecture
- **Stateless Tokens**: User sessions are authenticated via HMAC-SHA256 signed JSON Web Tokens (JWT).
- **Token Lifetime**: 24 hours. Tokens encode user `id`, `email`, `role`, and `name`.
- **Secret Management**: Tokens are signed using `process.env.JWT_SECRET`. Render provisions a cryptographically random secret on deployment via `generateValue: true`.

---

## 2. Role-Based Access Control (RBAC)
Endpoints enforce authorization via `requireRole('MANAGER')`:
- **`DRIVER` Role**: Limited strictly to `/api/driver/*` endpoints (updating own active trip checkpoints, reporting route delays, uploading POD photos).
- **`MANAGER` Role**: Authorized for `/api/trips`, `/api/fleet`, `/api/reports`, and audit exports.
- **`ADMIN` Role**: Superuser privileges for user provisioning.

---

## 3. SQL Injection Prevention
- **Parameterized Statements**: All database operations use PostgreSQL parameterized queries through `query()` (`... WHERE id = $1`).
- **Zero Raw Interpolation**: Dynamic user inputs are never concatenated directly into SQL strings.

---

## 4. Input Sanitization & File Upload Protections
- **Multipart Uploads**: Handled via `multer` in [`server/src/routes/photos.ts`](file:///u:/tracktracker/server/src/routes/photos.ts).
- **MIME Type Validation**: Restricted to image types (`image/jpeg`, `image/png`, `image/webp`).
- **File Size Caps**: Uploads are restricted to `10MB` per file to prevent disk exhaustion.
- **Disk Isolation**: Uploaded files are stored in `uploads/` and served with non-executable headers.
