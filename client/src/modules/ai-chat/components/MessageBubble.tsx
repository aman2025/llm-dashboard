import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ChatMessage } from '@/stores/chat-store'
import { ReasonBlock } from './ReasonBlock'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser ? 'bg-indigo-500/20 text-foreground' : 'bg-white/5 text-foreground'
        )}
      >
        {!isUser && message.reasoning && (
          <ReasonBlock reasoning={message.reasoning} isStreaming={isStreaming} />
        )}
        <div className={clsx('whitespace-pre-wrap text-sm', !isUser && message.reasoning && 'mt-2')}>
          {message.content}
          {isStreaming && !message.content && (
            <Loader2 className="inline-block w-4 h-4 text-indigo-400 animate-spin ml-1" />
          )}
        </div>
      </div>
    </div>
  )
}
