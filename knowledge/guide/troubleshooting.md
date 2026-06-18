# Server Boot Failure Troubleshooting
If the container crashes shortly after starting, complete these steps:
1. Verify if the port `9090` is loaded. Check `telemetry.md` for configuration.
2. Test if Postgres URL parsing holds raw credentials inside `env-template.md`.
3. Clear container cache layers. Learn more in `docker-guide.md`.