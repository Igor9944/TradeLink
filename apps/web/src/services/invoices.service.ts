import api from '@/lib/api'
import { getMockInvoicesResponse } from '@/lib/mock-admin-data'
import type { Invoice, PaginatedResponse } from '@/types'

interface ApiInvoice {
  id: string
  invoiceNumber: string
  orderId: string
  issuedAt: string | null
  dueDate: string | null
  paidAt: string | null
  totalHT: number | string
  totalTax: number | string
  totalTTC: number | string
  currency: string
  status: Invoice['status']
  createdAt: string
}

export const invoicesService = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Invoice>> => {
    try {
      const response = await api.get<PaginatedResponse<ApiInvoice>>('/invoices', { params })
      return {
        ...response.data,
        data: response.data.data.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          issueDate: invoice.issuedAt ?? invoice.createdAt,
          dueDate: invoice.dueDate,
          subtotal: Number(invoice.totalHT),
          taxAmount: Number(invoice.totalTax),
          totalAmount: Number(invoice.totalTTC),
          currency: invoice.currency,
          status: invoice.status,
          paidAt: invoice.paidAt,
        })),
      }
    } catch {
      return getMockInvoicesResponse(params)
    }
  },

  getById: async (id: string): Promise<Invoice> => {
    try {
      const response = await api.get(`/invoices/${id}`)
      return response.data
    } catch {
      return getMockInvoicesResponse().data.find((invoice) => invoice.id === id) ?? getMockInvoicesResponse().data[0]
    }
  },

  create: async (data: Partial<Invoice>): Promise<Invoice> => {
    try {
      const response = await api.post('/invoices', data)
      return response.data
    } catch {
      return {
        id: `inv-demo-${Date.now()}`,
        invoiceNumber: 'INV-DEMO',
        orderId: String(data.orderId ?? 'ord-demo'),
        issueDate: new Date().toISOString(),
        dueDate: null,
        subtotal: Number(data.subtotal ?? 0),
        taxAmount: Number(data.taxAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        currency: data.currency ?? 'TND',
        status: (data.status ?? 'DRAFT') as Invoice['status'],
        paidAt: data.paidAt ?? null,
      }
    }
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      return response.data
    } catch {
      const invoice = getMockInvoicesResponse().data.find((item) => item.id === id) ?? getMockInvoicesResponse().data[0]
      const content = `TradeLink Invoice\n\nInvoice: ${invoice.invoiceNumber}\nOrder: ${invoice.orderId}\nAmount: ${invoice.totalAmount} ${invoice.currency}\nStatus: ${invoice.status}`
      return new Blob([content], { type: 'application/pdf' })
    }
  },
}
