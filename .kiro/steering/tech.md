# Technology Stack

## Runtime & Build System

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Package Manager**: Bun
- **Build Tool**: Custom build script (client/build.ts)

## Backend Stack

- **Framework**: Elysia (fast web framework for Bun)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod for schema validation
- **CORS**: @elysiajs/cors for cross-origin requests

## Frontend Stack

- **Framework**: React 19
- **Router**: TanStack Router v1
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query) v5 + Axios
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## Code Quality

- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier (single quotes, no semicolons, 2-space tabs)
- **Type Checking**: TypeScript strict mode enabled

## Common Commands

### Server (from `/server` directory)

```bash
# Development with hot reload
bun run dev

# Production
bun run start

# Database seeding
bun run db:seed

# Code formatting
bun run format

# Linting with auto-fix
bun run lint:fix
```

### Client (from `/client` directory)

```bash
# Development with hot reload
bun run dev

# Production build
bun run build

# Production server
bun run start

# Code formatting
bun run format

# Linting with auto-fix
bun run lint:fix
```

## Environment Configuration

- Server uses `.env.development` and `.env.production` files
- Client uses `.env` file
- Environment variables loaded via `--env-file` flag in Bun
