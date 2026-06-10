import { apiClient } from '@/api/axios'
import type {
  CreateFunctionSchemaInput,
  FunctionSchema,
  UpdateFunctionSchemaInput
} from './function-schemas.types'

export const functionSchemasApi = {
  list: (filter?: { enabledOnly?: boolean }) => {
    const params = filter?.enabledOnly ? { enabled: 'true' } : undefined
    return apiClient.get<FunctionSchema[]>('/function-schemas', { params })
  },

  get: (id: string) => apiClient.get<FunctionSchema>(`/function-schemas/${id}`),

  create: (input: CreateFunctionSchemaInput) =>
    apiClient.post<FunctionSchema>('/function-schemas', input),

  update: (id: string, input: UpdateFunctionSchemaInput) =>
    apiClient.patch<FunctionSchema>(`/function-schemas/${id}`, input),

  toggle: (id: string) =>
    apiClient.patch<FunctionSchema>(`/function-schemas/${id}/toggle`),

  remove: (id: string) => apiClient.delete<{ success: true }>(`/function-schemas/${id}`)
}
