import { ChatSidebar } from './components/ChatSidebar'
import { ChatPanel } from './components/ChatPanel'
import { ChatInput } from './components/ChatInput'
import { useChatStream } from './hooks/useChatStream'
import { useChatStore } from '@/stores/chat-store'

export default function AiChatPage() {
  const { startStream } = useChatStream()
  const { activeSessionId } = useChatStore()

  const handleSend = async (message: string) => {
    await startStream(message)
  }

  return (
    <div className="flex h-full gap-4 p-4" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #12101f 100%)' }}>
      <ChatSidebar />
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <ChatPanel />
        <ChatInput onSend={handleSend} disabled={!activeSessionId} />
      </div>
    </div>
  )
}