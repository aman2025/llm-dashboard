# Project Structure

## Monorepo Layout

The project is organized as a monorepo with separate client and server directories.

```
llm-dashboard/
├── client/          # React frontend application
├── server/          # Elysia backend API
└── docs/            # Documentation
```

## Server Structure (`/server`)

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Database seeding script
├── src/
│   ├── app.ts            # Elysia app configuration
│   ├── index.ts          # Server entry point
│   ├── config/           # Configuration files
│   ├── lib/              # Shared utilities (prisma, errors, response)
│   ├── modules/          # Feature modules
│   │   ├── chat/         # Chat functionality
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── settings/     # Settings management
│   │       ├── models.ts
│   │       ├── service.ts
│   │       └── index.ts
│   └── routes/           # API route definitions
├── .env.development      # Development environment variables
├── .env.production       # Production environment variables
└── tsconfig.json         # TypeScript configuration
```

### Backend Architecture Patterns

- **Module-based organization**: Each feature is a self-contained module
- **Service layer pattern**: Business logic in service files, HTTP handling in controllers
- **Centralized error handling**: AppError class with global error handler
- **Response wrapping**: Consistent API response format via wrapResponse utility
- **Path aliases**: Use `@/*` for imports from `src/` directory

## Client Structure (`/client`)

```
client/
├── src/
│   ├── index.html        # HTML entry point
│   ├── index.ts          # Application entry point
│   ├── client.tsx        # React root renderer
│   ├── app.tsx           # App component with providers
│   ├── api/              # API client configuration
│   │   ├── axios.ts      # Axios instance
│   │   └── endpoints/    # API endpoint functions
│   ├── components/       # Shared components
│   │   ├── layout/       # Layout components (header, layout)
│   │   ├── providers/    # React context providers
│   │   └── ui/           # Reusable UI components (shadcn-style)
│   ├── modules/          # Feature modules
│   │   ├── ai-chat/      # Chat interface module
│   │   │   ├── api/      # Chat-specific API calls
│   │   │   ├── components/  # Chat UI components
│   │   │   ├── hooks/    # Chat-specific hooks
│   │   │   └── index.tsx # Module entry
│   │   ├── dashboard/    # Dashboard module
│   │   └── settings/     # Settings module
│   ├── routes/           # Router configuration
│   ├── stores/           # Zustand state stores
│   └── lib/              # Utility functions
├── styles/
│   └── globals.css       # Global styles and Tailwind imports
├── build.ts              # Custom build script
└── tsconfig.json         # TypeScript configuration
```

### Frontend Architecture Patterns

- **Module-based organization**: Features organized as self-contained modules
- **Component co-location**: Components, hooks, and API calls grouped by feature
- **Shared UI components**: Reusable components in `components/ui/` (Radix UI + Tailwind)
- **Centralized state**: Zustand stores in `stores/` directory
- **API layer separation**: API calls abstracted in `api/` directories
- **Path aliases**: Use `@/*` for imports from `src/` directory

## Naming Conventions

- **Files**: kebab-case for all files (e.g., `chat-store.ts`, `use-settings.ts`)
- **Components**: PascalCase for React components (e.g., `ChatPanel.tsx`, `MessageBubble.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useChatStream.ts`, `useChatSessions.ts`)
- **Types/Interfaces**: PascalCase (defined in `types.ts` or `models.ts` files)
- **Constants**: UPPER_SNAKE_CASE for true constants

## Import Conventions

- Use path aliases (`@/*`) instead of relative imports for cleaner code
- Group imports: external packages → internal modules → types
- Prefer named exports over default exports for better refactoring support
