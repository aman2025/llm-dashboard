import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi, type SessionListItem, type ChatMessage } from '../api/chat'

export function useChatSessions() {
  return useQuery<SessionListItem[]>({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions
  })
}

export function useChatMessages(sessionId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatApi.getMessages(sessionId!),
    enabled: !!sessionId
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  })
}