import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { clsx } from 'clsx'

interface ReasonBlockProps {
  reasoning: string
  isStreaming?: boolean
}

export function ReasonBlock({
  reasoning,
  isStreaming = false
}: ReasonBlockProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-white/5 bg-white/3 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <Brain className="w-3 h-3" />
        <span>reasoning</span>
        {isStreaming && (
          <span className="ml-auto flex items-center gap-1 text-indigo-400">
            <span className="inline-block w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
            <span className="inline-block w-1 h-1 rounded-full bg-indigo-400 animate-pulse animation-delay-150" />
            <span className="inline-block w-1 h-1 rounded-full bg-indigo-400 animate-pulse animation-delay-300" />
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
          {reasoning}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3 bg-indigo-400/70 animate-pulse ml-0.5" />
          )}
        </div>
      )}
    </div>
  )
}
