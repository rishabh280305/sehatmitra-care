# API

| Method | Route | Authentication | Behavior |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Service health |
| GET/POST/DELETE | `/api/auth/demo` | Public/cookie | Inspect, create with a selected role, or delete a signed session |
| GET/POST/PATCH | `/api/appointments` | Role-scoped | List, create, confirm, cancel, or reschedule synthetic requests |
| GET/POST | `/api/visits` | ASHA/doctor/admin | Read authorized field notes; only ASHA can create them |
| GET | `/api/forecast` | Admin | Reproducible synthetic-demand staffing baseline and holdout MAE |
| GET | `/api/notifications` | Demo session | Owner-filtered in-app appointment notifications |

Clients should send a version-4 UUID in `Idempotency-Key`. Replaying the same key returns the existing row. Appointment times must be future ISO timestamps. Real names, diagnoses, phone numbers, or records are prohibited.

Role authorization is enforced in route handlers: patients and ASHA workers request appointments, doctors/admins confirm, patients cannot browse field-worker notes, only ASHA workers record visits, and only admins run staffing forecasts.
