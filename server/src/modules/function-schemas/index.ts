import { Elysia, t } from 'elysia'
import { functionSchemasController } from './controller'
import { Models } from './models'

export const functionSchemasRouter = new Elysia({ prefix: '/function-schemas' })
  .get('/', ({ query }) => functionSchemasController.list(query), {
    query: t.Object({
      enabled: t.Optional(t.String())
    })
  })
  .get('/:id', ({ params }) => functionSchemasController.getById(params), {
    params: Models.id
  })
  .post('/', ({ body }) => functionSchemasController.create(body), {
    body: Models.create
  })
  .patch('/:id', ({ params, body }) =>
    functionSchemasController.update({ id: params.id, body })
  , {
    params: Models.id,
    body: Models.update
  })
  .patch('/:id/toggle', ({ params }) => functionSchemasController.toggle(params), {
    params: Models.id
  })
  .delete('/:id', ({ params }) => functionSchemasController.remove(params), {
    params: Models.id
  })
