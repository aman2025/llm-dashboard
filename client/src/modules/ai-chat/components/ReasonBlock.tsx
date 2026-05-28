import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface ReasonBlockProps {
  reasoning: string
}

export function ReasonBlock({ reasoning }: ReasonBlockProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-2 rounded-lg border border-white/5 bg-white/3 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        reasoning...
      </button>
      {expanded && (
        <div className="px-3 pb-3 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
          {reasoning}
        </div>
      )}
    </div>
  )
}