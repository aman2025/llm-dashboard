---
title: Model Parameters
date: 2026-06-11
status: draft
approach: A (extend Settings singleton, debounced slider auto-save, custom range input)
---

# Model Parameters

## Context

The Evaluation page (`client/src/modules/evaluation/index.tsx`) renders a
"Model Parameters" card with three mocked sections: Target Engine (hardcoded
`CURRENT_MODEL`), System Context Prompt (hardcoded string in a read-only
`<div>`), and Max Out Tokens (hardcoded `350` rendered as a static progress
bar). On the server, `server/src/modules/evaluation/service.ts` hardcodes
`SYSTEM_PROMPT` and `max_tokens: 350` into the LLM request payload.

We are wiring all three sections to the database so the user can:

1. See the active LLM that was selected in Settings.
2. Edit the system context prompt; the value is seeded from the server and
   auto-saved on textarea blur.
3. Drag a slider to set the max output tokens, with default 1000 and max 8000,
   debounced auto-save.

## Decisions

- **Storage location:** extend the existing `Settings` singleton (id=1) with
  two nullable columns — `systemPrompt: String?` and `maxTokens: Int?`. The
  `Settings` table already owns app-level config (`activeLlmId`) as a
  singleton, and the two new fields are small enough to live alongside it.
  Null means "no override" and the client/service fall back to defaults
  (1000 for max tokens; an empty string for the prompt; the LLM API itself
  enforces a bound if neither is set).
- **Seed behavior:** `server/prisma/seed.ts` sets concrete values on first
  run (the current hardcoded prompt text and `maxTokens: 1000`). The seed
  uses `upsert` keyed on `id: 1` and updates both the `create` and `update`
  branches so the values are correct on first install and on re-runs. We do
  *not* clobber user-edited values on subsequent `bun run db:seed` calls —
  the seed only fires on first creation.
- **Slider control:** native `<input type="range">` styled to match the
  reference snippet, with the project accent color. No new package added.
- **Auto-save timing:**
  - System prompt: on `onBlur` (per task spec).
  - Max tokens: debounced 400ms after the last `onChange` value (per UX
    decision). The value is shown live while the user drags; the network
    request fires once they pause.
- **Length cap:** system prompt capped at 4000 characters (Zod-enforced
  server-side, textarea client-side). 4000 chars is well over the longest
  practical system prompt and keeps the textarea usable.
- **Extraction:** the "Model Parameters" card is extracted from
  `evaluation/index.tsx` into a new component
  `client/src/modules/evaluation/components/ModelParametersCard.tsx`. The
  parent page already has its own responsibilities (chat panel, JSON
  inspector) and the interactive card is going to grow.

## Data Model

`server/prisma/schema.prisma`:

```prisma
model Settings {
  id             Int       @id @default(autoincrement())
  activeLlmId    String?
  activeLlm      LlmModel? @relation(fields: [activeLlmId], references: [id])
  systemPrompt   String?   // new — replaces hardcoded SYSTEM_PROMPT
  maxTokens      Int?      // new — replaces hardcoded max_tokens: 350
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

Notes:

- Both columns are nullable to support the "no override → use default" path.
- The server-side Zod schema further constrains the shape; the DB only
  enforces nullability.

Migration: `bunx prisma migrate dev --name add_evaluation_params` creates a
single migration adding both columns as nullable.

## Server Module

### `server/src/modules/settings/models.ts`

Extend the Zod `settings` model and add a new `updateEvaluationParams` model:

```ts
export const Models = {
  // ... existing models unchanged ...
  settings: z.object({
    activeLlmId: z.string().nullable(),
    activeLlm: <LlmModel>.nullable(),
    systemPrompt: z.string().nullable(),
    maxTokens: z.number().int().min(1).max(8000).nullable()
  }),
  updateEvaluationParams: z.object({
    systemPrompt: z.string().max(4000).optional(),
    maxTokens: z.number().int().min(1).max(8000).optional()
  })
}

