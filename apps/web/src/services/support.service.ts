import api from '@/lib/api'
import type { Ticket } from '@/types'

export const supportService = {
  getAll: async (): Promise<Ticket[]> => {
    const response = await api.get<Ticket[]>('/tickets')
    return response.data
  },

  create: async (data: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.post<Ticket>('/tickets', data)
    return response.data
  },
}
