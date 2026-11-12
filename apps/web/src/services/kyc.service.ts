import api from '@/lib/api'
import type { PaginatedResponse } from '@/types'

export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface KycDocument {
  id: string
  documentType: string
  fileName: string
  fileSizeBytes: number
  mimeType: string
}

export interface KycRecord {
  id: string
  status: KycStatus
  submittedAt: string | null
  adminNotes: string | null
  user: {
    id: string
    email: string | null
    phone: string | null
    role: string
    displayName: string | Record<string, string> | null
  }
  documents: KycDocument[]
}

export const kycService = {
  getAll: async (params?: { page?: number; limit?: number; status?: KycStatus }) => {
    const response = await api.get<PaginatedResponse<KycRecord>>('/kyc', { params })
    return response.data
  },

  review: async (id: string, approved: boolean, notes: string): Promise<void> => {
    await api.patch(`/kyc/${id}/review`, { approved, notes })
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await api.get(`/kyc/documents/${id}`, { responseType: 'blob' })
    return response.data
  },
}
