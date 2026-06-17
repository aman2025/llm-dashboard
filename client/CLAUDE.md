## Project Overview

LLM Dashboard client — a React 19 SPA for debugging and monitoring local large language models. The app surfaces four feature areas: a **Dashboard** (live macOS + LLM-server telemetry), an **AI Chat** (persistent chat sessions with streaming), an **Evaluation** sandbox (model parameter + tool/function testing with full request/response inspection), and **Settings** (active LLM selection + model catalogue). The companion backend lives in `../server` (Elysia on Bun). This client is bundled and served by Bun directly (no Vite/webpack).

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

Current modules:

- `dashboard/` — live macOS + LLM-server telemetry (macmon system metrics, omlx server stats)
- `ai-chat/` — persistent chat sessions + streaming
- `evaluation/` — model parameter editor + tool-call sandbox with raw request/response inspector
- `function-schemas/` — CRUD UI for tool/function definitions consumed by the Evaluation sandbox
- `settings/` — model catalogue + active model selection + system prompt / max-tokens editor

### Routing

[src/routes/router.tsx](src/routes/router.tsx) — TanStack Router code-based config (no file-based router). Four routes mounted under a single `AppLayout` root: `/` (Dashboard), `/chat` (AiChat), `/evaluation` (Evaluation), `/settings` (Settings).

### Shared layout

[src/components/layout/layout.tsx](src/components/layout/layout.tsx) — `AppLayout` renders `<Header />` + `<Outlet />`. [src/components/layout/header.tsx](src/components/layout/header.tsx) holds the nav links and a hardcoded "VRAM Footprint" badge. Nav items: Dashboard, AI Chat, Evaluation, Settings.

### State

Two Zustand stores in [src/stores/](src/stores/):

- `useChatStore` (persisted to `localStorage` as `chat-storage`) — chat sessions, messages, active session. CRUD-style methods: `createSession`, `deleteSession`, `addMessage`, `updateMessage` (for streaming deltas), `loadSession`.
- `useUiStore` — global UI state (active modal id).

The Evaluation page keeps its own transient message + stream state in component state (`useState`); it is not persisted.

### Data fetching

TanStack Query via [src/components/providers/query-provider.tsx](src/components/providers/query-provider.tsx). Defaults: `staleTime: 60s`, `retry: 1`. Both `queryCache.onError` and `mutation.onError` emit a toast for non-`BUSINESS_ERROR` `ApiRequestError` instances. Queries/mutations can opt out via `meta: { skipGlobalToast: true }`.

Per-feature query hooks live in `modules/<feature>/hooks/` and define local query key factories — e.g. `settingsKeys` in [src/modules/settings/hooks/use-settings.ts](src/modules/settings/hooks/use-settings.ts), `functionSchemaKeys` in [src/modules/function-schemas/hooks/useFunctionSchemas.ts](src/modules/function-schemas/hooks/useFunctionSchemas.ts). The `useUpdateEvaluationParams` mutation updates the cached `Settings` document in place.

### API layer

- [src/api/axios.ts](src/api/axios.ts) — single `apiClient` (axios instance) with a unified response interceptor that **unwraps** `{ success: true, data }` envelopes and **rejects** with `ApiRequestError`. All errors are normalized to one of: `BUSINESS_ERROR` (server said `success: false`), `TIMEOUT`, `NETWORK_ERROR`, `HTTP_ERROR`, `FORMAT_ERROR`, `UNKNOWN_ERROR`. The request interceptor has a commented-out bearer token slot — leave it that way until auth is added.
- **Endpoint functions are co-located with their module** at `src/modules/<feature>/api/`, following a 3-file split per endpoint:
  - `<endpoint>.ts` — the endpoint object (e.g. `chatApi` in [src/modules/ai-chat/api/chat.ts](src/modules/ai-chat/api/chat.ts), `settingsApi` in [src/modules/settings/api/settings.ts](src/modules/settings/api/settings.ts)). Calls `apiClient` from `@/api/axios`.
  - `<endpoint>.types.ts` — request/response interfaces only (e.g. `ChatMessage`, `SessionListItem` in [src/modules/ai-chat/api/chat.types.ts](src/modules/ai-chat/api/chat.types.ts)). Imported by `<endpoint>.ts` via `import type { ... } from './<endpoint>.types'`. Keeps the implementation file free of type bodies.
  - `index.ts` — barrel that re-exports both: `export { <endpoint>Api } from './<endpoint>'` and `export type { ... } from './<endpoint>.types'`. Consumers should import from `@/modules/<feature>/api` (the barrel) rather than reaching into the implementation file — see [src/modules/ai-chat/api/index.ts](src/modules/ai-chat/api/index.ts) and [src/modules/settings/api/index.ts](src/modules/settings/api/index.ts).
    `src/api/` is reserved for shared infrastructure (the axios client and its error normalization) — no endpoint files live there.
- Streaming is **not** done via axios — both chat and evaluation use raw `fetch` + `ReadableStream` (see below). The Dashboard polls via axios (see below).

### SSE streaming

