import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, type Settings, type SettingsUpdate } from '@/api/endpoints/settings'

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
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
    }
  })
}

export function useAddLlmName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => settingsApi.addLlmName(name),
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
    }
  })
}

export function useRemoveLlmName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => settingsApi.removeLlmName(name),
    onSuccess: (newSettings) => {
      queryClient.setQueryData<Settings>(settingsKeys.detail(), newSettings)
    }
  })
}