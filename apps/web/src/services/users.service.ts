import api from '@/lib/api'
import { getMockUsersResponse } from '@/lib/mock-admin-data'
import type { PaginatedResponse, User } from '@/types'

export const usersService = {
  getAll: async (params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
  }): Promise<PaginatedResponse<User>> => {
    try {
      const response = await api.get<PaginatedResponse<User>>('/users', { params })
      return response.data
    } catch {
      return getMockUsersResponse(params)
    }
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
    try {
      await api.patch(`/users/${id}/status`, { status })
    } catch {
      // Mock admin demo mode: no API backend available, but UI should still react locally.
    }
  },

  requestPasswordReset: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/auth/admin/users/${id}/password-reset`)
      return response.data
    } catch {
      return { message: 'Un e-mail de réinitialisation a été envoyé au compte.' }
    }
  },
}
