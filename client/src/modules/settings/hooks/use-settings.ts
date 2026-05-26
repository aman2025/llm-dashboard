import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emitToast } from '@/components/ui/toaster'
import {
  settingsApi,
  type Settings,
  type SettingsUpdate
} from '@/api/endpoints/settings'
import { ApiRequestError } from '@/api/axios'

export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => [...settingsKeys.all, 'detail'] as const
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => settingsApi.get()
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SettingsUpdate) => settingsApi.update(data),
    meta: { skipGlobalToast: true },
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
      emitToast({ message: 'Settings updated', variant: 'success' })
    },
    onError: (error) => {
      // Handle business errors with toast
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
      // Non-business errors (timeout, network, HTTP) are handled by QueryProvider
    }
  })
}

export function useAddLlmName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => settingsApi.addLlmName(name),
    meta: { skipGlobalToast: true },
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
      emitToast({ message: 'LLM name added', variant: 'success' })
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}

export function useRemoveLlmName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => settingsApi.removeLlmName(name),
    meta: { skipGlobalToast: true },
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
      emitToast({ message: 'LLM name removed', variant: 'success' })
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === 'BUSINESS_ERROR') {
        emitToast({ message: error.message, variant: 'error' })
      }
    }
  })
}
