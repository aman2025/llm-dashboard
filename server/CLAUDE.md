# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A pure backend Elysia.js API server running on Bun runtime with PostgreSQL via Prisma ORM (Prisma 7 driver-adapter pattern with `PrismaPg` + `pg.Pool`). The project follows a **module-based MVC pattern** where each feature owns its `controller`, `service`, `types`, and `models` (Zod schemas) under `src/modules/<name>/`. Modules are mounted in [src/routes/index.ts](src/routes/index.ts) under a single `/api` prefix. Centralized error handling converts thrown `AppError`s into a uniform `{ success: false, error }` envelope, with a `global` `onAfterHandle` that wraps successful responses in `{ success: true, data }`.

The upstream LLM endpoint (`http://192.168.2.8:8000/v1/chat/completions`) is **never called directly from the client** — both `chat` and `evaluation` modules proxy streaming traffic through Elysia so the auth key stays server-side. The same pattern applies to the macmon daemon (`http://192.168.2.8:9090/json`) and the omlx server (`http://192.168.2.8:8000/api/status`).

## Commands

```bash
bun run dev      # Start development server with watch mode, loads .env.development
bun run start    # Start production server, loads .env.production
bun run seed     # Seed database with initial data (admin user, default LLM models, default settings, example function schemas)
```

## Project Structure

```
server/
├── prisma/
│   ├── migrations/          # Database migration history
│   ├── schema.prisma        # Data models
│   └── seed.ts              # Database seeder
├── src/
│   ├── config/              # Zod-validated env loading
│   ├── lib/
│   │   ├── errors.ts        # AppError class + code enum
│   │   ├── prisma.ts        # Prisma client singleton (PrismaPg adapter)
│   │   └── response.ts      # wrapResponse / createError + ApiResult<T> type
│   ├── modules/
│   │   ├── chat/            # Persistent chat sessions + LLM streaming
│   │   ├── evaluation/      # Stateless evaluation sandbox + LLM streaming
│   │   ├── function-schemas/# Tool/function definition CRUD
│   │   ├── macmon/          # Proxy to local macmon daemon
│   │   ├── omlx/            # Proxy to local omlx LLM server
│   │   └── settings/        # Active LLM + system prompt + max tokens
│   ├── routes/              # Route aggregation
│   ├── app.ts               # Elysia app composition (CORS, error handling, response wrapping)
│   └── index.ts             # Server entry point
├── .env                     # Base environment defaults
├── .env.development         # Development overrides
├── .env.production          # Production overrides
└── CLAUDE.md
```

## Architecture

### Entry Point
- [src/index.ts](src/index.ts) - Server bootstrap; logs env, hooks `onStart` / `onStop` for Prisma lifecycle.
- [src/app.ts](src/app.ts) - Elysia app composition. Wires `cors()`, the `AppError` handler, the `onAfterHandle({ as: 'global' })` response wrapper (skips `ReadableStream` and any response that already has a `success` field, and explicitly bypasses `/api/chat/stream` and `/api/evaluation/stream`), then mounts `apiRouter`.

### Module Structure (per feature under `src/modules/<name>/`)

Each module owns its slice of the API surface. The exact file mix varies by feature, but the canonical shape is:

- **controller** *(only when request-shape logic is needed, e.g. `chat`)* - request handling, shape-massaging, calls into `service`. Not every module needs one — `macmon` and `omlx` keep their service public.
- **service** - business logic, database operations, outbound `fetch` calls
- **types** - TypeScript interfaces for the module (request/response shapes, LLM stream chunk shapes, etc.)
- **models** - Zod schemas (`Models.create`, `Models.update`, …) for request validation; some modules also export parsing helpers (see `parseDefinition` in [src/modules/function-schemas/models.ts](src/modules/function-schemas/models.ts))
- **index** - Elysia router with `prefix: '/<name>'`; declares routes and binds `body` / `query` / `params` validators

### Modules

| Module | Purpose | Key endpoints |
| --- | --- | --- |
| `settings` | Singleton settings (id=1): active LLM pointer, system prompt, max tokens; LLM model catalogue | `GET /settings`, `GET /settings/llm-models`, `PATCH /settings/active-llm`, `PATCH /settings/evaluation-params` |
| `chat` | Persistent chat sessions backed by Prisma; proxies LLM streaming with per-session message persistence | `GET/POST/DELETE /chat/sessions[/:id[/messages]]`, `POST /chat/stream` (SSE) |
| `evaluation` | Stateless evaluation sandbox: builds messages from caller-supplied history, attaches enabled function schemas as tools, streams the LLM response with `request` / `response` / `metrics` / `content` SSE events | `POST /evaluation/stream` (SSE) |
| `function-schemas` | CRUD for tool/function definitions stored in the DB; the evaluation module reads `getEnabled()` on every stream start to populate `tools` | `GET/POST /function-schemas`, `GET/PATCH/DELETE /function-schemas/:id`, `PATCH /function-schemas/:id/toggle` |
| `macmon` | Thin proxy to the local macmon daemon; CORS-bypass + 2s timeout; throws `AppError('INTERNAL_ERROR', …, 502\|504)` on failure | `GET /macmon/snapshot` |
| `omlx` | Thin proxy to the local omlx LLM server (`/api/status`) with bearer auth + 3s timeout; same `AppError` shape as macmon | `GET /omlx/status` |

