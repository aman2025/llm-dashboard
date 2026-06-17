# Model Parameters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Evaluation page's "Model Parameters" card (Target Engine, System Context Prompt, Max Out Tokens) to a persisted, editable settings store with a debounced slider and a blur-saving textarea.

**Architecture:** Extend the existing `Settings` singleton with two nullable columns (`systemPrompt`, `maxTokens`). Add a `PATCH /api/settings/evaluation-params` endpoint. The Evaluation service reads both fields at stream time. The client extracts the card into `ModelParametersCard.tsx` with local-state + 400ms debounce for the slider and on-blur save for the textarea.

**Tech Stack:** Elysia (Bun), Prisma + PostgreSQL, React 19 + TanStack Query, native `<input type="range">` for the slider, Zod for validation.

**Note on testing:** This project has no test runner configured (per `client/CLAUDE.md` and the absence of a `test` script in `server/package.json`). Verification uses `bun build` (typecheck + bundle) for the client and `bun build` for the server. The `bun run dev` / `bun run format` / `bun run lint:fix` commands are not invoked in this plan.

---

## File Structure

### New files

- `server/prisma/migrations/<timestamp>_add_evaluation_params/migration.sql` — Prisma-generated migration.
- `client/src/modules/evaluation/components/ModelParametersCard.tsx` — extracted interactive card.

### Modified files

**Server:**
- `server/prisma/schema.prisma` — add `systemPrompt` and `maxTokens` to `Settings`.
- `server/prisma/seed.ts` — populate the new fields on the create branch.
- `server/src/modules/settings/models.ts` — extend `settings` Zod model; add `updateEvaluationParams`.
- `server/src/modules/settings/service.ts` — extend `getSettings`; add `updateEvaluationParams`.
- `server/src/modules/settings/index.ts` — add `PATCH /evaluation-params` route.
- `server/src/modules/evaluation/service.ts` — drop hardcoded `SYSTEM_PROMPT` and `max_tokens: 350`.

**Client:**
- `client/src/modules/settings/api/settings.types.ts` — extend `Settings`; add `UpdateEvaluationParamsInput`.
- `client/src/modules/settings/api/settings.ts` — add `updateEvaluationParams` API call.
- `client/src/modules/settings/hooks/use-settings.ts` — add `useUpdateEvaluationParams` hook.
- `client/src/modules/evaluation/index.tsx` — drop the static card; mount `<ModelParametersCard />`; remove unused imports.

---

## Task 1: Add columns to Prisma schema and generate migration

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add the two new columns to the `Settings` model**

Open `server/prisma/schema.prisma` and replace the `Settings` model block (currently lines 18-24) with:

```prisma
model Settings {
  id             Int       @id @default(autoincrement())
  activeLlmId    String?
  activeLlm      LlmModel? @relation(fields: [activeLlmId], references: [id])
  systemPrompt   String?
  maxTokens      Int?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

- [ ] **Step 2: Generate the Prisma migration**

Run from `server/`:

```bash
bun run db:migrate:dev --name add_evaluation_params
```

Expected: a new directory is created under `server/prisma/migrations/` whose name ends with `_add_evaluation_params/`, containing a `migration.sql` with two `ALTER TABLE` statements adding the `systemPrompt` and `maxTokens` columns as nullable. The Prisma client is regenerated automatically.

- [ ] **Step 3: Verify the migration file is correct**

Run:

```bash
ls server/prisma/migrations/ | tail -5
```

Expected: the most recent directory name ends with `_add_evaluation_params`. Then read the generated `migration.sql` and confirm it contains `ADD COLUMN "systemPrompt" TEXT` and `ADD COLUMN "maxTokens" INTEGER` (nullable by default).

- [ ] **Step 4: Verify the server still type-checks**

Run from `server/`:

```bash
bun build src/index.ts --target=bun --outdir=/tmp/server-build-check
```

Expected: build completes with no errors. The directory `/tmp/server-build-check/` now contains `index.js`. (Clean up afterwards with `rm -rf /tmp/server-build-check`.)

- [ ] **Step 5: Commit**

```bash
cd server && git add prisma/schema.prisma prisma/migrations/ && git commit -m "feat(db): add systemPrompt and maxTokens to Settings"
```

---

## Task 2: Extend server settings Zod models

**Files:**
- Modify: `server/src/modules/settings/models.ts`

- [ ] **Step 1: Replace the file contents**

Open `server/src/modules/settings/models.ts` and replace the entire file with:

```ts
import { z } from 'zod'

