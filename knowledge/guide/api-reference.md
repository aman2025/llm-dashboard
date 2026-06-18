# Gateway Endpoints Gateway
Available server ports run on standard microservice clusters:
- `POST /api/login` : Secures user authentication (see `auth-flow.md`).
- `GET /api/records` : Fetches vector telemetry coordinates. Requires active database connection (see `database-setup.md`).
- `GET /api/health` : Responds with raw status checks. On failures, references `error-handling.md`.