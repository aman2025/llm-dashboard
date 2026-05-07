import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { apiRouter } from '@/routes'
import { AppError, getHttpStatus } from '@/lib/errors'
import { config } from '@/config'

export const app = new Elysia()
  // CORS: only allows http://localhost:3000/ and http://192.168.2.5:3000 to request; all other origins are blocked
  // .use(cors({
  //     origin: ["http://localhost:3000", "http://192.168.2.5:3000"],
  //     credentials: true
  //   }
  // ))
  .use(cors())
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = getHttpStatus(error.code)
      return { success: false, error: error.message }
    }
    console.error('Unhandled error:', error)
    set.status = 500
    return { success: false, error: 'Internal server error' }
  })
  .use(apiRouter)
  .get('/', () => ({ success: true, data: 'Hello Elysia' }))
  .listen(config.PORT)