const llmModelFields = {
  id: z.string(),
  name: z.string(),
  size: z.string(),
  type: z.string(),
  description: z.string(),
  fileSize: z.string(),
  quantization: z.string(),
  contextWindow: z.string(),
  isActive: z.boolean()
}

export const Models = {
  llmModel: z.object(llmModelFields),
  settings: z.object({
    activeLlmId: z.string().nullable(),
    activeLlm: z.object(llmModelFields).nullable(),
    systemPrompt: z.string().nullable(),
    maxTokens: z.number().int().min(1).max(8000).nullable()
  }),
  updateActiveLlm: z.object({
    llmId: z.string()
  }),
  updateEvaluationParams: z
    .object({
      systemPrompt: z.string().max(4000).optional(),
      maxTokens: z.number().int().min(1).max(8000).optional()
    })
    .refine(
      (data) =>
        data.systemPrompt !== undefined || data.maxTokens !== undefined,
      { message: 'At least one field must be provided' }
    )
}

export type LlmModel = z.infer<typeof Models.llmModel>
export type Settings = z.infer<typeof Models.settings>
export type UpdateActiveLlm = z.infer<typeof Models.updateActiveLlm>
export type UpdateEvaluationParams = z.infer<typeof Models.updateEvaluationParams>
```

Notes:
- The duplicated LLM model field object is collapsed into a single `llmModelFields` const. The `settings` shape now also includes `systemPrompt` and `maxTokens`.
- `updateEvaluationParams` uses `.refine` to require at least one field. This avoids the controller needing to do that check separately.

- [ ] **Step 2: Verify the server type-checks**

Run from `server/`:

```bash
bun build src/index.ts --target=bun --outdir=/tmp/server-build-check
```

Expected: build completes with no errors. Clean up with `rm -rf /tmp/server-build-check`.

- [ ] **Step 3: Commit**

```bash
cd server && git add src/modules/settings/models.ts && git commit -m "feat(server): extend settings Zod models with evaluation params"
```

---

## Task 3: Extend server settings service

**Files:**
- Modify: `server/src/modules/settings/service.ts`

- [ ] **Step 1: Replace the file contents**

Open `server/src/modules/settings/service.ts` and replace the entire file with:

```ts
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type {
  LlmModel,
  Settings,
  UpdateEvaluationParams
} from './models'

function toSettings(row: {
  id: number
  activeLlmId: string | null
  systemPrompt: string | null
  maxTokens: number | null
  activeLlm: {
    id: string
    name: string
    size: string
    type: string
    description: string
    fileSize: string
    quantization: string
    contextWindow: string
    isActive: boolean
  } | null
}): Settings {
  return {
    activeLlmId: row.activeLlmId,
    activeLlm: row.activeLlm,
    systemPrompt: row.systemPrompt,
    maxTokens: row.maxTokens
  }
}

export async function getSettings(): Promise<Settings> {
  let row = await prisma.settings.findUnique({
    where: { id: 1 },
    include: { activeLlm: true }
  })

  if (!row) {
    row = await prisma.settings.create({
      data: { id: 1 },
      include: { activeLlm: true }
    })
  }

  return toSettings(row)
}

export async function getAllLlmModels(): Promise<LlmModel[]> {
  const models = await prisma.llmModel.findMany({
    orderBy: { createdAt: 'asc' }
  })

  return models.map((model) => ({
    id: model.id,
    name: model.name,
    size: model.size,
    type: model.type,
    description: model.description,
    fileSize: model.fileSize,
    quantization: model.quantization,
    contextWindow: model.contextWindow,
    isActive: model.isActive
  }))
}

