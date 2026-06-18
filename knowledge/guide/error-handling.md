# Error Codes Handling manual
The server logs operational faults mapped by code blocks:
- `ERR001: 500 Connection Failed` - Database is offline. Double-check `database-setup.md`.
- `ERR002: 401 Unauthorized` - Invalid JWT parsing. See `auth-flow.md` or inspect `jwt-config.md`.
All telemetry events route directly to logging. Check `telemetry.md`.