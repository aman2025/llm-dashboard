# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A pure backend Elysia.js API server running on Bun runtime with PostgreSQL database via Prisma ORM. The project follows an MVC-like module pattern with centralized error handling and Zod validation.

## Commands

```bash
bun run dev      # Start development server with watch mode, loads .env.development
bun run start    # Start production server, loads .env.production
bun run seed     # Seed database with initial data (admin user + default settings)
```

## Project Structure

```
my-api-server/
├── prisma/
│   ├── migrations/          # Database migration history
│   ├── schema.prisma        # Data models (User, Settings)
│   └── seed.ts              # Database seeder
├── src/
│   ├── config/              # Environment variable loading
│   ├── lib/
│   │   ├── errors.ts        # AppError class + HTTP status mapping
│   │   └── prisma.ts        # Prisma client singleton
│   ├── modules/
│   │   └── settings/        # Settings feature module
│   │       ├── controller.ts
│   │       ├── service.ts
│   │       ├── types.ts
│   │       ├── validation.ts
│   │       └── index.ts
│   ├── routes/              # Route aggregation
│   ├── types/               # Shared TypeScript types
│   ├── app.ts               # Elysia app composition
│   └── index.ts             # Server entry point
├── .env                     # Base environment defaults
├── .env.development         # Development overrides
├── .env.production          # Production overrides
└── CLAUDE.md
```

## Architecture

### Entry Point
- [src/index.ts](src/index.ts) - Server bootstrap, loads config env
- [src/app.ts](src/app.ts) - Elysia app composition with CORS, error handling, routes

### MVC-like Module Structure
Each feature module lives under `src/modules/<name>/`:
- **controller** - Request handling, Zod validation, response shaping
- **service** - Business logic, database operations
- **types** - TypeScript interfaces for the module
- **validation** - Zod schemas
- **index** - Re-exports controller and types

Current modules:
- `settings/` - User settings (interface language, LLM configuration)

### Supporting Libraries
- [src/lib/prisma.ts](src/lib/prisma.ts) - Prisma client singleton with Pg adapter
- [src/lib/errors.ts](src/lib/errors.ts) - `AppError` class and HTTP status mapping
- [src/config/index.ts](src/config/index.ts) - Environment variable loading and typing
- [src/routes/index.ts](src/routes/index.ts) - Route aggregation
- [src/types/index.ts](src/types/index.ts) - Shared TypeScript types

### Database
- [prisma/schema.prisma](prisma/schema.prisma) - Data models: `User`, `Settings`
- [prisma/seed.ts](prisma/seed.ts) - Seeds admin user and default settings (singleton at id=1)
- [prisma/migrations/](prisma/migrations/) - Migration history

## Environment Configuration

Three env files for different stages:
- `.env` - base defaults
- `.env.development` - local development
- `.env.production` - production deployment

Key variables: `DATABASE_URL` (required), `PORT` (default 3002), `NODE_ENV`

## Code Style

Generate code matching these conventions directly — do not rely on Prettier to fix style afterward:

- 2 space indentation
- 80 character line width
- No semicolons at statement ends
- Single quotes for strings
- No trailing commas in arrays/objects