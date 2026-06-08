import { Elysia } from 'elysia'
import { omlxService } from './service'

export const omlxModule = new Elysia({ prefix: '/omlx' }).get(
  '/status',
  async () => await omlxService.getStatus()
)
