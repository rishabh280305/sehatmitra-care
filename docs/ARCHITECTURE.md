# Architecture

Next.js route handlers verify the signed demo session and validate synthetic appointment input. Neon stores requests in the `sehatmitra` schema. The client generates a UUID per submission; the database enforces uniqueness per user so retries cannot create duplicate appointments.

When offline or after a network exception, the payload and UUID are stored in IndexedDB. Browser network events trigger a bounded FIFO synchronization pass. Successful items are removed, transient failures remain with an incremented attempt count, authentication failures pause the queue, and permanent validation failures are discarded rather than retried forever.

The signed session payload includes one of four fixed synthetic roles. Central permission helpers are unit tested and every sensitive route repeats its role check server-side. Appointment mutations and field visits append audit rows; mutations also create owner notifications. The staffing module evaluates a seven-day rolling baseline on a fourteen-day holdout before forecasting, and labels its deterministic demand history synthetic.

The PWA service worker caches the application shell and uses network-first GET handling. Appointment writes remain in the dedicated IndexedDB outbox rather than being intercepted opaquely. Browser speech APIs are progressive enhancement only; typed input and visible text always remain available. Video is disabled with a setup-required message until a consent-capable provider is configured.

Profiles store only synthetic aliases, broad age bands, language preference, and an explicit sharing choice. Patient sessions see only their own profile rows; care roles receive operational scope. Capacity is a dated per-role upsert controlled by administrators, and both profile and capacity changes append audit events.
