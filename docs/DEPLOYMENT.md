# Deployment

Vercel production and preview require managed `DATABASE_URL` and high-entropy `AUTH_SECRET` variables. IndexedDB data remains on each browser and is never treated as synchronized until the API acknowledges it. The application is not an emergency, diagnostic, or regulated-care system.

GitHub CI runs lint, unit tests, type checking, and the production build. The manual **Production E2E** workflow installs Chromium in GitHub and creates a synthetic appointment through the public deployment.
