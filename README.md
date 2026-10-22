# SehatMitra Care

SehatMitra is an offline-first healthcare coordination portfolio application. It uses synthetic aliases only and makes no diagnostic or regulatory-compliance claims.

## Verified capabilities

- Signed demo access and persistent synthetic appointment requests
- Browser IndexedDB outbox with observable online/offline and pending state
- Automatic/manual retry, transient-error policy, and network recovery handling
- UUID idempotency enforced by a partial unique Postgres index
- Signed patient, ASHA, doctor, and administrator demo roles with server-tested permission boundaries
- Appointment confirmation/cancellation/rescheduling API, audit events, and in-app notification records
- ASHA field visits and referrals, doctor/admin authorized context, and a transparent synthetic-demand staffing forecast with held-out MAE
- Installable service-worker app shell plus browser voice-input and read-aloud fallbacks
- Mobile-first accessible interface, unit-tested sync policy, cloud CI, and production Playwright flow

Video consultation remains in a truthful setup-required state because no provider credentials are configured. The demo roles prove server authorization but are not a production identity provider. Never enter real patient or confidential data.

Commands: `npm run dev`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm run seed`. See [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), and [deployment](docs/DEPLOYMENT.md).
