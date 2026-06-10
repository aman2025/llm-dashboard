/* eslint-disable no-console */
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { apiRouter } from '@/routes'
import { AppError } from '@/lib/errors'
import { wrapResponse, createError } from '@/lib/response'
import { config } from '@/config'

export const app = new Elysia()
  .use(cors())
  .error({ AppError })
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status
      return createError(error.message)
    }
    console.error('Unhandled error:', error)
    set.status = 500
    return createError('Internal server error')
  })
  .onAfterHandle({ as: 'global' }, ({ response, set, path }) => {
    // Don't wrap streaming responses or responses that already have success field
    if (
      response instanceof ReadableStream ||
      (typeof response === 'object' &&
        response !== null &&
        'success' in response)
    ) {
      return response
    }

    // Skip wrapping entirely for streaming endpoints
    if (path === '/api/chat/stream' || path === '/api/evaluation/stream') {
      return response
    }

    set.headers['X-Content-Type-Options'] = 'nosniff'
    return wrapResponse(response)
  })
  .use(apiRouter)
  .get('/', () => 'Hello Elysia')
  .listen(config.PORT)
