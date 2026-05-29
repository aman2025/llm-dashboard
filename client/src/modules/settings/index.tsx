import { Settings2, Check, RefreshCcw } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex h-full p-6 gap-5 max-w-[1232px] mx-auto">
      {/* Left Panel - 818px */}
      <div className="w-[818px] flex-shrink-0">
        <div
          className="h-full flex flex-col rounded-xl"
          style={{
            backgroundColor: '#10162f',
            border: '1px solid #1e293a'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#1e293a' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(132, 99, 255, 0.2)' }}
              >
                <Settings2 className="w-4 h-4" style={{ color: '#8463ff' }} />
              </div>
              <span className="text-white font-semibold text-base">Active model</span>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                color: '#94a3b8'
              }}
            >
              <RefreshCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          {/* Content - Active Model Card */}
          <div className="flex-1 p-5 overflow-auto">
            <div
              className="p-5 rounded-xl"
              style={{
                backgroundColor: 'rgba(30, 41, 58, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-white font-semibold text-lg mb-1">Qwen2.5-14B-Instruct</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>Large language model optimized for instruction following</div>
                </div>
                <span
                  className="px-3 py-1 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#22c55e'
                  }}
                >
                  Active
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: '#94a3b8' }}>
                <span className="flex items-center gap-2">
                  <span style={{ color: '#64748b' }}>Speed:</span>
                  <span className="text-white">64 tok/s</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                <span className="flex items-center gap-2">
                  <span style={{ color: '#64748b' }}>VRAM:</span>
                  <span className="text-white">4.8 GB</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                <span className="flex items-center gap-2">
                  <span style={{ color: '#64748b' }}>Quant:</span>
                  <span className="text-white">Q4_K_M</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Remaining Width */}
      <div className="flex-1">
        <div
          className="h-full flex flex-col rounded-xl"
          style={{
            backgroundColor: '#10162f',
            border: '1px solid #1e293a'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#1e293a' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
              >
                <Settings2 className="w-4 h-4" style={{ color: '#22c55e' }} />
              </div>
              <span className="text-white font-semibold text-base">Toolcall definition</span>
            </div>
          </div>

          {/* Content - Tool Definition Cards */}
          <div className="flex-1 p-5 overflow-auto space-y-3">
            {[
              { tool: 'get_weather', desc: 'Get current weather for a location', enabled: true },
              { tool: 'calculator', desc: 'Perform mathematical calculations', enabled: true }
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  backgroundColor: 'rgba(30, 41, 58, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}
              >
                <div>
                  <div className="text-white font-medium text-sm mb-1">{item.tool}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{item.desc}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    item.enabled ? 'bg-emerald-500' : ''
                  }`}
                  style={{ border: `1px solid ${item.enabled ? '#22c55e' : '#475569'}` }}
                >
                  {item.enabled && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}