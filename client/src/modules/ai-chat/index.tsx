import { ChatSidebar } from './components/ChatSidebar'
import { ChatPanel } from './components/ChatPanel'
import { ChatInput } from './components/ChatInput'
import { useChatStream } from './hooks/useChatStream'
import { useChatStore } from '@/stores/chat-store'
import { useSettings } from '@/modules/settings/hooks/use-settings'
import { Brain } from 'lucide-react'

export default function AiChatPage() {
  const { startStream, stopStream, isStreaming } = useChatStream()
  const { activeSessionId } = useChatStore()
  const { data: settings } = useSettings()

  const handleSend = async (message: string) => {
    await startStream(message)
  }

  const handleStop = () => {
    stopStream()
  }

  const activeLlmName = settings?.activeLlm?.name || 'No model selected'

  return (
    <div
      className="flex h-full justify-center p-5"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #12101f 100%)'
      }}
    >
      {/* Main container with fixed width */}
      <div className="flex gap-5 h-full" style={{ width: '1232px' }}>
        {/* Left Sidebar */}
        <ChatSidebar />

        {/* Right Chat Area */}
        <div className="flex-1 flex flex-col border border-[#1f2033] rounded-xl overflow-hidden">
          {/* Top Header - 56px */}
          <div className="h-14 flex items-center gap-3 px-6 border-b border-[#1f2033]">
            <Brain className="w-5 h-5 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{activeLlmName}</span>
              {settings?.activeLlm?.size && (
                <span className="text-xs text-muted-foreground">{settings.activeLlm.size}</span>
              )}
            </div>
          </div>

          {/* Middle - Messages Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ChatPanel />
          </div>

          {/* Bottom - Input Area - 80px */}
          <div className="h-20 border-t border-[#1f2033] p-2.5">
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              disabled={!activeSessionId}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
