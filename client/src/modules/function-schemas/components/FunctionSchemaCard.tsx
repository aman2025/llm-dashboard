import { Pencil, Trash2 } from 'lucide-react'
import {
  useDeleteFunctionSchema,
  useToggleFunctionSchema
} from '../hooks/useFunctionSchemas'
import type { FunctionSchema } from '../api'

interface FunctionSchemaCardProps {
  schema: FunctionSchema
  onEdit: (schema: FunctionSchema) => void
}

export function FunctionSchemaCard({ schema, onEdit }: FunctionSchemaCardProps) {
  const toggle = useToggleFunctionSchema()
  const remove = useDeleteFunctionSchema()

  const handleDelete = () => {
    if (window.confirm(`Delete function schema "${schema.name}"?`)) {
      remove.mutate(schema.id)
    }
  }

  return (
    <div
      className={`group p-3 rounded-lg border transition-all ${
        schema.enabled
          ? 'bg-slate-950 border-slate-800 opacity-100'
          : 'bg-slate-950/40 border-slate-900 opacity-60'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={schema.enabled}
          onChange={() => toggle.mutate(schema.id)}
          className="mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[11px] font-bold font-mono text-slate-200 block truncate">
              {schema.name}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(schema)}
                className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800"
                title="Edit"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 font-sans mt-0.5 leading-tight">
            {schema.description}
          </p>
        </div>
      </div>
      {schema.enabled && (
        <pre className="mt-2 text-[8px] bg-slate-900/80 p-1.5 rounded font-mono text-indigo-400 overflow-x-auto select-all border border-slate-950">
          {schema.parameters}
        </pre>
      )}
    </div>
  )
}
