# Authentication Protocol Routing
This system authenticates API endpoints using JWT (JSON Web Tokens).
Workflow:
1. Client POSTs credentials to `/api/login` gateway.
2. Server validates weights & issues token signed using `JWT_SECRET` located in `.env`.
3. Secret requirements and expiration details are listed in `jwt-config.md`.