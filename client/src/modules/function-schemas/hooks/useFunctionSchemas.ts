import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { emitToast } from '@/components/ui/toaster'
import { ApiRequestError } from '@/api/axios'
import {
  functionSchemasApi,
  type CreateFunctionSchemaInput,
  type FunctionSchema,
  type UpdateFunctionSchemaInput
} from '../api'

export const functionSchemaKeys = {
  all: ['function-schemas'] as const,
  list: (filter?: { enabledOnly?: boolean }) =>
    [...functionSchemaKeys.all, 'list', filter ?? {}] as const
}

export function useFunctionSchemas(filter?: { enabledOnly?: boolean }) {
  return useQuery({
    queryKey: functionSchemaKeys.list(filter),
    queryFn: () => functionSchemasApi.list(filter)
  })
}

export function useCreateFunctionSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFunctionSchemaInput) => functionSchemasApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: functionSchemaKeys.all })
      emitToast({ message: 'Function schema created', variant: 'success' })
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}

export function useUpdateFunctionSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFunctionSchemaInput }) =>
      functionSchemasApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: functionSchemaKeys.all })
      emitToast({ message: 'Function schema updated', variant: 'success' })
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}

export function useToggleFunctionSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => functionSchemasApi.toggle(id),
    onSuccess: (updated) => {
      qc.setQueriesData<FunctionSchema[]>(
        { queryKey: functionSchemaKeys.all },
        (old) => (old ? old.map((s) => (s.id === updated.id ? updated : s)) : old)
      )
    },
    onError: (error) => {
      qc.invalidateQueries({ queryKey: functionSchemaKeys.all })
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}

export function useDeleteFunctionSchema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => functionSchemasApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: functionSchemaKeys.all })
      emitToast({ message: 'Function schema deleted', variant: 'success' })
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}
