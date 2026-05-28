import { Plus, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useChatSessions, useDeleteSession } from '../hooks/useChatSessions'
import { useChatStore } from '@/stores/chat-store'
import { useQueryClient } from '@tanstack/react-query'

const BASE_URL = (process.env.BUN_PUBLIC_BASE_URL || 'http://localhost:3002/api').replace(/\/+$/, '')

export function ChatSidebar() {
  const { data: sessions = [] } = useChatSessions()
  const deleteSession = useDeleteSession()
  const { activeSessionId, setActiveSession } = useChatStore()
  const queryClient = useQueryClient()

  const handleNewChat = async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      if (json.success && json.data?.id) {
        setActiveSession(json.data.id)
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      }
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  return (
    <div className="w-[200px] bg-space-sidebar rounded-xl p-4 flex flex-col h-full">
      <button
        onClick={handleNewChat}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors text-sm mb-4"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className={clsx(
              'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm',
              activeSessionId === session.id
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-foreground'
                : 'hover:bg-white/5 text-muted-foreground'
            )}
          >
            <span className="flex-1 truncate">{session.lastMessage || 'New chat'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteSession.mutate(session.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}