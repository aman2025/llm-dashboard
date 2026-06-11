import { useState } from 'react'
import { Wrench } from 'lucide-react'
import {
  useCreateFunctionSchema,
  useFunctionSchemas,
  useUpdateFunctionSchema
} from '../hooks/useFunctionSchemas'
import type { FunctionSchema } from '../api'
import { FunctionSchemaCard } from './FunctionSchemaCard'
import { FunctionSchemaForm } from './FunctionSchemaForm'

export function FunctionSchemasPanel() {
  const { data: schemas, isLoading } = useFunctionSchemas()
  const create = useCreateFunctionSchema()
  const update = useUpdateFunctionSchema()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<FunctionSchema | null>(null)

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (schema: FunctionSchema) => {
    setEditing(schema)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditing(null)
  }

  const handleSubmit = (values: { definition: string; enabled: boolean }) => {
    if (editing) {
      update.mutate(
        { id: editing.id, input: values },
        { onSuccess: closeForm }
      )
    } else {
      create.mutate(values, { onSuccess: closeForm })
    }
  }

  const isSubmitting = create.isPending || update.isPending

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Function Schemas
          </h3>
        </div>
        {isFormOpen ? (
          <button
            type="button"
            onClick={closeForm}
            className="text-[9px] text-slate-300 font-bold font-mono uppercase border border-slate-800 bg-slate-950/40 px-2 py-1 rounded hover:text-white hover:border-slate-700 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={openCreate}
            className="text-[9px] bg-indigo-600 text-white px-2 py-1 rounded font-mono font-bold uppercase hover:bg-indigo-500 transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {isFormOpen && (
        <FunctionSchemaForm
          initialValue={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-[10px] text-slate-600 font-mono py-4 text-center">
            Loading schemas…
          </div>
        ) : !schemas || schemas.length === 0 ? (
          <div className="text-[10px] text-slate-600 font-mono py-4 text-center">
            No schemas registered yet
          </div>
        ) : (
          schemas.map((schema) => (
            <FunctionSchemaCard
              key={schema.id}
              schema={schema}
              onEdit={openEdit}
            />
          ))
        )}
      </div>
    </div>
  )
}
