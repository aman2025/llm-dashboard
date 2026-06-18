# Environment Variables Template (.env)
Use this standard format for sandbox local variables:
```env
POSTGRES_URL=postgresql://postgres:pass@localhost:5432/db_core
JWT_SECRET=auth_cryptographic_sign_token_secret_key_v1
TELEMETRY_PORT=9090
HOST_IP=0.0.0.0
```
Refer to `jwt-config.md` for token hashing security routines.