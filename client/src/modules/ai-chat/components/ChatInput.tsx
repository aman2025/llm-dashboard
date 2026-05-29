import { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Square } from 'lucide-react'
import { clsx } from 'clsx'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  isStreaming?: boolean
}

export function ChatInput({ onSend, onStop, disabled, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [value])

  const handleSubmit = () => {
    if (!value.trim() || disabled || isStreaming) return
    onSend(value.trim())
    setValue('')
  }

  const handleStop = () => {
    if (onStop) {
      onStop()
    }
  }

  return (
    <div className="flex items-end gap-3 h-full px-4 py-3 bg-space-input-bg rounded-lg border border-space-border">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="Type a message..."
        disabled={disabled || isStreaming}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[24px] max-h-[48px]"
        rows={1}
      />
      {isStreaming ? (
        <button
          onClick={handleStop}
          className="p-2 rounded-lg transition-colors flex-shrink-0 bg-red-500 text-white hover:bg-red-600"
          title="Stop generating"
        >
          <Square className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={clsx(
            'p-2 rounded-lg transition-colors flex-shrink-0',
            disabled || !value.trim()
              ? 'bg-indigo-500/20 text-muted-foreground'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          )}
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}