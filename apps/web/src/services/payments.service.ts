import api from '@/lib/api'
import { getMockPaymentsResponse } from '@/lib/mock-admin-data'
import type { PaginatedResponse, Payment } from '@/types'

interface ApiPayment extends Omit<Payment, 'transactionId'> {
  externalPaymentId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
}

export const paymentsService = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Payment>> => {
    try {
      const response = await api.get<PaginatedResponse<ApiPayment>>('/payments', { params })
      return {
        ...response.data,
        data: response.data.data.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
          transactionId: payment.externalPaymentId ?? payment.stripePaymentIntentId ?? payment.stripeChargeId,
        })),
      }
    } catch {
      return getMockPaymentsResponse(params)
    }
  },

  createIntent: async (data: { invoiceId: string; amount: number; currency: string }) => {
    const response = await api.post('/payments/intent', data)
    return response.data
  },
}
