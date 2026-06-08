// Subset of the omlx /api/status JSON shape that the dashboard renders.
// Field names match the server response 1:1.

export interface OmlxStatus {
  status: string
  version: string
  uptime_seconds: number
  models_discovered: number
  models_loaded: number
  models_loading: number
  default_model: string
  loaded_models: string[]
  total_requests: number
  active_requests: number
  waiting_requests: number
  total_prompt_tokens: number
  total_completion_tokens: number
  total_cached_tokens: number
  cache_efficiency: number
  avg_prefill_tps: number
  avg_generation_tps: number
  model_memory_used: number
  model_memory_max: number
  model_memory_used_formatted: string
  model_memory_max_formatted: string
}