export type UpdateEvaluationParams = z.infer<typeof Models.updateEvaluationParams>
```

The `.refine` to require at least one field is applied at the controller
layer so the service signature stays clean.

### `server/src/modules/settings/service.ts`

- Extend `getSettings()` to return `systemPrompt` and `maxTokens` from the row.
- Add `updateEvaluationParams(input: UpdateEvaluationParams)`:
  - Validates at least one field is provided (otherwise no-op / 400).
  - Updates only the provided fields via `prisma.settings.update`.
  - Returns the updated `Settings` shape (with `activeLlm` included).

### `server/src/modules/settings/index.ts`

Add a new route mounted under the existing `/settings` prefix:

```ts
.patch('/evaluation-params', async ({ body }) => {
  const parseResult = Models.updateEvaluationParams.safeParse(body)
  if (!parseResult.success) {
    throw new AppError('VALIDATION_ERROR', 'Validation failed')
  }
  if (parseResult.data.systemPrompt === undefined &&
      parseResult.data.maxTokens === undefined) {
    throw new AppError('VALIDATION_ERROR', 'No fields to update')
  }
  return await settingsService.updateEvaluationParams(parseResult.data)
})
```

The shape of `GET /` and the existing `PATCH /active-llm` route are
unchanged — they just surface the two new fields.

### `server/src/modules/evaluation/service.ts`

Drop the `SYSTEM_PROMPT` constant and the hardcoded `max_tokens: 350`:

```ts
// removed
const SYSTEM_PROMPT = '...'

// inside stream()
const settings = await settingsService.getSettings()
// ... existing activeLlm checks ...
const systemPrompt = settings.systemPrompt ?? ''
const maxTokens = settings.maxTokens ?? 1000
```

The system message in `llmMessages` is built from `systemPrompt` (empty
string is allowed and yields no system message). The `max_tokens` field in
`requestPayload` is `maxTokens`. The empty-string fallback is intentional —
sending `''` as a system message content is a no-op for most LLM servers
(they ignore empty system messages) and matches the spec's "empty textarea
is allowed" UX choice.

### `server/prisma/seed.ts`

Augment the existing settings upsert:

```ts
await prisma.settings.upsert({
  where: { id: 1 },
  update: {}, // do not clobber user-edited values on re-seed
  create: {
    id: 1,
    activeLlmId: model1.id,
    systemPrompt:
      'You are a high-fidelity local LLM expert optimized to obey negative guidelines and structured tool signatures. Think step-by-step prior to writing the payload return.',
    maxTokens: 1000
  }
})
```

The `update` branch is empty so re-running the seed does not reset a
user's saved prompt / max tokens to the seeded defaults.

## Client Module

### `client/src/modules/settings/api/settings.types.ts`

Extend `Settings` and add a new input type:

```ts
export interface Settings {
  activeLlmId: string | null
  activeLlm: LlmModel | null
  systemPrompt: string | null
  maxTokens: number | null
}

