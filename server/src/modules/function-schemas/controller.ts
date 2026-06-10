import { functionSchemasService } from './service'
import { AppError } from '@/lib/errors'
import type { CreateFunctionSchemaInput, UpdateFunctionSchemaInput } from './models'

export const functionSchemasController = {
  async list(query: { enabled?: string }) {
    try {
      const enabledOnly = query.enabled === 'true'
      return await functionSchemasService.list({ enabledOnly })
    } catch (error) {
      console.error('Error listing function schemas:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to list function schemas', 500)
    }
  },

  async getById({ id }: { id: string }) {
    try {
      return await functionSchemasService.getById(id)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error getting function schema:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch function schema', 500)
    }
  },

  async create(input: CreateFunctionSchemaInput) {
    try {
      return await functionSchemasService.create(input)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error creating function schema:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to create function schema', 500)
    }
  },

  async update({ id, body }: { id: string; body: UpdateFunctionSchemaInput }) {
    try {
      return await functionSchemasService.update(id, body)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error updating function schema:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to update function schema', 500)
    }
  },

  async toggle({ id }: { id: string }) {
    try {
      return await functionSchemasService.toggle(id)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error toggling function schema:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to toggle function schema', 500)
    }
  },

  async remove({ id }: { id: string }) {
    try {
      return await functionSchemasService.remove(id)
    } catch (error) {
      if (error instanceof AppError) throw error
      console.error('Error deleting function schema:', error)
      throw new AppError('INTERNAL_ERROR', 'Failed to delete function schema', 500)
    }
  }
}
