---
title: Function Schemas CRUD
date: 2026-06-10
status: approved
approach: A (new top-level function-schemas feature module)
---

# Function Schemas CRUD

## Context

The Evaluation page (`client/src/modules/evaluation/index.tsx`) currently shows a
"Function Schemas" card populated from a hardcoded `TOOLS` array with a single
entry (`get_weather`). The `+ Add` button is disabled. On the server, the
evaluation service hardcodes a `GET_WEATHER_TOOL` constant that is passed as the
`tools` array in the LLM request.

We are replacing both with a real CRUD feature backed by PostgreSQL, so the
saved/enabled schemas drive the LLM tool list at stream time. The UI matches
the provided mockup: a registration form inside the same card, plus a list of
saved schemas with edit/delete affordances.

## Decisions

- **Module layout:** new top-level `function-schemas` feature module on both
  client and server (Approach A). Reuses the project's established MVC + 3-file
  API split.
- **LLM integration:** enabled schemas from the DB replace the hardcoded
  `GET_WEATHER_TOOL`. The `enabled` flag becomes meaningful (gates whether the
  LLM knows about the tool).
- **JSON validation:** the `parameters` field is validated against the
  OpenAI-compatible JSON-Schema shape — must parse, must have `type: "object"`,
  must have an object `properties` field. Same validation runs on client
  (before submit) and server (Zod schema).
- **Edit/Delete UX:** small pencil + trash icon buttons on the right side of
  each card, visible on hover. Edit reuses the registration form, pre-filled.
  Delete confirms.
- **Seed data:** the two example schemas shown in the mockup
  (`get_weather_forecast`, `calculator_solver`) are seeded on
  `bun run db:seed`.

## Data Model

`server/prisma/schema.prisma`:

