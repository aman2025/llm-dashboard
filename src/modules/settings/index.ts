import { Elysia } from 'elysia'
import { settingsService } from './service'
import { Models } from './models'
import { AppError } from '@/lib/errors'
import { wrapResponse, createError } from '@/lib/response'

export const settingsRouter = new Elysia({ prefix: '/settings' })
  .get('/', async () => {
    const settings = await settingsService.getSettings()
    return wrapResponse(settings)
  })
  .patch('/', async ({ body, set }) => {
    const parseResult = Models.update.safeParse(body)
    if (!parseResult.success) {
      set.status = 400
      return createError('Validation failed', parseResult.error.flatten())
    }
    const settings = await settingsService.updateSettings(parseResult.data)
    return wrapResponse(settings)
  })
  .post('/llm-names', async ({ body, set }) => {
    const parseResult = Models.addLlmName.safeParse(body)
    if (!parseResult.success) {
      set.status = 400
      return createError('Validation failed', parseResult.error.flatten())
    }
    try {
      const settings = await settingsService.addLlmName(parseResult.data.name)
      return wrapResponse(settings)
    } catch (error: unknown) {
      if (error instanceof AppError && error.code === 'CONFLICT') {
        set.status = 409
        return createError(error.message)
      }
      throw error
    }
  })
  .delete('/llm-names/:name', async ({ params, set }) => {
    const name = decodeURIComponent(params.name)
    try {
      const settings = await settingsService.removeLlmName(name)
      return wrapResponse(settings)
    } catch (error: unknown) {
      if (error instanceof AppError && error.code === 'NOT_FOUND') {
        set.status = 404
        return createError(error.message)
      }
      throw error
    }
  })