### Streaming pattern (chat + evaluation)

Both `chat/stream` and `evaluation/stream` use the same idiom in [src/app.ts](src/app.ts):

1. Set SSE response headers (`text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`, permissive CORS).
2. Build a `ReadableStream` whose `start(controller)`:
   - holds an `AbortController` for the upstream LLM call,
   - sends a 1-second `: keepalive` comment; if `controller.enqueue` throws (client disconnected), abort the upstream fetch,
   - encodes each event as `data: ${JSON.stringify(event)}\n\n`,
   - on terminal error sends `{ error, done: true }` (only if not an `AbortError`).
3. The stream `cancel` hook logs the disconnect.
4. `body` validation enforces the request shape with Elysia's `t.Object(...)` (chat) or Zod-via-`Models` (evaluation, settings).

The Evaluation service additionally re-reads `Settings` and `FunctionSchema` on every request so changes to the system prompt, max-tokens slider, or enabled tools take effect immediately.

### Supporting Libraries
- [src/lib/prisma.ts](src/lib/prisma.ts) - Prisma 7 client singleton with `PrismaPg` adapter over a `pg.Pool`. Dev mode logs `error` + `warn`; prod logs `error` only.
- [src/lib/errors.ts](src/lib/errors.ts) - `AppError` class. The first argument is a code from `'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR'`; the second is the message; the third is the HTTP status (defaults to 500).
- [src/lib/response.ts](src/lib/response.ts) - `wrapResponse<T>(data)`, `createError(msg, details?)`, plus the `ApiResponse` / `ApiError` / `ApiResult<T>` types. The `ApiResult` envelope is what most non-streaming endpoints return.
- [src/config/index.ts](src/config/index.ts) - Zod-validated env: `NODE_ENV` (default `development`), `PORT` (default 3002, coerced 1–65535), `DATABASE_URL` (required URL). Process exits with a flat error if validation fails.
- [src/routes/index.ts](src/routes/index.ts) - Aggregates every module into a single `apiRouter` with `prefix: '/api'`. Add a new module here once its `index.ts` is written.

### Database
- [prisma/schema.prisma](prisma/schema.prisma) - Models: `User`, `Settings`, `LlmModel`, `ChatSession`, `ChatMessage`, `FunctionSchema`. `Settings` is a singleton (id=1) with a nullable `activeLlmId` foreign key to `LlmModel`. `FunctionSchema.parameters` is stored as a JSON string (parsed in the service before being attached to the upstream LLM `tools` payload).
- [prisma/seed.ts](prisma/seed.ts) - Idempotent seed (uses `upsert`). Inserts an admin user, two demo `LlmModel`s, the singleton `Settings` row (with the first model pre-selected and a default system prompt + max tokens), and two example function schemas (`get_weather_forecast`, `calculator_solver`).
- [prisma/migrations/](prisma/migrations/) - History. Recent names: `add_chat_models`, `refactor_settings_with_llm_models`, `add_function_schemas_table`, `add_evaluation_params`.

## Environment Configuration

Three env files for different stages:
- `.env` - base defaults
- `.env.development` - local development
- `.env.production` - production deployment

Key variables (all validated by Zod in [src/config/index.ts](src/config/index.ts)): `DATABASE_URL` (required URL), `PORT` (default 3002), `NODE_ENV` (default `development`).

## Code Style

Generate code matching these conventions directly — do not rely on Prettier to fix style afterward:

- 2 space indentation
- 80 character line width
- No semicolons at statement ends
- Single quotes for strings
- No trailing commas in arrays/objects

## Conventions

- Throw `AppError` with the right code from services/controllers; never `throw new Error('…')` for things that should map to a specific HTTP status. The `app.onError` handler will set the status and wrap the message with `createError(...)`.
- Non-streaming JSON endpoints return `{ success: true, data }` automatically via the global `onAfterHandle`; do **not** wrap responses manually in routes. If a route needs to opt out (e.g. to return a custom shape), set `success` on the response — the wrapper will detect that and pass it through.
- Streaming endpoints (`/api/chat/stream`, `/api/evaluation/stream`) are excluded from the global wrapper by both the `ReadableStream` guard and the explicit path check in `app.ts`. Do not add the `{ success, data }` envelope to stream payloads.
- Bearer auth for the upstream LLM (`API_KEY = 'zr425899'`) is centralized in each proxy service; keep it server-side and never echo it back to the client.
- Module routes are registered with `prefix: '/<name>'` and the prefix is stripped by the barrel. Consumers (the client) always hit `/api/<name>/...`.
