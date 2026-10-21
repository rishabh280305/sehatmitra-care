# SehatMitra Care

SehatMitra is an offline-first healthcare coordination portfolio application. It uses synthetic aliases only and makes no diagnostic or regulatory-compliance claims.

## Verified capabilities

- Signed demo access and persistent synthetic appointment requests
- Browser IndexedDB outbox with observable online/offline and pending state
- Automatic/manual retry, transient-error policy, and network recovery handling
- UUID idempotency enforced by a partial unique Postgres index
- Mobile-first accessible interface, unit-tested sync policy, cloud CI, and production Playwright flow

Four-role authorization, patient histories, video, voice, forecasts, and notifications remain explicitly future scope. Never enter real patient or confidential data.

Commands: `npm run dev`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm run seed`. See [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), and [deployment](docs/DEPLOYMENT.md).
