// Subset of the real macmon JSON shape that the dashboard renders.
// Extra fields (ecpu_freqs, mac_model, etc.) are present at runtime
// and ignored by the consumer.

export interface MacmonSnapshot {
  all_power: number
  ane_power: number
  cpu_power: number
  cpu_usage_pct: number
  ecpu_usage: [number, number]
  gpu_power: number
  gpu_ram_power: number
  gpu_usage: [number, number]
  memory: {
    ram_total: number
    ram_usage: number
    swap_total: number
    swap_usage: number
  }
  pcpu_usage: [number, number]
  ram_power: number
  soc: {
    chip_name: string
    ecpu_cores: number
    ecpu_freqs?: number[]
    ecpu_label?: string
    gpu_cores: number
    gpu_freqs?: number[]
    mac_model?: string
    memory_gb?: number
    pcpu_cores: number
    pcpu_freqs?: number[]
    pcpu_label?: string
  }
  sys_power: number
  temp: { cpu_temp_avg: number; gpu_temp_avg: number }
  timestamp: string
}
