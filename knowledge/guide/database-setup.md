# Database Configuration Guidelines
To link your physical database context with the server runtime, execute:
Step 1: Declare physical storage endpoints. Set `POSTGRES_URL` inside your `.env` file.
        For schema configurations, read `env-template.md`.
Step 2: Initialize migrations with command `bun migration` inside the root directory.
Step 3: Test connection pools using active telemetry services. See `telemetry.md`.