import { Elysia } from 'elysia'
import { macmonService } from './service'

export const macmonModule = new Elysia({ prefix: '/macmon' }).get(
  '/snapshot',
  async () => await macmonService.getSnapshot()
)
