import api from '@/lib/api'
import type { Order, PaginatedResponse } from '@/types'

interface ApiOrder extends Omit<Order, 'totalAmount' | 'shippingAddress'> {
  totalTTC: number | string
  deliveryAddress: { street?: string; city?: string; country?: string } | null
}

export const ordersService = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<ApiOrder>>('/orders', { params })
    return {
      ...response.data,
      data: response.data.data.map((order) => ({
        ...order,
        totalAmount: Number(order.totalTTC),
        shippingAddress: [
          order.deliveryAddress?.street,
          order.deliveryAddress?.city,
          order.deliveryAddress?.country,
        ].filter(Boolean).join(', '),
      })),
    }
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  create: async (data: Partial<Order>): Promise<Order> => {
    const response = await api.post('/orders', data)
    return response.data
  },

  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    const response = await api.patch(`/orders/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.patch(`/orders/${id}/cancel`)
  },
}
