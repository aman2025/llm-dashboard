import { useState } from 'react'
import { Wrench, Sliders, Database, FileCode, MessageSquare, Send } from 'lucide-react'
import { useEvaluationStream } from './hooks/useEvaluationStream'

interface ToolDefinition {
  id: string
  name: string
  description: string
  parameters: string
  enabled: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isToolCall?: boolean
  toolName?: string
  toolArgs?: string
  toolResult?: string
  isLive?: boolean
}

// ===== STATIC REFERENCE DATA =====

const CURRENT_MODEL = {
  name: 'Qwen2.5-Coder-32B',
  size: '22 GB',
  quantization: '4-bit',
  speed: 47.3
}

const SYSTEM_PROMPT =
  'You are a high-fidelity local LLM expert optimized to obey negative guidelines and structured tool signatures. Think step-by-step prior to writing the payload return.'

const TOOLS: ToolDefinition[] = [
  {
    id: 'get_weather',
    name: 'get_weather',
    description: 'Retrieve live weather conditions for a single target location',
    parameters: '{"location": {"type": "string"}}',
    enabled: true
  }
]

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function EvaluationPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const { startStream, stopStream, isStreaming, lastRequest, lastResponse, lastMetrics } =
    useEvaluationStream()

  const hasData = lastRequest !== null || lastResponse !== null
  const metrics = {
    inputTokens: lastMetrics?.inputTokens ?? 0,
    outputTokens: lastMetrics?.outputTokens ?? 0,
    timeToFirstToken: lastMetrics?.timeToFirstToken ?? 0,
    promptTokensPerSecond: lastMetrics?.promptTokensPerSecond ?? 0,
    generationTokensPerSecond: lastMetrics?.generationTokensPerSecond ?? 0
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const now = formatTimestamp(new Date())
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: now
    }
    const assistantId = `assistant-${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: now,
      isLive: true
    }

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')

    try {
      await startStream(trimmed, history, {
        onContent: (accumulated) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
          )
        },
        onComplete: (fullContent, finalResponse) => {
          const toolCalls = finalResponse?.choices?.[0]?.message?.tool_calls
          if (toolCalls && toolCalls.length > 0) {
            const first = toolCalls[0]
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: fullContent,
                      isToolCall: true,
                      toolName: first.function.name,
                      toolArgs: first.function.arguments
                    }
                  : m
              )
            )
          }
        }
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send evaluation message:', err)
    }
  }

  const handleStop = () => {
    stopStream()
  }

  return (
    <div className="space-y-6 p-6 text-slate-100 max-w-[1232px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ==================== LEFT COLUMN (4 cols) ==================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Model Parameters Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Model Parameters
              </h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase">Target Engine:</span>
                <div className="text-white font-extrabold text-xs">{CURRENT_MODEL.name}</div>
                <div className="flex gap-2 flex-wrap pt-1">
                  <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                    {CURRENT_MODEL.size} RAM
                  </span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    {CURRENT_MODEL.quantization}
                  </span>
                </div>
              </div>

              {/* System Prompt (read-only mock) */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                  System Context Prompt:
                </label>
                <div className="w-full bg-slate-950 border border-slate-800 p-2 text-slate-200 rounded-lg font-sans text-xs leading-relaxed min-h-[90px]">
                  {SYSTEM_PROMPT}
                </div>
              </div>

              {/* Max tokens bar (static) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                  <span>Max Out Tokens:</span>
                  <span className="text-indigo-400 font-extrabold">350</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '34%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Function Schemas Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Function Schemas
                </h3>
              </div>
              <button
                type="button"
                className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded font-mono font-bold uppercase cursor-not-allowed opacity-70"
                title="Static — disabled"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {TOOLS.map((tool) => (
                <div
                  key={tool.id}
                  className={`p-3 rounded-lg border transition-all ${
                    tool.enabled
                      ? 'bg-slate-950 border-slate-800 opacity-100'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      readOnly
                      className="mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-default"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-bold font-mono text-slate-200 block truncate">
                          {tool.name}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-sans mt-0.5 leading-tight">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  {tool.enabled && (
                    <pre className="mt-2 text-[8px] bg-slate-900/80 p-1.5 rounded font-mono text-indigo-400 overflow-x-auto select-all border border-slate-950">
                      {tool.parameters}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN (8 cols) ==================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chat Sandbox (top) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[420px] max-h-[500px]">
            {/* Chat header */}
            <div className="bg-slate-900/80 border-b border-slate-800 px-5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-extrabold text-white font-mono uppercase tracking-wide">
                    Local Benchmark Chat Context
                  </h3>
                  <p className="text-[9px] text-slate-500">
                    Query model live; outputs sync to the inspector below
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
                className="text-[10px] text-slate-400 font-bold font-mono uppercase border border-slate-800 bg-slate-950/40 px-2 py-1 rounded hover:text-white hover:border-slate-700 transition-colors disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 disabled:cursor-not-allowed"
                title="Clear chat history"
              >
                Clear history
              </button>
            </div>

            {/* Chat Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin bg-slate-950/40">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center text-slate-600 text-xs font-mono py-12">
                  <div>
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No messages yet.</p>
                    <p className="text-[10px] mt-1 text-slate-700">
                      Type a prompt below to query the local model.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xl rounded-xl p-3 space-y-1.5 border ${
                        isUser
                          ? 'bg-slate-800 text-slate-200 border-slate-800 rounded-br-none'
                          : 'bg-slate-950 text-slate-100 border-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                        {msg.content}
                        {msg.isLive && msg.content === '' && (
                          <span className="inline-block ml-1 text-slate-500 animate-pulse">▍</span>
                        )}
                      </div>

                      {/* Tool call inline */}
                      {msg.isToolCall && (
                        <div className="bg-slate-900 border border-emerald-500/20 rounded p-2 text-[9px] font-mono space-y-1 text-slate-300">
                          <div className="text-emerald-400 font-bold flex items-center gap-1">
                            <Database className="w-3.5 h-3.5" />
                            <span>Tool Call: {msg.toolName}</span>
                          </div>
                          <div className="bg-slate-950 p-1.5 border border-slate-800 rounded text-indigo-300">
                            <strong>Args:</strong> {msg.toolArgs}
                          </div>
                          {msg.toolResult && (
                            <div className="bg-slate-950 p-1.5 border border-slate-800 rounded text-emerald-300 break-all">
                              <strong>Result:</strong> {msg.toolResult}
                            </div>
                          )}
                          {!msg.toolResult && (
                            <div className="bg-slate-950 p-1.5 border border-slate-800 rounded text-slate-500 italic">
                              (no result — tool call passed through, not executed)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="border-t border-slate-800 p-3 bg-slate-900/40">
              <div className="flex gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Type benchmark prompt..."
                  className="flex-1 bg-transparent px-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="px-3 py-1.5 bg-red-600 rounded-md text-white text-[10px] font-bold font-mono uppercase hover:bg-red-500 flex items-center justify-center shrink-0"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-1.5 bg-indigo-600 rounded-md text-white disabled:opacity-40 hover:bg-indigo-500 flex items-center justify-center shrink-0"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inspector / JSON payloads (bottom) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-extrabold text-white font-mono uppercase tracking-wide">
                  Real-time JSON & Manual Evaluation Panel
                </h3>
              </div>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[16%_16%_16%_20%_25%] gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[9px]">
              <div>
                <span className="text-slate-500 uppercase font-bold block">Input</span>
                <span className="text-white font-black text-xs block mt-0.5">
                  {hasData ? `${metrics.inputTokens} ` : '—'}
                </span>
                <span className="text-emerald-400 font-normal block mt-0.5">input_tokens</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold block">Output</span>
                <span className="text-white font-black text-xs block mt-0.5">
                  {hasData ? `${metrics.outputTokens} ` : '—'}
                </span>
                <span className="text-indigo-400 font-normal block mt-0.5">output_tokens</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold block">TTFT</span>
                <span className="text-amber-400 font-black text-xs block mt-0.5">
                  {hasData ? `${metrics.timeToFirstToken.toFixed(1)}s` : '—'}
                </span>
                <span className="text-slate-500 block mt-0.5">time_to_first_token</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold block">Prompt Processing</span>
                <span className="text-white font-black text-xs block mt-0.5">
                  {hasData ? `${Math.round(metrics.promptTokensPerSecond)} tok/s` : '—'}
                </span>
                <span className="text-emerald-400 font-normal block mt-0.5">prompt_tokens_per_second</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold block">Token Generation</span>
                <span className="text-white font-black text-xs block mt-0.5">
                  {hasData ? `${Math.round(metrics.generationTokensPerSecond)} tok/s` : '—'}
                </span>
                <span className="text-indigo-400 font-normal block mt-0.5">
                  generation_tokens_per_second
                </span>
              </div>
            </div>

            {/* Raw request / response */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Request */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center bg-slate-900 px-3 py-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                    <span className="text-[9px] font-mono font-extrabold text-slate-300 uppercase tracking-wide">
                      POST /v1/chat/completions
                    </span>
                  </div>
                </div>
                <div className="p-3 font-mono text-[10px] bg-slate-950 max-h-[350px] min-h-[250px] overflow-y-auto overflow-x-auto scrollbar-thin">
                  {lastRequest ? (
                    <pre className="text-slate-300 whitespace-pre leading-relaxed select-all">
                      {JSON.stringify(lastRequest, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full min-h-[226px] flex items-center justify-center text-slate-600 text-[10px] font-mono">
                      Awaiting first request…
                    </div>
                  )}
                </div>
                <div className="p-1.5 bg-slate-950 border-t border-slate-800 text-[8px] text-slate-500 font-mono text-center">
                  Request Payload standard payload JSON
                </div>
              </div>

              {/* Response */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center bg-slate-900 px-3 py-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 block" />
                    <span className="text-[9px] font-mono font-extrabold text-slate-300 uppercase tracking-wide">
                      HTTP/1.1 200 OK
                    </span>
                  </div>
                </div>
                <div className="p-3 font-mono text-[10px] bg-slate-950 max-h-[350px] min-h-[250px] overflow-y-auto overflow-x-auto scrollbar-thin">
                  {lastResponse ? (
                    <pre className="text-indigo-200 whitespace-pre leading-relaxed select-all">
                      {JSON.stringify(lastResponse, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full min-h-[226px] flex items-center justify-center text-slate-600 text-[10px] font-mono">
                      Awaiting first response…
                    </div>
                  )}
                </div>
                <div className="p-1.5 bg-slate-950 border-t border-slate-800 text-[8px] text-slate-500 font-mono text-center">
                  Response Payload standard payload JSON
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
