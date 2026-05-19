import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  modelName: string
  messages: ChatMessage[]
  createdAt: Date
}

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  createSession: (modelName: string) => string
  deleteSession: (sessionId: string) => void
  addMessage: (
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ) => void
  setActiveSession: (sessionId: string | null) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (modelName) => {
        const id = crypto.randomUUID()
        const newSession: ChatSession = {
          id,
          modelName,
          messages: [],
          createdAt: new Date()
        }
        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: id
        }))
        return id
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId
        }))
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    {
                      ...message,
                      id: crypto.randomUUID(),
                      timestamp: new Date()
                    }
                  ]
                }
              : s
          )
        }))
      },

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId })
    }),
    {
      name: 'chat-storage'
    }
  )
)
