import {
  Wrench,
  Sliders,
  Database,
  FileCode,
  MessageSquare,
  Send
} from 'lucide-react'

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
  verdict?: 'pass' | 'fail' | 'flagged' | 'unrated'
}

// ===== HARDCODED MOCK DATA (static mockup — no API, no real state) =====

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
    id: 'get_weather_forecast',
    name: 'get_weather_forecast',
    description:
      'Retrieve live weather conditions for a single target location',
    parameters: '{"location": {"type": "string"}}',
    enabled: true
  }
]

const SUGGESTIONS = [
  {
    title: 'Query Weather API',
    text: 'What is the weather forecast like in Tokyo right now? Use appropriate tools.'
  },
  {
    title: 'KV Cache Paragraph',
    text: "Explain benefits of KV Cache. Rule: Do not use the letter 'e' or 'E' in any word."
  },
  {
    title: 'Grid Upload Formula',
    text: 'Solve: We need to upload 14 VRAM buffers of 12GB. With a limit of 45GB concurrent slots, how many loops?'
  }
]

const MESSAGES: ChatMessage[] = [
  {
    id: 'msg-001',
    role: 'user',
    content: SUGGESTIONS[0].text,
    timestamp: '10:24'
  },
  {
    id: 'msg-002',
    role: 'assistant',
    content:
      'Calling get_weather_forecast with Tokyo as the target location. Results are in the tool call panel below.',
    timestamp: '10:24',
    isToolCall: true,
    toolName: 'get_weather_forecast',
    toolArgs: '{"location": "Tokyo"}',
    toolResult:
      '{"temp_c": 18.4, "wind_kph": 12, "humidity_pct": 64, "conditions": "Partly cloudy"}',
    verdict: 'pass'
  },
  {
    id: 'msg-003',
    role: 'user',
    content: SUGGESTIONS[1].text,
    timestamp: '10:26'
  },
  {
    id: 'msg-004',
    role: 'assistant',
    content:
      'KV caching holds prior K and V tensors in fast memory so a model can skip recomputing them for tokens it has already scanned. It cuts latency, lifts throughput, and trims cost for long prompts. You will typically attain a big win on long multi-turn chats or RAG, but pay for it with additional VRAM.',
    timestamp: '10:26',
    verdict: 'flagged'
  }
]

const INSPECTED_ID = 'msg-002'

const REQUEST_PAYLOAD = {
  model: `MLX-${CURRENT_MODEL.name.replace(/\s+/g, '-')}-${CURRENT_MODEL.quantization}`,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: SUGGESTIONS[0].text }
  ],
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 350,
  stream: true,
  stream_options: { include_usage: true },
  tools: TOOLS.filter((t) => t.enabled).map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: { type: 'object', properties: JSON.parse(t.parameters) }
    }
  }))
}

const RESPONSE_PAYLOAD = {
  id: 'msg-002',
  object: 'chat.completion',
  model: `MLX-${CURRENT_MODEL.name.replace(/\s+/g, '-')}-${CURRENT_MODEL.quantization}`,
  created: Math.floor(Date.now() / 1000) - 30,
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: MESSAGES[1].content,
        tool_calls: [
          {
            id: 'call-00002',
            type: 'function',
            function: {
              name: 'get_weather_forecast',
              arguments: { location: 'Tokyo' }
            }
          }
        ]
      },
      finish_reason: 'tool_calls'
    }
  ],
  usage: {
    prompt_tokens: 142,
    completion_tokens: 28,
    total_tokens: 170
  }
}

const ACTIVE_METRICS = {
  prompt_tokens: 142,
  completion_tokens: 28,
  total_tokens: 170,
  prompt_eval_duration: 0.18,
  generation_duration: 1.77,
  time_to_first_token: 0.18
}

export default function EvaluationPage() {
  const inspected = MESSAGES.find((m) => m.id === INSPECTED_ID) ?? MESSAGES[1]

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
                <span className="text-[10px] text-slate-500 uppercase">
                  Target Engine:
                </span>
                <div className="text-white font-extrabold text-xs">
                  {CURRENT_MODEL.name}
                </div>
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
                title="Static mockup — disabled"
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
                className="text-[10px] text-slate-400 font-bold font-mono uppercase border border-slate-800 bg-slate-950/40 px-2 py-1 rounded cursor-not-allowed opacity-70"
                title="Static mockup — disabled"
              >
                Clear history
              </button>
            </div>

            {/* Chat Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin bg-slate-950/40">
              {MESSAGES.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl rounded-xl p-3 space-y-1.5 border ${
                        isUser
                          ? 'bg-slate-800 text-slate-200 border-slate-800 rounded-br-none'
                          : 'bg-slate-950 text-slate-100 border-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                        {msg.content}
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
                          <div className="bg-slate-950 p-1.5 border border-slate-800 rounded text-emerald-300 break-all">
                            <strong>Result:</strong> {msg.toolResult}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input (disabled mock) */}
            <div className="border-t border-slate-800 p-3 bg-slate-900/40">
              <div className="flex gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1 items-center">
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder="Type benchmark prompt... (static mockup — disabled)"
                  className="flex-1 bg-transparent px-2.5 text-xs text-slate-500 outline-none placeholder:text-slate-600 cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  className="p-1.5 bg-indigo-600 rounded-md text-white disabled:opacity-40 cursor-not-allowed flex items-center justify-center shrink-0"
                  title="Static mockup — disabled"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[9px]">
              <div>
                <span className="text-slate-500 uppercase font-bold block">
                  Input Payload Size
                </span>
                <span className="text-white font-black text-xs block mt-0.5">
                  {ACTIVE_METRICS.prompt_tokens} tokens
                </span>
                <span className="text-emerald-400 font-semibold block mt-0.5">
                  Prefill: {ACTIVE_METRICS.prompt_eval_duration}s
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold block">
                  Output Decode Size
                </span>
                <span className="text-white font-black text-xs block mt-0.5">
                  {ACTIVE_METRICS.completion_tokens} tokens
                </span>
                <span className="text-indigo-400 font-semibold block mt-0.5">
                  Decode: {ACTIVE_METRICS.generation_duration}s
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold block">
                  Inference TTFT
                </span>
                <span className="text-amber-400 font-black text-xs block mt-0.5">
                  {ACTIVE_METRICS.time_to_first_token}s
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Pre-load latency
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
                  <pre className="text-slate-300 whitespace-pre leading-relaxed select-all">
                    {JSON.stringify(REQUEST_PAYLOAD, null, 2)}
                  </pre>
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
                  <pre className="text-indigo-200 whitespace-pre leading-relaxed select-all">
                    {JSON.stringify(RESPONSE_PAYLOAD, null, 2)}
                  </pre>
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
