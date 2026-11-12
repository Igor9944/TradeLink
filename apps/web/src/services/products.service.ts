import api from '@/lib/api'
import type { Category, PaginatedResponse, Product } from '@/types'

export interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  isActive?: boolean
  isPublic?: boolean
  inStock?: boolean
  lowStock?: boolean
}

export const productsService = {
  getAll: async (params?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params })
    return response.data
  },

  getManageable: async (
    params?: ProductFilters,
  ): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products/manage', { params })
    return response.data
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories')
    return response.data
  },

  createCategory: async (name: Category['name']): Promise<Category> => {
    const response = await api.post('/categories', { name })
    return response.data
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  create: async (data: {
    sku: string
    name: Product['name']
    categoryId?: string
    priceHT: number
    taxRate: number
    stockQuantity: number
    stockAlertLevel: number
    unit?: string
    isActive: boolean
    isPublic: boolean
    images?: Array<{ url: string; position: number }>
  }): Promise<Product> => {
    const response = await api.post('/products', data)
    return response.data
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },
}