export interface UpdateEvaluationParamsInput {
  systemPrompt?: string
  maxTokens?: number
}
```

### `client/src/modules/settings/api/settings.ts`

Add the new endpoint call:

```ts
export const settingsApi = {
  // ... existing methods unchanged ...
  updateEvaluationParams: (input: UpdateEvaluationParamsInput) =>
    apiClient.patch<Settings>('/settings/evaluation-params', input)
}
```

### `client/src/modules/settings/hooks/use-settings.ts`

Add the mutation hook (co-located with `useSettings` since the endpoint
lives under `/api/settings`):

```ts
export function useUpdateEvaluationParams() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateEvaluationParamsInput) =>
      settingsApi.updateEvaluationParams(input),
    onSuccess: (newSettings) => {
      qc.setQueryData<Settings>(settingsKeys.detail(), newSettings)
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}
```

We use `setQueryData` (not `invalidateQueries`) on success so the card
updates without a refetch round-trip — useful for the slider where the
user is mid-drag.

### New component: `client/src/modules/evaluation/components/ModelParametersCard.tsx`

Extracted from `evaluation/index.tsx`. The component is self-contained and
owns the local-state / debounce logic for both controls.

Props: none (the card pulls `useSettings` and `useUpdateEvaluationParams`
itself).

State:

- `systemPrompt` — local string, initialized from `settings.systemPrompt ?? ''`.
  Re-synced when the upstream `Settings` changes (e.g. another component
  edits it).
- `maxTokens` — local number, initialized from `settings.maxTokens ?? 1000`,
  clamped to `[1, 8000]`. Re-synced similarly.
- `isPromptDirty` — boolean, true when the textarea value differs from the
  upstream value.
- `isPromptSaving` — boolean, tracks the in-flight save.
- `isMaxTokensSaving` — boolean, tracks the in-flight save.

Behavior:

- **Target Engine section** (read-only): renders `activeLlm.name`, plus the
  size + quantization chips. If `activeLlm` is null, show a muted
  "No active model — set one in Settings" line.
- **System Context Prompt**:
  - Controlled `<textarea>` with `maxLength={4000}`.
  - On `onBlur`: if `isPromptDirty` and the trimmed value matches the
    upstream value, no-op. Otherwise call the mutation with
    `{ systemPrompt: trimmedValue }`. Trim leading/trailing whitespace
    before sending.
  - While saving: show a `Loader2` spinner next to the label.
  - On error: revert the local state to the upstream value and surface the
    server message via the mutation's `onError` toast.
  - Empty value is allowed. We send `{ systemPrompt: '' }` (not `null`) to
    the server when the user clears the field; the server stores the
    empty string. The `null` value is reserved for "column not set"
    (i.e. pre-seed) and the eval service treats both as "no system
    message".
- **Max Out Tokens**:
  - Custom-styled range input. `min=1`, `max=8000`, `step=1`,
    `value={maxTokens}`.
  - On `onChange`: update local state immediately. Schedule a 400ms
    debounced save. If the user changes the value again before the timer
    fires, the previous timer is cancelled.
  - Debounce is implemented inline via a `useRef<ReturnType<typeof setTimeout>>`
    and a `useEffect` cleanup — no external debounce hook. The mutation
    fires with `{ maxTokens }` (clamped to `[1, 8000]`).
  - While saving: show a small `Loader2` spinner next to the value.
  - On error: revert the local state to the upstream value and surface
    the server message via the mutation's `onError` toast.

### Slider styling

Match the reference snippet's pattern (native `<input type="range">`):

```tsx
<input
  type="range"
  min={1}
  max={8000}
  step={1}
  value={maxTokens}
  onChange={(e) => setMaxTokens(Number(e.target.value))}
  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded"
/>
```

`accent-indigo-500` (standard Tailwind class) styles the thumb and the
filled portion of the track. `h-1` and `bg-slate-950` give the thin dark
track from the reference. The reference's `accent-indigo-550` is a custom
color from another project — we use the project's actual accent
(`indigo-500` / `--color-space-accent: #6061f5`).

### `client/src/modules/evaluation/index.tsx`

- Delete the `CURRENT_MODEL` and `SYSTEM_PROMPT` constants.
- Delete the entire inline "Model Parameters" card `<div>` (lines 122–166
  in the current file).
- Import and render `<ModelParametersCard />` in its place.
- Drop the now-unused `Sliders` import (the card imports its own).

## Data Flow

1. Page loads → `useSettings()` fetches `GET /api/settings` → response
   includes `systemPrompt` and `maxTokens` → `ModelParametersCard`
   initializes local state from those values (or `''` / `1000` if null).
2. User edits the textarea and tabs out:
   - `onBlur` fires → `isPromptDirty` is true → mutation called →
     `PATCH /api/settings/evaluation-params` → on 2xx, cache is updated via
     `setQueryData` → the local `systemPrompt` matches the upstream →
     `isPromptDirty` becomes false.
3. User drags the slider:
   - `onChange` fires on every move → local `maxTokens` updates
     immediately (live UI) → debounced timer resets.
   - 400ms after the user stops, mutation fires →
     `PATCH /api/settings/evaluation-params` → cache updated.