export async function setActiveLlm(llmId: string): Promise<Settings> {
  const llm = await prisma.llmModel.findUnique({ where: { id: llmId } })

  if (!llm) {
    throw new AppError('NOT_FOUND', `LLM model with id "${llmId}" not found`)
  }

  await prisma.llmModel.updateMany({ data: { isActive: false } })

  await prisma.llmModel.update({
    where: { id: llmId },
    data: { isActive: true }
  })

  const row = await prisma.settings.update({
    where: { id: 1 },
    data: { activeLlmId: llmId },
    include: { activeLlm: true }
  })

  return toSettings(row)
}

export async function updateEvaluationParams(
  input: UpdateEvaluationParams
): Promise<Settings> {
  const data: { systemPrompt?: string; maxTokens?: number } = {}
  if (input.systemPrompt !== undefined) data.systemPrompt = input.systemPrompt
  if (input.maxTokens !== undefined) data.maxTokens = input.maxTokens

  const row = await prisma.settings.update({
    where: { id: 1 },
    data,
    include: { activeLlm: true }
  })

  return toSettings(row)
}

export const settingsService = {
  getSettings,
  getAllLlmModels,
  setActiveLlm,
  updateEvaluationParams
} as const
```

- [ ] **Step 2: Verify the server type-checks**

Run from `server/`:

```bash
bun build src/index.ts --target=bun --outdir=/tmp/server-build-check
```

Expected: build completes with no errors. Clean up with `rm -rf /tmp/server-build-check`.

- [ ] **Step 3: Commit**

```bash
cd server && git add src/modules/settings/service.ts && git commit -m "feat(server): add updateEvaluationParams to settings service"
```

---

## Task 4: Add PATCH /settings/evaluation-params route

**Files:**
- Modify: `server/src/modules/settings/index.ts`

- [ ] **Step 1: Append the new route**

Open `server/src/modules/settings/index.ts`. The current file ends with the `setActiveLlm` patch route. After that route (but still inside the same `.patch(...)` chain — no, that won't work for a separate route; Elysia chains return an `Elysia` instance, so we add a new `.patch` call on the result).

Replace the file contents with:

```ts
import { Elysia } from 'elysia'
import { settingsService } from './service'
import { Models } from './models'
import { AppError } from '@/lib/errors'

export const settingsRouter = new Elysia({ prefix: '/settings' })
  .get('/', async () => {
    return await settingsService.getSettings()
  })
  .get('/llm-models', async () => {
    return await settingsService.getAllLlmModels()
  })
  .patch('/active-llm', async ({ body }) => {
    const parseResult = Models.updateActiveLlm.safeParse(body)
    if (!parseResult.success) {
      throw new AppError('VALIDATION_ERROR', 'Validation failed')
    }
    return await settingsService.setActiveLlm(parseResult.data.llmId)
  })
  .patch('/evaluation-params', async ({ body }) => {
    const parseResult = Models.updateEvaluationParams.safeParse(body)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new AppError(
        'VALIDATION_ERROR',
        firstIssue?.message ?? 'Validation failed'
      )
    }
    return await settingsService.updateEvaluationParams(parseResult.data)
  })
```

- [ ] **Step 2: Verify the server type-checks**

Run from `server/`:

```bash
bun build src/index.ts --target=bun --outdir=/tmp/server-build-check
```

Expected: build completes with no errors. Clean up with `rm -rf /tmp/server-build-check`.

- [ ] **Step 3: Commit**

```bash
cd server && git add src/modules/settings/index.ts && git commit -m "feat(server): add PATCH /settings/evaluation-params route"
```

---

## Task 5: Update server seed

**Files:**
- Modify: `server/prisma/seed.ts`

- [ ] **Step 1: Update the settings upsert block**

Open `server/prisma/seed.ts`. The current settings upsert is at the end of the `main()` function (after the two LLM model upserts). Replace the existing `// Seed default settings (singleton)` block (currently lines 57-65) with:

```ts
  // Seed default settings (singleton)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      activeLlmId: model1.id,
      systemPrompt:
        'You are a high-fidelity local LLM expert optimized to obey negative guidelines and structured tool signatures. Think step-by-step prior to writing the payload return.',
      maxTokens: 1000
    }
  })
```

Note: the `update` branch is intentionally empty so re-running the seed does not clobber user-edited values. Only the `create` branch sets the new fields (used on first install).

- [ ] **Step 2: Verify the server type-checks**

Run from `server/`:

