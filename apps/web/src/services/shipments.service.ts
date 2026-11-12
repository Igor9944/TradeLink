import api from '@/lib/api'
import { getMockShipmentsResponse } from '@/lib/mock-admin-data'
import type { Shipment } from '@/types'

export const shipmentsService = {
  getAll: async (): Promise<Shipment[]> => {
    try {
      const response = await api.get<Shipment[]>('/shipments')
      return response.data
    } catch {
      return getMockShipmentsResponse()
    }
  },

  getById: async (id: string): Promise<Shipment> => {
    const response = await api.get(`/shipments/${id}`)
    return response.data
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<Shipment> => {
    const response = await api.patch(`/shipments/${id}/status`, { status, notes })
    return response.data
  },
}
