import api from '@/lib/api'
import { getMockAuditLogsResponse } from '@/lib/mock-admin-data'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFIED'
  | 'MFA_RECOVERY_USED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED'
  | 'FIELD_CREATED'
  | 'EXPORT'
  | 'ROOM_STARTED'
  | 'ROOM_ENDED'
  | 'PAYMENT_PROCESSED'

export interface AdminAuditLog {
  id: string
  action: AuditAction
  targetType: string | null
  targetId: string | null
  metadata: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  actor: { id: string; displayName: string | Record<string, string> | null } | null
}

export interface AdminAuditLogPage {
  data: AdminAuditLog[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export const auditLogsService = {
  getAll: async (params: { page: number; limit: number; action?: AuditAction; targetType?: string }) => {
    try {
      const response = await api.get<AdminAuditLogPage>('/admin/audit-logs', { params })
      return response.data
    } catch {
      return getMockAuditLogsResponse(params)
    }
  },
}
