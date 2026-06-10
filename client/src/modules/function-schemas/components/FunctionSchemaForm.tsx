import { useState } from 'react'
import type { FunctionSchema } from '../api'

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/

interface FunctionSchemaFormProps {
  initialValue?: FunctionSchema
  onSubmit: (values: {
    name: string
    description: string
    parameters: string
    enabled: boolean
  }) => void
  onCancel: () => void
  isSubmitting: boolean
}

function validateJsonShape(raw: string): string | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 'Parameters must be valid JSON'
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'Parameters must be a JSON object'
  }
  const obj = parsed as Record<string, unknown>
  if (obj.type !== 'object') {
    return 'Parameters must declare "type": "object"'
  }
  if (
    typeof obj.properties !== 'object' ||
    obj.properties === null ||
    Array.isArray(obj.properties)
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
  const [name, setName] = useState(initialValue?.name ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [parameters, setParameters] = useState(initialValue?.parameters ?? '')
  const [enabled, setEnabled] = useState(initialValue?.enabled ?? true)
  const [error, setError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const trimmedDescription = description.trim()

  const nameError =
    !trimmedName
      ? 'Name is required'
      : trimmedName.length > 64
        ? 'Name must be 64 characters or fewer'
        : !NAME_REGEX.test(trimmedName)
          ? 'Use letters, digits, underscores, or dashes only'
          : null

  const descriptionError = !trimmedDescription ? 'Description is required' : null

  const handleSubmit = () => {
    if (nameError || descriptionError) {
      setError(nameError ?? descriptionError)
      return
    }
    const shapeError = validateJsonShape(parameters)
    if (shapeError) {
      setError(shapeError)
      return
    }
    setError(null)
    onSubmit({
      name: trimmedName,
      description: trimmedDescription,
      parameters,
      enabled
    })
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
          Function Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. fetch_system_logs"
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
          Purpose / Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of function capabilities"
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-[11px] font-sans text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
          Parameters Object JSON
        </label>
        <textarea
          value={parameters}
          onChange={(e) => setParameters(e.target.value)}
          rows={6}
          placeholder='{ "query": { "type": "string" } }'
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-[10px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-y"
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

      {error && (
        <p className="text-[10px] text-red-400 font-mono">{error}</p>
      )}

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
