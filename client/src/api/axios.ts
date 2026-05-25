import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// ==================== Type Definitions ====================

/** Backend success response body */
export interface ApiResponse<T> {
  success: true
  data: T
}

/** Backend error response body */
export interface ApiError {
  success: false
  error: string
  details?: unknown
}

/** Unified custom request error class */
export class ApiRequestError extends Error {
  public status: number
  public code: string
  public details: unknown

  constructor(
    message: string,
    status: number,
    code: string = 'UNKNOWN_ERROR',
    details?: unknown
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// ==================== Axios Instance ====================

export const apiClient = axios.create({
  baseURL: process.env.BUN_PUBLIC_BASE_URL || 'http://localhost:3002/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ==================== Request Interceptor ====================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // const token = localStorage.getItem('token')
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ==================== Response Interceptor ====================

apiClient.interceptors.response.use(
  // Success interceptor: aggressive unwrapping, directly return business data
  (response) => {
    const body = response.data
    // Assume backend all interfaces follow ApiResponse format
    if (body && body.success === true) {
      return body.data // Caller directly gets T
    }
    // If success response has success !== true, treat as format error
    return Promise.reject(
      new ApiRequestError(
        'Unexpected response format',
        response.status,
        'FORMAT_ERROR'
      )
    )
  },
  // Error interceptor: uniformly wrap as ApiRequestError
  (error: AxiosError<ApiError>) => {
    // 1. Server returned business error
    if (error.response?.data && error.response.data.success === false) {
      return Promise.reject(
        new ApiRequestError(
          error.response.data.error || 'An unexpected error occurred',
          error.response.status,
          'BUSINESS_ERROR',
          error.response.data.details
        )
      )
    }

    // 2. Request timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiRequestError('Request timeout', 408, 'TIMEOUT')
      )
    }

    // 3. Network error (no response)
    if (!error.response) {
      return Promise.reject(
        new ApiRequestError('Network error', 0, 'NETWORK_ERROR')
      )
    }

    // 4. Other HTTP errors (e.g. 500, but backend didn't return ApiError format)
    return Promise.reject(
      new ApiRequestError(error.message, error.response.status, 'HTTP_ERROR')
    )
  }
)
