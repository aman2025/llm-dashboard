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
  definition: string
  enabled?: boolean
}

export interface UpdateFunctionSchemaInput {
  definition?: string
  enabled?: boolean
}
