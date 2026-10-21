# Architecture

Next.js route handlers verify the signed demo session and validate synthetic appointment input. Neon stores requests in the `sehatmitra` schema. The client generates a UUID per submission; the database enforces uniqueness per user so retries cannot create duplicate appointments.

When offline or after a network exception, the payload and UUID are stored in IndexedDB. Browser network events trigger a bounded FIFO synchronization pass. Successful items are removed, transient failures remain with an incremented attempt count, authentication failures pause the queue, and permanent validation failures are discarded rather than retried forever.
