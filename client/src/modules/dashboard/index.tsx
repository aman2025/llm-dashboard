import { useEffect, useState } from 'react'
import {
  Gauge,
  Cpu,
  Activity,
  Thermometer,
  Server,
  HardDrive,
  Database,
  TrendingUp,
  Zap,
  Clock,
  Loader2,
  WifiOff
} from 'lucide-react'
import { ApiRequestError } from '@/api/axios'
import { macmonApi } from './api'
import type { MacmonSnapshot } from './api'

const PROXIED_PATH = '/macmon/snapshot'

const bytesToGB = (b: number) => b / 1024 ** 3
const bytesToMB = (b: number) => b / 1024 ** 2
const pct = (v: number, d = 1) => (v * 100).toFixed(d)
const watts = (v: number) => v.toFixed(2)
const celsius = (v: number) => v.toFixed(1)
const formatTs = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function DashboardPage() {
  const [data, setData] = useState<MacmonSnapshot | null>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchSnapshot = async () => {
      try {
        const snapshot = await macmonApi.getSnapshot({
          timeout: 3000
        })
        if (cancelled) return
        setData(snapshot)
        setStatus('live')
        setErrorMsg(null)
      } catch (err) {
        if (cancelled) return
        const apiErr = err as ApiRequestError
        let msg = 'Unknown error'
        if (apiErr.code === 'TIMEOUT') msg = 'Request timed out'
        else if (apiErr.code === 'NETWORK_ERROR') msg = 'Macmon daemon unreachable'
        else msg = apiErr.message || `HTTP ${apiErr.status}`
        setStatus('error')
        setErrorMsg(msg)
      }
    }

    fetchSnapshot()
    const id = setInterval(fetchSnapshot, 20000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="space-y-8 p-6 text-slate-100 max-w-[1232px] mx-auto">
      {/* ==================== MACMON SECTION ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm uppercase tracking-wider font-mono font-bold text-slate-200 flex items-center gap-2">
              Macmon macOS System Telemetry
              <span
                className="text-[10px] font-medium bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1.5"
                title={status === 'error' && errorMsg ? errorMsg : undefined}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'live'
                      ? 'bg-emerald-500'
                      : status === 'error'
                        ? 'bg-red-500'
                        : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <span
                  className={
                    status === 'live'
                      ? 'text-emerald-300'
                      : status === 'error'
                        ? 'text-red-400'
                        : 'text-amber-400'
                  }
                >
                  {status === 'live'
                    ? `Live ${data?.soc.chip_name ?? ''}`.trim()
                    : status === 'error'
                      ? 'Connection Lost'
                      : 'Connecting...'}
                </span>
              </span>
            </h2>
          </div>
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded border ${
              status === 'error'
                ? 'text-red-400 bg-red-500/5 border-red-500/15'
                : 'text-indigo-400 bg-indigo-500/5 border-indigo-500/15'
            }`}
          >
            {status === 'live' && data
              ? `Sampling Time  ${formatTs(data.timestamp)}`
              : status === 'error' && data
                ? `Last Update  ${formatTs(data.timestamp)}`
                : 'Sampling Time  —'}
          </span>
        </div>

        {!data && status === 'loading' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-mono text-slate-400">
              Connecting to Macmon daemon at {PROXIED_PATH}...
            </span>
          </div>
        )}

        {!data && status === 'error' && (
          <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
            <WifiOff className="w-7 h-7 text-red-400" />
            <span className="text-sm font-mono font-semibold text-red-300">
              Unable to reach Macmon daemon
            </span>
            <span className="text-xs font-mono text-slate-400">{errorMsg}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1">
              Expected endpoint: {PROXIED_PATH}
            </span>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Silicon Engine Loads */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Silicon Engine Loads
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono">CPU / GPU / Memory</h3>
                </div>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-400">CPU Usage:</span>
                    <span className="text-slate-200 font-bold">{pct(data.cpu_usage_pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(100, Number(pct(data.cpu_usage_pct)))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-400">GPU Usage:</span>
                    <span className="text-indigo-400 font-bold">{pct(data.gpu_usage[1])}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                      style={{ width: `${Math.min(100, Number(pct(data.gpu_usage[1])))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-400">Unified Memory:</span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      {bytesToGB(data.memory.ram_usage).toFixed(2)} /{' '}
                      {bytesToGB(data.memory.ram_total).toFixed(2)} GB
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${
                          data.memory.ram_total > 0
                            ? Math.min(100, (data.memory.ram_usage / data.memory.ram_total) * 100)
                            : 0
                        }%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 pl-2">
                    <span>↳ Swap Usage:</span>
                    <span className="text-slate-400 font-bold">
                      {bytesToMB(data.memory.swap_usage).toFixed(0)} /{' '}
                      {bytesToMB(data.memory.swap_total).toFixed(0)} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: SoC Hardware */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Silicon Specifications
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono">SoC Hardware</h3>
                </div>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="space-y-2.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[11px]">Chip Model:</span>
                  <span className="text-white font-bold">{data.soc.chip_name}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[11px]">P-Core Count:</span>
                  <span className="text-indigo-400 font-bold">{data.soc.pcpu_cores} Cores</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[11px]">E-Core Count:</span>
                  <span className="text-slate-200 font-bold">{data.soc.ecpu_cores} Cores</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 text-[11px]">GPU Core Count:</span>
                  <span className="text-emerald-400 font-bold">{data.soc.gpu_cores} Cores</span>
                </div>
              </div>
            </div>

            {/* Card 3: SoC Heat & Power Draw */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Thermals & Consumption
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono">SoC Heat & Power Draw</h3>
                </div>
                <Thermometer className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">CPU Temp:</span>
                  <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                    {celsius(data.temp.cpu_temp_avg)}°C
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">GPU Temp:</span>
                  <span className="text-sm font-bold text-indigo-300 mt-0.5 block">
                    {celsius(data.temp.gpu_temp_avg)}°C
                  </span>
                </div>
              </div>

              <div className="font-mono text-xs pt-3 border-t border-slate-800/60 space-y-2">
                <div className="flex justify-between items-center text-xs text-white pb-1 border-b border-slate-950/40">
                  <span className="font-sans font-semibold text-slate-400">Silicon Power Draw:</span>
                  <span className="font-mono font-extrabold text-indigo-400">
                    {watts(data.all_power)} Watts
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>↳ CPU Core Power:</span>
                  <span className="text-slate-400 font-bold">{watts(data.cpu_power)}W</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>↳ GPU Core Power:</span>
                  <span className="text-indigo-300 font-bold">{watts(data.gpu_power)}W</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>↳ ANE Power:</span>
                  <span className="text-amber-400 font-bold">{watts(data.ane_power)}W</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-950/40 font-semibold">
                  <span>↳ RAM Bus Power:</span>
                  <span className="text-emerald-400 font-bold">{watts(data.ram_power)}W</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ==================== OMLX SERVER SECTION ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm uppercase tracking-wider font-mono font-bold text-slate-200">
              Omlx Server Telemetry{' '}
              <span className="text-slate-500 font-mono font-normal lowercase">(host statistics only)</span>
            </h2>
          </div>
          <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/5 px-2.5 py-1 rounded border border-indigo-500/10">
            Node-Level State
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Col 1: Omlx-Daemon */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Host Engine
                </span>
                <span className="text-lg font-extrabold text-white font-mono">Omlx-Daemon</span>
              </div>
              <div className="bg-indigo-500/10 p-2 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 text-xs border-y border-slate-800/60 py-3 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  1h 51m 12s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Model:</span>
                <span className="text-indigo-300 font-semibold truncate max-w-[200px]">
                  &quot;qwen3.5 4b 4bit&quot;
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">All Models:</span>
                <span className="text-slate-200 font-semibold text-right max-w-[180px] truncate">
                  qwen3.5 4b 4bit, qwen3...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Models Loaded:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />2 in memory
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Models Loading:</span>
                <span className="text-slate-200">0 loading</span>
              </div>
            </div>
          </div>

          {/* Col 2: VRAM Memory */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Host Allocation
                </span>
                <span className="text-lg font-extrabold text-white">VRAM Memory</span>
              </div>
              <div className="bg-amber-500/10 p-2 text-amber-400 rounded-lg border border-amber-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3.5 py-2 font-mono">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Model Usage bytes:</span>
                  <span className="text-amber-400 font-bold">2.80GB</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full border border-slate-800/60 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                    style={{ width: '17.5%' }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/50">
                <span>Memory Capacity:</span>
                <span className="text-slate-300">16.00GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5">
            <div className="p-2.5 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400">
                Total Input Tokens
              </div>
              <div className="text-base font-extrabold font-mono text-slate-100">78</div>
              <div className="text-[10px] text-indigo-400 font-mono">In-flight cache mapping</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5">
            <div className="p-2.5 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400">
                Total Output Tokens
              </div>
              <div className="text-base font-extrabold font-mono text-slate-100">1,082</div>
              <div className="text-[10px] text-indigo-400 font-mono">Quantized execution</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400">Prefill</div>
              <div className="text-base font-extrabold font-mono text-emerald-400">
                17.2 <span className="text-[10px] text-slate-400 font-normal">tok/s</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Inbound ingestion speed</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono text-slate-400">Decode</div>
              <div className="text-base font-extrabold font-mono text-emerald-400">
                18.6 <span className="text-[10px] text-slate-400 font-normal">tok/s</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Continuous output streaming</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
