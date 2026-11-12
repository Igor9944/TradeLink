import api from '@/lib/api'
import type { DashboardStats } from '@/types'

export type ActivityPeriod = '7d' | '30d' | '12m'

export interface DashboardActivity {
  period: ActivityPeriod
  points: { label: string; date?: string; orders: number; shipments: number; payments: number }[]
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },
  getActivity: async (period: ActivityPeriod): Promise<DashboardActivity> => {
    const response = await api.get('/dashboard/activity', { params: { period } })
    return response.data
  },
}
