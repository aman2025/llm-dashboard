import { useState } from 'react'
import type { FunctionSchema } from '../api'

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/

interface FunctionSchemaFormProps {
  initialValue?: FunctionSchema
  onSubmit: (values: { definition: string; enabled: boolean }) => void
  onCancel: () => void
  isSubmitting: boolean
}

function buildInitialDefinition(initialValue: FunctionSchema | undefined): string {
  if (!initialValue) return ''
  let parsedParameters: unknown = {}
  try {
    parsedParameters = JSON.parse(initialValue.parameters)
  } catch {
    parsedParameters = {}
  }
  return JSON.stringify(
    {
      name: initialValue.name,
      description: initialValue.description,
      parameters: parsedParameters
    },
    null,
    2
  )
}

function validateDefinition(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Definition is required'

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 'Definition must be valid JSON'
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'Definition must be a JSON object'
  }
  const obj = parsed as Record<string, unknown>

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    return 'Definition must declare a "name" string'
  }
  if (obj.name.length > 64) {
    return 'Name must be 64 characters or fewer'
  }
  if (!NAME_REGEX.test(obj.name)) {
    return 'Use letters, digits, underscores, or dashes only'
  }

  if (typeof obj.description !== 'string' || obj.description.length === 0) {
    return 'Definition must declare a "description" string'
  }
  if (obj.description.length > 500) {
    return 'Description must be 500 characters or fewer'
  }

  if (
    typeof obj.parameters !== 'object' ||
    obj.parameters === null ||
    Array.isArray(obj.parameters)
  ) {
    return 'Definition must declare a "parameters" object'
  }
  const params = obj.parameters as Record<string, unknown>
  if (params.type !== 'object') {
    return 'Parameters must declare "type": "object"'
  }
  if (
    typeof params.properties !== 'object' ||
    params.properties === null ||
    Array.isArray(params.properties)
  ) {
    return 'Parameters must declare a "properties" object'
  }
  return null
}

export function FunctionSchemaForm({
  initialValue,
  onSubmit,
  onCancel,
  isSubmitting
}: FunctionSchemaFormProps) {
  const [definition, setDefinition] = useState(() =>
    buildInitialDefinition(initialValue)
  )
  const [enabled, setEnabled] = useState(initialValue?.enabled ?? true)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    const shapeError = validateDefinition(definition)
    if (shapeError) {
      setError(shapeError)
      return
    }
    setError(null)
    onSubmit({ definition, enabled })
  }

  return (
    <div className="space-y-3 border-b border-slate-800 pb-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
          Register Custom Schema.
        </span>
        <span className="text-[9px] text-slate-500 font-mono uppercase">JSON Format</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
          Function Schema JSON
        </label>
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          rows={12}
          placeholder={`{
  "name": "fetch_system_logs",
  "description": "Retrieve recent system logs from the host",
  "parameters": {
    "type": "object",
    "properties": {
      "since": { "type": "string" }
    },
    "required": ["since"]
  }
}`}
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-[10px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-y scrollbar-thin"
        />
      </div>

      <label className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
        />
        Enabled (include in LLM request)
      </label>

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 text-[10px] text-slate-300 font-bold font-mono uppercase border border-slate-800 bg-slate-950/40 px-3 py-2 rounded hover:border-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 text-[10px] text-white font-bold font-mono uppercase bg-indigo-600 px-3 py-2 rounded hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Confirm & Embed Schema'}
        </button>
      </div>
    </div>
  )
}
