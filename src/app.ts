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
  .onAfterHandle({ as: 'global' }, ({ responseValue, set }) => {
    if (
      typeof responseValue === 'object' &&
      responseValue !== null &&
      'success' in responseValue
    ) {
      return responseValue
    }
    set.headers['X-Content-Type-Options'] = 'nosniff'
    return wrapResponse(responseValue)
  })
  .use(apiRouter)
  .get('/', () => 'Hello Elysia')
  .listen(config.PORT)
