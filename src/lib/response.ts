export interface ApiResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  details?: unknown
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiError

export function wrapResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function createError(error: string, details?: unknown): ApiError {
  return details
    ? { success: false, error, details }
    : { success: false, error }
}