Two streaming endpoints are consumed by the client; both use raw `fetch` + `TextDecoder` line splitting of `data: {json}` SSE events, with a 1-second keepalive comment cadence. `AbortController` is held in a ref to support user-initiated cancellation.

- **Chat** — `${BUN_PUBLIC_BASE_URL}/chat/stream` via [src/modules/ai-chat/hooks/useChatStream.ts](src/modules/ai-chat/hooks/useChatStream.ts). Each event may contain `content`, `reasoning`, `done`, `error`, or `sessionId`. The hook creates a placeholder assistant message, accumulates deltas, then commits the final message to the zustand `useChatStore` via `updateMessage`. The reasoning field on `ChatMessage` renders via `ReasonBlock` in [src/modules/ai-chat/components/](src/modules/ai-chat/components/).
- **Evaluation** — `${BUN_PUBLIC_BASE_URL}/evaluation/stream` via [src/modules/evaluation/hooks/useEvaluationStream.ts](src/modules/evaluation/hooks/useEvaluationStream.ts). Events may carry `content` (token deltas), `request` (echoed outgoing payload), `response` (final aggregated chat-completion response), `metrics` (TTFT, prompt/generation tok/s, token counts), `done`, or `error`. The hook surfaces `lastRequest`, `lastResponse`, and `lastMetrics` to the page for the JSON inspector; accumulated content is delivered via `onContent` / `onComplete` callbacks. The page renders both the request and response payloads in a side-by-side inspector, plus five metric tiles (input tokens, output tokens, TTFT, prompt tok/s, generation tok/s).

### Dashboard telemetry polling

The Dashboard is no longer a chat integration test harness. It polls two backend endpoints via `apiClient` (axios) and renders them as live cards with manual refresh + a 28s auto-refresh interval:

- `GET /api/macmon/snapshot` — proxied macmon daemon (CPU/GPU/memory, SoC specs, thermals, power draw). See `macmonApi` in [src/modules/dashboard/api/macmon.ts](src/modules/dashboard/api/macmon.ts) and the `MacmonSnapshot` type in [src/modules/dashboard/api/macmon.types.ts](src/modules/dashboard/api/macmon.types.ts).
- `GET /api/omlx/status` — proxied omlx LLM server (uptime, loaded models, request/token counts, VRAM usage, prefill/decode tok/s). See `omlxApi` in [src/modules/dashboard/api/omlx.ts](src/modules/dashboard/api/omlx.ts) and the `OmlxStatus` type in [src/modules/dashboard/api/omlx.types.ts](src/modules/dashboard/api/omlx.types.ts).

The page mounts in [src/modules/dashboard/index.tsx](src/modules/dashboard/index.tsx); it uses two `useState` + `useEffect` polling loops, not TanStack Query, because the metrics are time-series and the 28s cadence already exceeds the default `staleTime`. Connection errors render an explicit "Connection Lost" card with the proxy path exposed for debugging.

### Evaluation sandbox

The Evaluation page composes three pieces:

- [src/modules/evaluation/index.tsx](src/modules/evaluation/index.tsx) — two-column layout: left = `ModelParametersCard` + `FunctionSchemasPanel`, right = chat sandbox + raw request/response inspector with metric tiles.
- [src/modules/evaluation/components/ModelParametersCard.tsx](src/modules/evaluation/components/ModelParametersCard.tsx) — shows the active LLM (read-only), an auto-saving system prompt textarea (saves on blur), and a debounced `Max Out Tokens` slider (1–8000, 400ms debounce). Both writes use the `useUpdateEvaluationParams` mutation and revert local state on error.
- [src/modules/evaluation/hooks/useEvaluationStream.ts](src/modules/evaluation/hooks/useEvaluationStream.ts) — see SSE streaming above. Each `handleSend` keeps the local in-memory message history (not persisted) and rebuilds the `history` payload for the server on every call.

The function-schemas panel reuses components from [src/modules/function-schemas/components/](src/modules/function-schemas/components/); schemas are fetched via `useFunctionSchemas` and toggled with `useToggleFunctionSchema`.

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
2. Add an endpoint triple under `src/modules/<name>/api/` — `<endpoint>.ts` (the api object, calling `apiClient` from `@/api/axios`), `<endpoint>.types.ts` (request/response interfaces, imported by `<endpoint>.ts` as `import type`), and `index.ts` (barrel re-export of both). Do **not** add files to `src/api/endpoints/` — that directory does not exist; endpoints are co-located with the module. If the module streams, you can either expose the URL from a `<endpoint>.ts` (see `evaluationApi.getStreamUrl()` in [src/modules/evaluation/api/evaluation.ts](src/modules/evaluation/api/evaluation.ts)) and consume it with raw `fetch` from a `useXStream` hook.
3. Define a query key factory and `useX` / `useXMutation` hooks in `modules/<name>/hooks/`.
4. Register the route in [src/routes/router.tsx](src/routes/router.tsx).
5. Add a nav entry in [src/components/layout/header.tsx](src/components/layout/header.tsx) `navItems`.
