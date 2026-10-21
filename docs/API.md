# API

| Method | Route | Authentication | Behavior |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Service health |
| GET/POST/DELETE | `/api/auth/demo` | Public/cookie | Manage demo session |
| GET | `/api/appointments` | Demo session | List the current demo user's requests |
| POST | `/api/appointments` | Demo session | Persist a validated synthetic request |

Clients should send a version-4 UUID in `Idempotency-Key`. Replaying the same key returns the existing row. Appointment times must be future ISO timestamps. Real names, diagnoses, phone numbers, or records are prohibited.