```prisma
model FunctionSchema {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  parameters  String   // JSON string of OpenAI tool parameters object
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Notes:

- `name` is unique — OpenAI tool names must be unique within a request, and
  this also serves as a stable identifier for the user.
- `parameters` is stored as `String` (JSON-encoded) rather than `Json` so the
  raw text round-trips byte-for-byte and the user can paste any valid shape.
  We `JSON.parse` it on the server when building the LLM `tools` payload.

## Server Module

`server/src/modules/function-schemas/`:

- `models.ts` — Zod schemas for create / update / toggle / id, plus
  `validateJsonSchema(value)` helper that asserts
  `type === "object"` and `properties` is an object. Exports
  `FunctionSchema`, `CreateFunctionSchemaInput`, `UpdateFunctionSchemaInput`
  types.
- `types.ts` — re-exports types from `models.ts` (keeps the controller/service
  import surface consistent with the rest of the codebase).
- `service.ts` — Prisma calls. Methods:
  - `list({ enabledOnly?: boolean })`
  - `getById(id)`
  - `create(input)`
  - `update(id, input)`
  - `toggle(id)` — flips `enabled` and returns the row
  - `remove(id)`
  - `getEnabled()` — convenience for the evaluation service
- `controller.ts` — wraps service calls with `AppError` translation.
  `getById` / `update` / `toggle` / `remove` all return `AppError('NOT_FOUND', …)`
  when the row does not exist.
- `index.ts` — Elysia router mounted at `/api/function-schemas` (added to
  `server/src/routes/index.ts`).

### Endpoints

| Method | Path                  | Body / Params                | Returns            |
| ------ | --------------------- | ---------------------------- | ------------------ |
| GET    | `/`                   | `?enabled=true` (optional)   | `FunctionSchema[]` |
| GET    | `/:id`                | —                            | `FunctionSchema`   |
| POST   | `/`                   | `CreateFunctionSchemaInput`  | `FunctionSchema`   |
| PATCH  | `/:id`                | `UpdateFunctionSchemaInput`  | `FunctionSchema`   |
| PATCH  | `/:id/toggle`         | —                            | `FunctionSchema`   |
| DELETE | `/:id`                | —                            | `{ success: true }`|

All non-stream responses go through the existing
`onAfterHandle` `wrapResponse` envelope.

### Validation rules

- `name`: required string, 1–64 chars, must match
  `^[a-zA-Z0-9_-]+$` (snake-case / kebab-style identifier — matches OpenAI
  tool naming guidance).
- `description`: required string, 1–500 chars.
- `parameters`: required string. Parsed via `JSON.parse`. Parsed value must be
  a non-null object with `type === "object"` and an object `properties` field.
  On any failure: throw `AppError('VALIDATION_ERROR', …)`.

## Evaluation Service Integration

`server/src/modules/evaluation/service.ts`:

- Remove the `GET_WEATHER_TOOL` constant and the hardcoded `tools: [GET_WEATHER_TOOL]`
  in the request payload.
- Replace with a DB lookup at the top of `stream()`:

  ```ts
  const enabledSchemas = await functionSchemasService.getEnabled()
  const tools = enabledSchemas.map((s) => ({
    type: 'function' as const,
    function: {
      name: s.name,
      description: s.description,
      parameters: JSON.parse(s.parameters) as Record<string, unknown>
    }
  }))
  ```

- `requestPayload.tools = tools` (empty array if none enabled — OpenAI accepts
  this).
- No changes to streaming / SSE event logic.

## Seed

`server/prisma/seed.ts`: add two `upsert` calls after the existing LLM model
seeds:

- `get_weather_forecast` — description "Retrieve live multi-city weather
  conditions, wind metrics, and atmospheric humidity", parameters
  `{ "locations": { "type": "array", "items": { "type": "string" } } }`,
  `enabled: true`.
- `calculator_solver` — description "Executes highly precise double-precision
  floating math equations and matrix coordinates", parameters
  `{ "formula": { "type": "string" }, "steps_required": { "type": "boolean" } }`,
  `enabled: true`.

Upsert is keyed on `name` so re-running the seed is idempotent.

## Client Module

`client/src/modules/function-schemas/`:

- `api/function-schemas.ts` — `functionSchemasApi` object with
  `list({ enabledOnly })`, `get(id)`, `create(input)`, `update(id, input)`,
  `toggle(id)`, `remove(id)`. Uses `apiClient` from `@/api/axios`.
- `api/function-schemas.types.ts` — `FunctionSchema`,
  `CreateFunctionSchemaInput`, `UpdateFunctionSchemaInput`.
- `api/index.ts` — barrel re-export.
- `hooks/useFunctionSchemas.ts`:
  - `functionSchemaKeys = { all: ['function-schemas'], list: (filter?) => [...] }`
  - `useFunctionSchemas(filter?)` — query.
  - `useCreateFunctionSchema()` — mutation; on success invalidates list;
    emits success toast.
  - `useUpdateFunctionSchema()` — mutation; on success invalidates list.
  - `useToggleFunctionSchema()` — mutation; optimistic update on list cache,
    rollback on error.
  - `useDeleteFunctionSchema()` — mutation; optimistic removal, rollback on
    error; emits success toast.
- `components/FunctionSchemasPanel.tsx` — top-level card. Owns the
  `isFormOpen` state. When closed, shows the header and the list. When open,
  shows the form above the list. Renders the header `+ Add` button (or
  `CANCEL` when open).
- `components/FunctionSchemaForm.tsx` — controlled form, identical layout for
  create and edit (takes optional `initialValue` + `onSubmit` callback).
  Client-side JSON validation mirrors the server (parse, check shape). Shows
  inline error text under the parameters textarea. Disables submit while
  pending. The submit button label is "Confirm & Embed Schema" (per the
  mockup).
- `components/FunctionSchemaCard.tsx` — single row:
  - Checkbox bound to `enabled` (calls `useToggleFunctionSchema`).
  - Name (mono, bold), description (sans, muted).
  - JSON preview `<pre>` (visible when `enabled`, per the mockup).
  - On hover: pencil + trash icon buttons on the right. Trash opens a
    `window.confirm` dialog before calling `useDeleteFunctionSchema`.

### Evaluation page changes

`client/src/modules/evaluation/index.tsx`:

- Delete the static `TOOLS` array. `CURRENT_MODEL`, `SYSTEM_PROMPT`, the
  "Model Parameters" card, the chat panel, and the JSON inspector are all out
  of scope and remain untouched.
- Delete the entire inline "Function Schemas Card" `<div>` (lines 186–239 in
  the current file).
- Delete the static `+ Add` button (no replacement — the new card owns its
  own header).
- Import and render `<FunctionSchemasPanel />` in its place.
- Remove the now-unused `Wrench` import.

## Data Flow

1. User clicks `+ Add` → `isFormOpen = true` → form appears.
2. User fills the three fields and clicks "Confirm & Embed Schema":
   - Client validates JSON shape; shows inline error on failure.
   - On success, `POST /api/function-schemas` → on 2xx, mutation invalidates
     `functionSchemaKeys.list()`, form closes, toast.
3. User toggles a checkbox → `PATCH /api/function-schemas/:id/toggle` →
   optimistic update flips `enabled` locally, rollback on error.
4. User clicks edit → form reopens pre-filled → submit calls
   `PATCH /api/function-schemas/:id`.
5. User clicks delete → `window.confirm` → `DELETE /api/function-schemas/:id`
   → optimistic removal.
6. Evaluation page sends a chat message → server's evaluation service fetches
   `functionSchemasService.getEnabled()` → builds `tools` array → sends LLM
   request. Tool-call streaming behavior is unchanged.

## Error Handling

- 400 `VALIDATION_ERROR` from the server: form shows server message inline.
- Network / 5xx: global toast via `QueryProvider`'s `mutation.onError`.
- `ApiRequestError` with `code === 'BUSINESS_ERROR'`: the `onError` handler on
  mutations catches it and emits a toast with the server's message.
- Optimistic mutations (toggle, delete) roll back the cache on error.

## Visual / UX

- Header row: emerald Wrench icon (lucide-react), "Function Schemas" title
  (`text-xs font-bold uppercase tracking-wider font-mono`), `+ Add` button
  (indigo-600 bg, `text-[9px]`, mono, bold, uppercase) on the right. When the
  form is open, the button is replaced with `CANCEL` (border style).
- Form section: subtle border-bottom separator from the list. Section label
  "REGISTER CUSTOM SCHEMA." with a "JSON FORMAT" hint on the right. Each
  field is a labeled input/textarea. Submit button is full-width indigo-600
  below the parameters textarea.
- Card row: same visual treatment as the current static card (rounded-lg
  border, opacity reduction when `!enabled`). Edit/delete icons appear
  on hover; they are 3×3 lucide icons in slate-500 that turn white on hover.
- Empty state: if the list is empty, show a muted "No schemas registered
  yet" line in place of the card list.

## Migration

`bunx prisma migrate dev --name add_function_schemas_table` produces a single
migration creating the `FunctionSchema` table with the unique index on `name`.

## Files Touched

Server (new):

- `server/prisma/schema.prisma` — add `FunctionSchema` model.
- `server/prisma/migrations/<timestamp>_add_function_schemas_table/migration.sql`
  — generated.
- `server/prisma/seed.ts` — seed two example schemas.
- `server/src/modules/function-schemas/models.ts`
- `server/src/modules/function-schemas/types.ts`
- `server/src/modules/function-schemas/service.ts`
- `server/src/modules/function-schemas/controller.ts`
- `server/src/modules/function-schemas/index.ts`
- `server/src/routes/index.ts` — register `functionSchemasRouter`.

Server (modified):

- `server/src/modules/evaluation/service.ts` — drop `GET_WEATHER_TOOL`,
  use `functionSchemasService.getEnabled()`.

Client (new):

- `client/src/modules/function-schemas/api/function-schemas.ts`
- `client/src/modules/function-schemas/api/function-schemas.types.ts`
- `client/src/modules/function-schemas/api/index.ts`
- `client/src/modules/function-schemas/hooks/useFunctionSchemas.ts`
- `client/src/modules/function-schemas/components/FunctionSchemasPanel.tsx`
- `client/src/modules/function-schemas/components/FunctionSchemaForm.tsx`
- `client/src/modules/function-schemas/components/FunctionSchemaCard.tsx`

Client (modified):

- `client/src/modules/evaluation/index.tsx` — drop static `TOOLS`, drop
  inline card, mount `<FunctionSchemasPanel />`, drop unused `Wrench`
  import.

## Out of Scope

- Executing tool calls (still "(no result — tool call passed through, not
  executed)").
- Schema versioning, import/export, search/filter UI, categories.
- Per-session tool selection (all enabled schemas are always sent).
- Auth / multi-user.
- A standalone `/function-schemas` page or sidebar nav entry (the panel
  lives inside the Evaluation page per the mockup).
