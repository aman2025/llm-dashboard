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
