export interface LlmModel {
  id: string
  name: string
  size: string
  type: string
  description: string
  fileSize: string
  quantization: string
  contextWindow: string
  isActive: boolean
}

export interface Settings {
  activeLlmId: string | null
  activeLlm: LlmModel | null
}
