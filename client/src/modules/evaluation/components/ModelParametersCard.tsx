import { useEffect, useRef, useState } from 'react'
import { Loader2, Sliders } from 'lucide-react'
import { useSettings, useUpdateEvaluationParams } from '@/modules/settings/hooks/use-settings'

const PROMPT_MAX_LENGTH = 4000
const MAX_TOKENS_MIN = 1
const MAX_TOKENS_MAX = 8000
const MAX_TOKENS_DEFAULT = 1000
const DEBOUNCE_MS = 400

function clampMaxTokens(value: number): number {
  if (Number.isNaN(value)) return MAX_TOKENS_DEFAULT
  return Math.min(MAX_TOKENS_MAX, Math.max(MAX_TOKENS_MIN, Math.round(value)))
}

export function ModelParametersCard() {
  const { data: settings, isLoading } = useSettings()
  const updateParams = useUpdateEvaluationParams()

  const upstreamPrompt = settings?.systemPrompt ?? ''
  const upstreamMaxTokens = settings?.maxTokens ?? MAX_TOKENS_DEFAULT

  const [systemPrompt, setSystemPrompt] = useState(upstreamPrompt)
  const [maxTokens, setMaxTokens] = useState(upstreamMaxTokens)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-sync local state when upstream changes (e.g. settings refreshed).
  useEffect(() => {
    setSystemPrompt(upstreamPrompt)
  }, [upstreamPrompt])

  useEffect(() => {
    setMaxTokens(upstreamMaxTokens)
  }, [upstreamMaxTokens])

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const activeLlm = settings?.activeLlm ?? null

  const handlePromptBlur = () => {
    const trimmed = systemPrompt.trim()
    if (trimmed === upstreamPrompt) return
    updateParams.mutate(
      { systemPrompt: trimmed },
      {
        onError: () => {
          // Revert local state to the last known good value.
          setSystemPrompt(upstreamPrompt)
        }
      }
    )
  }

  const handleMaxTokensChange = (next: number) => {
    const clamped = clampMaxTokens(next)
    setMaxTokens(clamped)

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      if (clamped === upstreamMaxTokens) return
      updateParams.mutate(
        { maxTokens: clamped },
        {
          onError: () => {
            setMaxTokens(upstreamMaxTokens)
          }
        }
      )
    }, DEBOUNCE_MS)
  }

  const isPromptSaving =
    updateParams.isPending &&
    updateParams.variables?.systemPrompt !== undefined
  const isMaxTokensSaving =
    updateParams.isPending &&
    updateParams.variables?.maxTokens !== undefined

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sliders className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Model Parameters
        </h3>
      </div>

      <div className="space-y-4 font-mono text-xs">
        {/* Target Engine (read-only) */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
          <span className="text-[10px] text-slate-500 uppercase">
            Target Engine:
          </span>
          {isLoading ? (
            <div className="text-slate-500 text-xs">Loading…</div>
          ) : activeLlm ? (
            <>
              <div className="text-white font-extrabold text-xs">
                {activeLlm.name}
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                  {activeLlm.size} RAM
                </span>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {activeLlm.quantization}
                </span>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs">
              No active model — set one in Settings.
            </div>
          )}
        </div>

        {/* System Context Prompt (auto-save on blur) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label
              htmlFor="model-params-system-prompt"
              className="text-[9px] text-slate-400 font-bold uppercase tracking-wide"
            >
              System Context Prompt:
            </label>
            {isPromptSaving && (
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
            )}
          </div>
          <textarea
            id="model-params-system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            onBlur={handlePromptBlur}
            maxLength={PROMPT_MAX_LENGTH}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-800 p-2 text-slate-200 rounded-lg font-sans text-xs leading-relaxed min-h-[90px] outline-none focus:border-slate-700 resize-y"
            placeholder="You are a high-fidelity local LLM expert…"
          />
        </div>

        {/* Max Out Tokens (debounced auto-save) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
            <span>Max Out Tokens:</span>
            <span className="flex items-center gap-1.5">
              <span className="text-indigo-400 font-extrabold">
                {maxTokens} tokens
              </span>
              {isMaxTokensSaving && (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              )}
            </span>
          </div>
          <input
            type="range"
            min={MAX_TOKENS_MIN}
            max={MAX_TOKENS_MAX}
            step={1}
            value={maxTokens}
            onChange={(e) => handleMaxTokensChange(Number(e.target.value))}
            disabled={isLoading}
            className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-950 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}
