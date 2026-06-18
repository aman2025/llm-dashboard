# Deployment Docker Compose Recipes
Deploy the local workspace container stack within 2.0 seconds:
```bash
docker-compose down && docker-compose up -d --build
```
Environment values will automatically sync from the root `.env` template.