4. User sends a chat message → `useEvaluationStream.startStream` →
   `POST /api/evaluation/stream` → server reads `settingsService.getSettings()`
   → builds `llmMessages` with the saved `systemPrompt` and
   `requestPayload.max_tokens` with the saved `maxTokens`.

## Error Handling

- 400 `VALIDATION_ERROR` from the server (out-of-range, missing fields,
  too-long prompt): `useUpdateEvaluationParams.onError` emits a toast with
  the server message. The card's local state reverts to the last known
  good value.
- Network / 5xx: global toast via `QueryProvider`'s `mutation.onError`
  (the `onError` in the hook is a no-op for non-`BUSINESS_ERROR` codes, so
  the global handler picks it up).
- Save failure during slider drag: the next debounced save will pick up
  whatever the local state is at that point. The user sees a toast; the
  local thumb does not revert unless we explicitly handle it (we do, per
  the spec above).

## Visual / UX

- **Target Engine card** (Deep Space panel inner section): model name in
  white extra-bold mono, two chips below (size in indigo tint,
  quantization in emerald tint). Empty state: muted "No active model —
  set one in Settings" line in `text-slate-500`.
- **System Context Prompt**: label in slate-400, full-width `<textarea>`,
  `bg-slate-950`, `border-slate-800`, `text-slate-200`, `rounded-lg`,
  `font-sans text-xs leading-relaxed`, `min-h-[90px]`. A small
  `<Loader2 className="w-3 h-3 animate-spin text-slate-400" />` to the
  right of the label while saving.
- **Max Out Tokens**: label row "MAX OUT TOKENS:" left, value right
  (`{maxTokens} tokens`, indigo-400, extra-bold, mono). Slider below with
  the reference styling. A small `<Loader2>` to the right of the value
  while saving.

## Migration

`bunx prisma migrate dev --name add_evaluation_params` adds two nullable
columns. Existing settings rows (id=1) get `null` for both, which the
client and service treat as "use default".

## Files Touched

Server (modified):

- `server/prisma/schema.prisma` — add `systemPrompt` and `maxTokens` columns.
- `server/prisma/migrations/<timestamp>_add_evaluation_params/migration.sql` —
  generated.
- `server/prisma/seed.ts` — populate both fields on the create branch.
- `server/src/modules/settings/models.ts` — extend `settings` Zod model,
  add `updateEvaluationParams`.
- `server/src/modules/settings/service.ts` — extend `getSettings` return,
  add `updateEvaluationParams` method.
- `server/src/modules/settings/index.ts` — add `PATCH /evaluation-params`
  route.
- `server/src/modules/evaluation/service.ts` — drop `SYSTEM_PROMPT` constant,
  read prompt and maxTokens from settings.

Client (modified):

- `client/src/modules/settings/api/settings.types.ts` — extend `Settings`,
  add `UpdateEvaluationParamsInput`.
- `client/src/modules/settings/api/settings.ts` — add `updateEvaluationParams`
  call.
- `client/src/modules/settings/hooks/use-settings.ts` — add
  `useUpdateEvaluationParams` hook.
- `client/src/modules/evaluation/index.tsx` — drop static card, drop
  `CURRENT_MODEL` and `SYSTEM_PROMPT` constants, drop unused `Sliders`
  import, mount `<ModelParametersCard />`.

Client (new):

- `client/src/modules/evaluation/components/ModelParametersCard.tsx` —
  extracted interactive card.

## Out of Scope

- Other LLM knobs (`temperature`, `top_p`) — still hardcoded in
  `evaluation/service.ts` (0.7 / 0.9). The new columns are just system
  prompt and max tokens.
- Per-session params (params are global for now).
- Multi-user or per-user settings (the singleton is shared).
- Migrating the in-memory `SYSTEM_PROMPT` default to a different value —
  the seed value is the current hardcoded text.
- A separate `/settings/evaluation` page — the controls live inside the
  Evaluation page per the existing layout.
