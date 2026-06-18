# Cryptographic JWT Standards
To maximize security under offline operations:
- Signing algorithm context: HS256 hashing format.
- Expiration criteria: 14 days baseline lifespan.
- Verification checks bind strictly to `JWT_SECRET` defined in `env-template.md`.
Refer to `api-reference.md` for login call payloads.