```bash
bun build prisma/seed.ts --target=bun --outdir=/tmp/seed-build-check
```

Expected: build completes with no errors. Clean up with `rm -rf /tmp/seed-build-check`.

- [ ] **Step 3: Commit**

```bash
cd server && git add prisma/seed.ts && git commit -m "feat(db): seed default systemPrompt and maxTokens"
```

---

## Task 6: Update server evaluation service to read from settings

**Files:**
- Modify: `server/src/modules/evaluation/service.ts`

- [ ] **Step 1: Drop the hardcoded `SYSTEM_PROMPT` constant**

In `server/src/modules/evaluation/service.ts`, delete the existing `const SYSTEM_PROMPT = '...'` declaration (currently lines 13-14). The file should now start with the imports, the `API_URL`/`API_KEY` constants, and a blank line, before `export const evaluationService`.

- [ ] **Step 2: Read `systemPrompt` and `maxTokens` from settings inside `stream()`**

In the same file, inside `evaluationService.stream` (after the `activeModel` block — i.e. after the `if (!activeModel) { throw ... }` block), add the following two lines:

```ts
      const systemPrompt = settings.systemPrompt ?? ''
      const maxTokens = settings.maxTokens ?? 1000
```

The `settings` variable is already in scope (it's fetched earlier as `const settings = await settingsService.getSettings()`). The new lines should be placed right after the `activeModel` check, before the `llmMessages` array is constructed.

- [ ] **Step 3: Use the new variables in the LLM messages and request payload**

In the same file, replace the `llmMessages` construction (currently hardcoded `{ role: 'system', content: SYSTEM_PROMPT }`) with:

```ts
      const llmMessages: LLMMessage[] = systemPrompt
        ? [
            { role: 'system', content: systemPrompt },
            ...req.history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: req.message }
          ]
        : [
            ...req.history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: req.message }
          ]
```

And replace the `max_tokens: 350` line in `requestPayload` (inside the `requestPayload` object) with:

```ts
        max_tokens: maxTokens,
```

The full `requestPayload` block should now read:

```ts
      const requestPayload = {
        model: activeModel,
        messages: llmMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
        tools
      }
```

- [ ] **Step 4: Verify the server type-checks**

Run from `server/`:

```bash
bun build src/index.ts --target=bun --outdir=/tmp/server-build-check
```

Expected: build completes with no errors. Clean up with `rm -rf /tmp/server-build-check`.

- [ ] **Step 5: Commit**

```bash
cd server && git add src/modules/evaluation/service.ts && git commit -m "feat(evaluation): read systemPrompt and maxTokens from settings"
```

---

## Task 7: Update client settings types

**Files:**
- Modify: `client/src/modules/settings/api/settings.types.ts`

- [ ] **Step 1: Extend the `Settings` interface and add the input type**

Open `client/src/modules/settings/api/settings.types.ts` and replace the file contents with:

```ts
export interface LlmModel {
  id: string
  name: string
  size: string
  type: string
  description: string
  fileSize: string
  quantization: string
  contextWindow: string
  isActive: boolean
}

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

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/settings/api/settings.types.ts && git commit -m "feat(client): extend Settings type and add UpdateEvaluationParamsInput"
```

---

## Task 8: Add client settings API method

**Files:**
- Modify: `client/src/modules/settings/api/settings.ts`

- [ ] **Step 1: Add the `updateEvaluationParams` method**

Open `client/src/modules/settings/api/settings.ts` and replace the file contents with:

```ts
import { apiClient } from '@/api/axios'
import type {
  LlmModel,
  Settings,
  UpdateEvaluationParamsInput
} from './settings.types'

export const settingsApi = {
  /** Get settings */
  get: () => apiClient.get<Settings>('/settings'),

  /** Get all LLM models */
  getAllLlmModels: () => apiClient.get<LlmModel[]>('/settings/llm-models'),

  /** Set active LLM model */
  setActiveLlm: (llmId: string) =>
    apiClient.patch<Settings>('/settings/active-llm', { llmId }),

  /** Update system prompt and/or max output tokens */
  updateEvaluationParams: (input: UpdateEvaluationParamsInput) =>
    apiClient.patch<Settings>('/settings/evaluation-params', input)
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/settings/api/settings.ts && git commit -m "feat(client): add updateEvaluationParams API call"
```

---

## Task 9: Add `useUpdateEvaluationParams` hook

**Files:**
- Modify: `client/src/modules/settings/hooks/use-settings.ts`

- [ ] **Step 1: Add the new hook**

Open `client/src/modules/settings/hooks/use-settings.ts` and replace the file contents with:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emitToast } from '@/components/ui/toaster'
import {
  settingsApi,
  type Settings,
  type LlmModel,
  type UpdateEvaluationParamsInput
} from '@/modules/settings/api'
import { ApiRequestError } from '@/api/axios'

