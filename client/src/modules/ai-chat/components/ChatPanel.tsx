import { useEffect, useRef } from 'react'
import { useChatMessages } from '../hooks/useChatSessions'
import { useChatStore } from '@/stores/chat-store'
import { MessageBubble } from './MessageBubble'

export function ChatPanel() {
  const { activeSessionId } = useChatStore()
  const { data: messages = [] } = useChatMessages(activeSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}