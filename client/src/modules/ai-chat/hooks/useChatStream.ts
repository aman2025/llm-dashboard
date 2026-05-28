import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chat-store'
import { chatApi } from '../api/chat'

export function useChatStream() {
  const { addMessage, updateMessage, activeSessionId, createSession } = useChatStore()
  const [isStreaming, setIsStreaming] = useState(false)
  const queryClient = useQueryClient()

  const startStream = useCallback(
    async (message: string) => {
      if (isStreaming) return

      let sessionId = activeSessionId
      if (!sessionId) {
        sessionId = createSession('qwen-mlx')
      }

      setIsStreaming(true)

      try {
        // Add user message immediately
        const userMsgId = `user-${Date.now()}`
        addMessage(sessionId, {
          id: userMsgId,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString()
        })

        // Create placeholder for assistant message
        const assistantMsgId = `assistant-${Date.now()}`
        addMessage(sessionId, {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString()
        })

        const response = await fetch(chatApi.getStreamUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedContent = ''
        let accumulatedReasoning = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)

            try {
              const event = JSON.parse(data)

              if (event.error) {
                throw new Error(event.error)
              }

              if (event.content !== undefined) {
                accumulatedContent += event.content
                updateMessage(sessionId, assistantMsgId, {
                  content: accumulatedContent
                })
              }

              if (event.reasoning !== undefined) {
                accumulatedReasoning = event.reasoning
                updateMessage(sessionId, assistantMsgId, {
                  reasoning: accumulatedReasoning
                })
              }

              if (event.done) {
                // Invalidate messages query to refetch from API
                queryClient.invalidateQueries({
                  queryKey: ['chat-messages', sessionId]
                })
                break
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError)
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error)
        throw error
      } finally {
        setIsStreaming(false)
      }
    },
    [activeSessionId, addMessage, updateMessage, createSession, isStreaming, queryClient]
  )

  return { startStream, isStreaming }
}