export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => [...settingsKeys.all, 'detail'] as const,
  llmModels: () => [...settingsKeys.all, 'llm-models'] as const
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => settingsApi.get()
  })
}

export function useLlmModels() {
  return useQuery({
    queryKey: settingsKeys.llmModels(),
    queryFn: () => settingsApi.getAllLlmModels()
  })
}

export function useSetActiveLlm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (llmId: string) => settingsApi.setActiveLlm(llmId),
    meta: { skipGlobalToast: true },
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)

      queryClient.setQueryData<LlmModel[]>(
        settingsKeys.llmModels(),
        (oldModels) => {
          if (!oldModels) return oldModels
          return oldModels.map((model) => ({
            ...model,
            isActive: model.id === newSettings.activeLlmId
          }))
        }
      )

      emitToast({ message: 'Active model updated', variant: 'success' })
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}

export function useUpdateEvaluationParams() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateEvaluationParamsInput) =>
      settingsApi.updateEvaluationParams(input),
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}
```

- [ ] **Step 2: Verify the client type-checks**

Run from `client/`:

```bash
bun run build
```

Expected: build completes with no errors. The `dist/` directory is updated.

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/settings/hooks/use-settings.ts && git commit -m "feat(client): add useUpdateEvaluationParams hook"
```

---

## Task 10: Create `ModelParametersCard` component

**Files:**
- Create: `client/src/modules/evaluation/components/ModelParametersCard.tsx`

- [ ] **Step 1: Create the component file**

Create `client/src/modules/evaluation/components/ModelParametersCard.tsx` with the following contents:

