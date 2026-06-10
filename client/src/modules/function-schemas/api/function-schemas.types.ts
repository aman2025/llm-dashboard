export interface FunctionSchema {
  id: string
  name: string
  description: string
  parameters: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFunctionSchemaInput {
  name: string
  description: string
  parameters: string
  enabled?: boolean
}

export interface UpdateFunctionSchemaInput {
  name?: string
  description?: string
  parameters?: string
  enabled?: boolean
}
