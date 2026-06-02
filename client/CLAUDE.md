## Project Overview

LLM Dashboard client — a React 19 SPA for debugging and monitoring local large language models. Provides chat interface, settings (active LLM model selection), and a dashboard for testing connections to LLM endpoints. The companion backend lives in `../server` (Elysia on Bun). This client is bundled and served by Bun directly (no Vite/webpack).

## Commands

Run from `client/`:

```bash
bun run dev         # Dev server with HMR (Bun serve, src/index.ts → src/index.html)
bun run build       # Production build → dist/ (minified, relative /api/ base URL)
bun run start       # Run production bundle (NODE_ENV=production bun src/index.ts)
bun run format      # Prettier write
bun run lint:fix    # ESLint with auto-fix
bun --hot src/index.ts  # equivalent to dev
```

There is no test runner configured in this package.

## Architecture

### Entry chain

- [src/index.html](src/index.html) — HTML entry, loads `client.tsx` as a module
- [src/index.ts](src/index.ts) — Bun `serve()` that serves `index.html` for all routes (SPA fallback) with HMR in dev
- [src/client.tsx](src/client.tsx) — React root
- [src/app.tsx](src/app.tsx) — App component, wraps in `QueryProvider` and `ToastProvider`, mounts `RouterProvider`

### Module-based feature folders

Each feature lives in [src/modules/](src/modules/) with co-located subfolders:

```
modules/<feature>/
├── api/         # endpoint functions
├── components/  # feature UI
├── hooks/       # feature hooks
└── index.tsx    # module entry (default export = page component)
```

Current modules: `ai-chat/` (chat sessions + streaming), `dashboard/` (LLM connection test panel), `settings/` (model list + active model).

### Routing

[src/routes/router.tsx](src/routes/router.tsx) — TanStack Router code-based config (no file-based router). Three routes mounted under a single `AppLayout` root: `/` (Dashboard), `/chat` (AiChat), `/settings` (Settings).

### Shared layout

[src/components/layout/layout.tsx](src/components/layout/layout.tsx) — `AppLayout` renders `<Header />` + `<Outlet />`. [src/components/layout/header.tsx](src/components/layout/header.tsx) holds the nav links and a hardcoded "VRAM Footprint" badge.

### State

Two Zustand stores in [src/stores/](src/stores/):

- `useChatStore` (persisted to `localStorage` as `chat-storage`) — chat sessions, messages, active session. CRUD-style methods: `createSession`, `deleteSession`, `addMessage`, `updateMessage` (for streaming deltas), `loadSession`.
- `useUiStore` — global UI state (active modal id).

### Data fetching

TanStack Query via [src/components/providers/query-provider.tsx](src/components/providers/query-provider.tsx). Defaults: `staleTime: 60s`, `retry: 1`. Both `queryCache.onError` and `mutation.onError` emit a toast for non-`BUSINESS_ERROR` `ApiRequestError` instances. Queries/mutations can opt out via `meta: { skipGlobalToast: true }`.

Per-feature query hooks live in `modules/<feature>/hooks/` and define local query key factories (see `settingsKeys` in [src/modules/settings/hooks/use-settings.ts](src/modules/settings/hooks/use-settings.ts)).

### API layer

- [src/api/axios.ts](src/api/axios.ts) — single `apiClient` (axios instance) with a unified response interceptor that **unwraps** `{ success: true, data }` envelopes and **rejects** with `ApiRequestError`. All errors are normalized to one of: `BUSINESS_ERROR` (server said `success: false`), `TIMEOUT`, `NETWORK_ERROR`, `HTTP_ERROR`, `FORMAT_ERROR`, `UNKNOWN_ERROR`. The request interceptor has a commented-out bearer token slot — leave it that way until auth is added.
- [src/api/endpoints/](src/api/endpoints/) — endpoint objects (e.g. `settingsApi.get`, `setActiveLlm`) that call `apiClient.get/patch/delete`. Endpoint types live next to the endpoints.
- Streaming is **not** done via axios — chat uses raw `fetch` + `ReadableStream` (see below).

### SSE streaming

The chat feature streams tokens from `${BUN_PUBLIC_BASE_URL}/chat/stream` via `fetch` + `TextDecoder` line splitting `data: {json}` SSE events. Each event may contain `content`, `reasoning`, `done`, or `error`. The stream hook is [src/modules/ai-chat/hooks/useChatStream.ts](src/modules/ai-chat/hooks/useChatStream.ts): it creates a placeholder assistant message, accumulates deltas, then calls `updateMessage` on the zustand store. `AbortController` is stored in a ref to support user-initiated cancellation (`stopStream`). The reasoning field on `ChatMessage` renders via `ReasonBlock` in [src/modules/ai-chat/components/](src/modules/ai-chat/components/).

The dashboard page also uses raw `fetch` against an external LLM endpoint (`http://192.168.2.8:8000/v1/chat/completions`) — see [src/modules/dashboard/index.tsx](src/modules/dashboard/index.tsx). That page is the integration test harness; do not couple it to the chat module.

### Theming

[styles/globals.css](styles/globals.css) defines both standard shadcn-style CSS variables (light + `.dark` overrides) and a custom **Deep Space** palette via `--color-space-*` tokens (sidebar `#16213e`, panel `#10162f`, accent `#6061f5`, etc.). Modules like settings/ai-chat consume the Deep Space tokens via inline `style` props rather than Tailwind utilities. The HTML root has `class="dark"` by default — light mode is not exercised in the UI today.

See [DESIGN.md](DESIGN.md) for the full UI design guidelines — aesthetic direction (Mission Control Dark), color tokens, typography, spacing, component patterns, motion language, and anti-patterns. Consult it before building new UI or modifying visual treatment.

## Build & env

- [build.ts](build.ts) — Bun bundler entry. Scans `src/**/*.html` as entrypoints, applies `bun-plugin-tailwind`, outputs minified bundle to `dist/` with linked sourcemaps. Forces `BUN_PUBLIC_BASE_URL=/api/` in the production build (relative path for deployment).
- [bunfig.toml](bunfig.toml) — registers `bun-plugin-tailwind` for the dev server and exposes `BUN_PUBLIC_*` to the frontend.
- [.env](.env) — dev defaults: `BUN_PUBLIC_BASE_URL=http://localhost:3002/api/`, `NODE_ENV=development`. Server is expected on port 3002.

## Conventions

- 2-space indent, 80-char lines, no semicolons, single quotes, no trailing commas (Prettier-enforced; do not rely on it — write code in this style).
- Files: kebab-case (`chat-store.ts`, `use-settings.ts`).
- React components: PascalCase filenames (`ChatPanel.tsx`).
- Hooks: camelCase with `use` prefix (`useChatStream.ts`).
- Import via `@/*` path alias (maps to `src/*`). Group: external → internal → types. Prefer named exports.
- UI primitives live in [src/components/ui/](src/components/ui/) (Radix + cva). Add new primitives here before consuming them in modules.

## Adding a new feature module

1. Create `src/modules/<name>/` with `api/`, `components/`, `hooks/`, `index.tsx` (default-exporting the page).
2. Add endpoints under `src/api/endpoints/<name>.ts` using `apiClient`.
3. Define a query key factory and `useX` / `useXMutation` hooks in `modules/<name>/hooks/`.
4. Register the route in [src/routes/router.tsx](src/routes/router.tsx).
5. Add a nav entry in [src/components/layout/header.tsx](src/components/layout/header.tsx) `navItems`.