```tsx
import { useEffect, useRef, useState } from 'react'
import { Loader2, Sliders } from 'lucide-react'
import { useSettings, useUpdateEvaluationParams } from '@/modules/settings/hooks/use-settings'

const PROMPT_MAX_LENGTH = 4000
const MAX_TOKENS_MIN = 1
const MAX_TOKENS_MAX = 8000
const MAX_TOKENS_DEFAULT = 1000
const DEBOUNCE_MS = 400

function clampMaxTokens(value: number): number {
  if (Number.isNaN(value)) return MAX_TOKENS_DEFAULT
  return Math.min(MAX_TOKENS_MAX, Math.max(MAX_TOKENS_MIN, Math.round(value)))
}

export function ModelParametersCard() {
  const { data: settings, isLoading } = useSettings()
  const updateParams = useUpdateEvaluationParams()

  const upstreamPrompt = settings?.systemPrompt ?? ''
  const upstreamMaxTokens = settings?.maxTokens ?? MAX_TOKENS_DEFAULT

  const [systemPrompt, setSystemPrompt] = useState(upstreamPrompt)
  const [maxTokens, setMaxTokens] = useState(upstreamMaxTokens)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-sync local state when upstream changes (e.g. settings refreshed).
  useEffect(() => {
    setSystemPrompt(upstreamPrompt)
  }, [upstreamPrompt])

  useEffect(() => {
    setMaxTokens(upstreamMaxTokens)
  }, [upstreamMaxTokens])

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const activeLlm = settings?.activeLlm ?? null

  const handlePromptBlur = () => {
    const trimmed = systemPrompt.trim()
    if (trimmed === upstreamPrompt) return
    updateParams.mutate(
      { systemPrompt: trimmed },
      {
        onError: () => {
          // Revert local state to the last known good value.
          setSystemPrompt(upstreamPrompt)
        }
      }
    )
  }

  const handleMaxTokensChange = (next: number) => {
    const clamped = clampMaxTokens(next)
    setMaxTokens(clamped)

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      if (clamped === upstreamMaxTokens) return
      updateParams.mutate(
        { maxTokens: clamped },
        {
          onError: () => {
            setMaxTokens(upstreamMaxTokens)
          }
        }
      )
    }, DEBOUNCE_MS)
  }

  const isPromptSaving = updateParams.isPending && updateParams.variables?.systemPrompt !== undefined
  const isMaxTokensSaving = updateParams.isPending && updateParams.variables?.maxTokens !== undefined

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sliders className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Model Parameters
        </h3>
      </div>

      <div className="space-y-4 font-mono text-xs">
        {/* Target Engine (read-only) */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
          <span className="text-[10px] text-slate-500 uppercase">
            Target Engine:
          </span>
          {isLoading ? (
            <div className="text-slate-500 text-xs">Loading…</div>
          ) : activeLlm ? (
            <>
              <div className="text-white font-extrabold text-xs">
                {activeLlm.name}
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                  {activeLlm.size} RAM
                </span>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {activeLlm.quantization}
                </span>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs">
              No active model — set one in Settings.
            </div>
          )}
        </div>

        {/* System Context Prompt (auto-save on blur) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label
              htmlFor="model-params-system-prompt"
              className="text-[9px] text-slate-400 font-bold uppercase tracking-wide"
            >
              System Context Prompt:
            </label>
            {isPromptSaving && (
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
            )}
          </div>
          <textarea
            id="model-params-system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            onBlur={handlePromptBlur}
            maxLength={PROMPT_MAX_LENGTH}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-800 p-2 text-slate-200 rounded-lg font-sans text-xs leading-relaxed min-h-[90px] outline-none focus:border-slate-700 resize-y"
            placeholder="You are a high-fidelity local LLM expert…"
          />
        </div>

        {/* Max Out Tokens (debounced auto-save) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
            <span>Max Out Tokens:</span>
            <span className="flex items-center gap-1.5">
              <span className="text-indigo-400 font-extrabold">
                {maxTokens} tokens
              </span>
              {isMaxTokensSaving && (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              )}
            </span>
          </div>
          <input
            type="range"
            min={MAX_TOKENS_MIN}
            max={MAX_TOKENS_MAX}
            step={1}
            value={maxTokens}
            onChange={(e) => handleMaxTokensChange(Number(e.target.value))}
            disabled={isLoading}
            className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the client type-checks**

Run from `client/`:

```bash
bun run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/evaluation/components/ModelParametersCard.tsx && git commit -m "feat(client): add ModelParametersCard component"
```

---

## Task 11: Wire `ModelParametersCard` into the Evaluation page

**Files:**
- Modify: `client/src/modules/evaluation/index.tsx`

- [ ] **Step 1: Remove the static `CURRENT_MODEL` and `SYSTEM_PROMPT` constants**

Open `client/src/modules/evaluation/index.tsx`. Delete the `CURRENT_MODEL` constant (currently lines 20-25) and the `SYSTEM_PROMPT` constant (currently lines 27-28).

- [ ] **Step 2: Update the import line**

In the same file, replace the current import line (lines 1-4):

```ts
import { useState } from 'react'
import { Sliders, Database, FileCode, MessageSquare, Send } from 'lucide-react'
import { useEvaluationStream } from './hooks/useEvaluationStream'
import { FunctionSchemasPanel } from '@/modules/function-schemas/components/FunctionSchemasPanel'
```

with:

```ts
import { useState } from 'react'
import { Database, FileCode, MessageSquare, Send } from 'lucide-react'
import { useEvaluationStream } from './hooks/useEvaluationStream'
import { FunctionSchemasPanel } from '@/modules/function-schemas/components/FunctionSchemasPanel'
import { ModelParametersCard } from './components/ModelParametersCard'
```

(Drop `Sliders` from the import — the new card brings its own.)

- [ ] **Step 3: Replace the static "Model Parameters Card" with the new component**

In the same file, locate the entire static Model Parameters card `<div>` block (currently lines 122-166, starting with `<!-- Model Parameters Card -->` and ending with the closing `</div>` of the card). Delete that entire block and replace it with:

```tsx
          <ModelParametersCard />
