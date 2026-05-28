import { clsx } from 'clsx'
import type { ChatMessage } from '../api/chat'
import { ReasonBlock } from './ReasonBlock'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-indigo-500/20 text-foreground'
            : 'bg-white/5 text-foreground'
        )}
      >
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        {!isUser && message.reasoning && (
          <ReasonBlock reasoning={message.reasoning} />
        )}
      </div>
    </div>
  )
}