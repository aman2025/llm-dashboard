import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useChatStream } from '../hooks/useChatStream'
import { useChatMessages } from '../hooks/useChatSessions'
import { MessageBubble } from './MessageBubble'

export function ChatPanel() {
  const { activeSessionId, sessions, loadSession } = useChatStore()
  const { isStreaming } = useChatStream()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch messages from API when session changes
  const { data: apiMessages } = useChatMessages(activeSessionId)

  // Sync API messages to store when they're loaded
  useEffect(() => {
    if (activeSessionId && apiMessages && apiMessages.length > 0) {
      const existingSession = sessions.find((s) => s.id === activeSessionId)
      // Only load if store doesn't have messages or is out of sync
      if (!existingSession || existingSession.messages.length === 0) {
        loadSession({
          id: activeSessionId,
          modelName: 'qwen-mlx',
          messages: apiMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }
  }, [activeSessionId, apiMessages, sessions, loadSession])

  // Get messages directly from Zustand store for real-time updates
  const messages =
    sessions.find((s) => s.id === activeSessionId)?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!activeSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select a conversation or start a new chat
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg, index) => {
        // Last assistant message is streaming if currently streaming
        const isLastAssistant =
          msg.role === 'assistant' &&
          index === messages.length - 1 &&
          isStreaming

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isLastAssistant}
          />
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