```

The surrounding `<div className="lg:col-span-4 space-y-6">` and `<!-- Function Schemas Panel -->` block stay as-is. The card slot is now driven by the new component.

- [ ] **Step 4: Verify the client type-checks and bundles**

Run from `client/`:

```bash
bun run build
```

Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/modules/evaluation/index.tsx && git commit -m "refactor(evaluation): mount ModelParametersCard, drop static card"
```

---

## Task 12: End-to-end verification

**Files:** none modified

- [ ] **Step 1: Verify the database migration has been applied**

If you have not yet run `bun run db:migrate:dev` (from Task 1), run it now from `server/`:

```bash
bun run db:migrate:dev
```

Expected: Prisma reports "No pending migrations" (if Task 1 was completed) or applies the new migration.

- [ ] **Step 2: Verify the seed populates the new fields**

If the database was empty before this plan, run from `server/`:

```bash
bun run db:seed
```

Expected: the script prints "Seed completed". If the seed fails because the singleton already exists, that's fine — the `create` branch only runs on first install.

- [ ] **Step 3: Manually verify the API**

Start the server in one terminal (this is a manual verification — the plan does not run `bun run dev`):

```bash
cd server && bun run dev
```

In another terminal, smoke-test the new endpoint:

```bash
curl -sS -X PATCH http://localhost:3002/api/settings/evaluation-params \
  -H 'Content-Type: application/json' \
  -d '{"systemPrompt":"hello world","maxTokens":2048}'
```

Expected: a JSON object with `success: true` and `data` containing the updated `Settings` (with `systemPrompt: "hello world"` and `maxTokens: 2048`).

Then:

```bash
curl -sS http://localhost:3002/api/settings
```

Expected: response includes `systemPrompt: "hello world"` and `maxTokens: 2048`.

Then send a chat message via the Evaluation page UI and confirm the request payload (shown in the JSON inspector panel) uses the new `max_tokens` value and includes the new system prompt as the first message.

- [ ] **Step 4: Manually verify the UI**

Start the client in another terminal:

```bash
cd client && bun run dev
```

Open the Evaluation page (`/evaluation`). Confirm:

1. The "Model Parameters" card shows the active LLM name (matches what's selected in Settings).
2. Editing the system prompt and tabbing out triggers a save (network panel shows the PATCH request). A brief `Loader2` spinner appears next to the label during the save.
3. Dragging the max-tokens slider triggers a save 400ms after release. The slider value updates live during the drag; the request fires once.
4. The JSON inspector at the bottom of the page reflects the new `max_tokens` and system prompt on the next chat message.

- [ ] **Step 5: Commit any final adjustments**

If you made any tweaks during manual verification, commit them:

```bash
git add -A && git commit -m "chore: post-verification adjustments"
```

(Only run this if you actually changed something. If everything works as-is, skip the commit.)

---

## Self-Review

- **Spec coverage:**
  - Schema migration with two nullable columns → Task 1.
  - Zod model extension and `updateEvaluationParams` schema → Task 2.
  - Service extension + new method → Task 3.
  - PATCH route → Task 4.
  - Seed update on the `create` branch only → Task 5.
  - Evaluation service reads from settings → Task 6.
  - Client type extension → Task 7.
  - Client API method → Task 8.
  - Client mutation hook with `setQueryData` and error toast → Task 9.
  - Interactive card with on-blur prompt save and debounced slider save → Task 10.
  - Card mounted in evaluation page; static card removed; unused imports dropped → Task 11.
  - End-to-end verification → Task 12.
- **Placeholder scan:** no "TBD" / "TODO" / "fill in details" anywhere; all code blocks are complete.
- **Type consistency:** the `Settings`, `UpdateEvaluationParamsInput`, `LlmModel`, and `useUpdateEvaluationParams` names are consistent across Tasks 2, 3, 4, 7, 8, 9, 10, 11. The Zod model field `llmModelFields` is referenced in both `llmModel` and `settings.activeLlm` (Task 2) and the Prisma `select` shape in Task 3 matches. `updateParams.variables` is used to distinguish "prompt save" from "max-tokens save" via field presence — this works because `useMutation`'s `variables` reflects the most recent `mutate` call's payload.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-11-model-parameters.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
