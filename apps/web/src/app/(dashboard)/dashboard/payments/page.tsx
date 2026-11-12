'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  Search,
  Smartphone,
  Landmark,
  ShieldCheck,
  Download,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { paymentsService } from '@/services/payments.service'
import { invoicesService } from '@/services/invoices.service'
import { formatCurrency, formatCurrencyTotals, formatDate, sumByCurrency } from '@/lib/utils'
import type { Invoice, Payment } from '@/types'
import { useTranslate } from '@/lib/use-translate'
import { useAuthStore } from '@/stores/authStore'

export default function PaymentsPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payments-list', page],
    queryFn: () => paymentsService.getAll({ page, limit: 50 }),
    staleTime: 30000,
  })

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-list-summary'],
    queryFn: () => invoicesService.getAll({ page: 1, limit: 50 }),
    staleTime: 30000,
  })

  const payments: Payment[] = data?.data ?? []
  const invoices: Invoice[] = invoicesData?.data ?? []
  const linkedPayments = payments.filter((payment) => payment.invoiceId || payment.invoice?.invoiceNumber)
  const linkedInvoiceTotal = sumByCurrency(
    linkedPayments
      .filter((payment) => payment.status === 'SUCCEEDED')
      .map(({ amount, currency }) => ({ amount, currency })),
  )

  const filteredPayments = payments.filter((pay) => {
    const matchesSearch =
      (pay.invoice?.invoiceNumber ?? pay.invoiceId ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (pay.transactionId && pay.transactionId.toLowerCase().includes(search.toLowerCase()))
    const matchesMethod = methodFilter === 'ALL' || pay.provider === methodFilter
    return matchesSearch && matchesMethod
  })

  const successfulPayments = filteredPayments.filter((payment) => payment.status === 'SUCCEEDED')
  const totalProcessed = sumByCurrency(successfulPayments.map(({ amount, currency }) => ({ amount, currency })))
  const currentMonthTotals = sumByCurrency(
    successfulPayments
      .filter((payment) => {
        if (!payment.paidAt) return false
        const paidAt = new Date(payment.paidAt)
        const now = new Date()
        return paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear()
      })
      .map(({ amount, currency }) => ({ amount, currency })),
  )
  const mobileMoneyCount = filteredPayments.filter((p) => p.provider === 'CINETPAY' || p.provider === 'FEDAPAY').length
  const exportCsv = () => {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
      [t('Transaction'), t('Facture'), t('Réglé le'), t('Fournisseur'), t('Montant'), t('Devise'), t('Statut')],
      ...filteredPayments.map((payment) => [
        payment.transactionId ?? payment.id,
        payment.invoice?.invoiceNumber ?? payment.invoiceId ?? '',
        payment.paidAt ?? '',
        payment.provider,
        payment.amount,
        payment.currency,
        payment.status,
      ]),
    ]
    const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'paiements.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const methodTabs = [
    { id: 'ALL', label: 'Tous' },
    { id: 'STRIPE', label: 'Stripe' },
    { id: 'CINETPAY', label: 'CinetPay' },
    { id: 'FEDAPAY', label: 'FedaPay' },
  ] as const

  return (
    <div className="space-y-6 animate-entrance">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Finance')}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--ink)]">{t('Paiements & Factures')}</span>
          </div>
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">
            {t('Paiements & Factures associées')}
          </h1>
          <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
            {t('Chaque paiement est relié à une facture générée et à son statut de règlement.')}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            {t('Exporter')}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-[var(--step-xs)] font-medium uppercase tracking-wider text-[var(--muted)]">{t('Factures générées')}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="text-[var(--step-h3)] font-mono text-[var(--accent)]">{invoices.length}</span>
            <Badge variant="info">{t('Documents')}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[var(--step-xs)] font-medium uppercase tracking-wider text-[var(--muted)]">{t('Paiements liés')}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="text-[var(--step-h3)] font-mono text-[var(--accent)]">{linkedPayments.length}</span>
            <Badge variant="success">{t('Associés')}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[var(--step-xs)] font-medium uppercase tracking-wider text-[var(--muted)]">{t('Montant encaissé')}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="text-[var(--step-h3)] font-mono text-[var(--success)]">{formatCurrencyTotals(linkedInvoiceTotal, locale)}</span>
            <Badge variant="neutral">{t('Validé')}</Badge>
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-6)]">
        {/* Card 1: Total Encaissé */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Total encaissé')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--success)] mt-2">{formatCurrencyTotals(totalProcessed, locale)}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Paiements confirmés')}</p>
            </div>
            <Image
              src="/images/admin-icons/cash-bag.png"
              alt=""
              aria-hidden="true"
              width={52}
              height={56}
              className="h-14 w-12 shrink-0 object-contain"
            />
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Ce mois')}</span>
            <span className="font-mono text-[var(--success)]">
              {formatCurrencyTotals(currentMonthTotals, locale)}
            </span>
          </div>
        </Card>

        {/* Card 2: Mobile Money */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Autres passerelles')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-[var(--step-h3)] font-mono text-[var(--accent)]">{mobileMoneyCount}</p>
                <Badge variant="info" className="text-[11px]">{t('Transactions')}</Badge>
              </div>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">CinetPay · FedaPay</p>
            </div>
            <Image
              src="/images/admin-icons/mobile-payment.png"
              alt=""
              aria-hidden="true"
              width={48}
              height={56}
              className="h-14 w-12 shrink-0 object-contain"
            />
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Taux de succès')}</span>
            <span className="font-mono text-[var(--success)]">
              {mobileMoneyCount > 0
                ? Math.round(
                    (filteredPayments.filter((p) => (p.provider === 'CINETPAY' || p.provider === 'FEDAPAY') && p.status === 'SUCCEEDED').length /
                      mobileMoneyCount) *
                      100
                  )
                : 0}%
            </span>
          </div>
        </Card>

        {/* Card 3: Délai Moyen */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Délai moyen')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--accent)] mt-2">—</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Aucune mesure de délai disponible')}</p>
            </div>
            <Image
              src="/images/admin-icons/calendar-date.png"
              alt=""
              aria-hidden="true"
              width={48}
              height={56}
              className="h-14 w-12 shrink-0 object-contain"
            />
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Passerelle')}</span>
            <span className="font-mono text-[var(--muted)]">{t('Selon les transactions')}</span>
          </div>
        </Card>
      </div>

      {/* Filter Bar - Table Filter Bar Pattern */}
      <QueryFeedback isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
      <Card variant="default" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[var(--step-h3)] font-semibold text-[var(--accent)]">{t('Paiements & factures')}</h2>
            <Badge variant="neutral">{filteredPayments.length}</Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-light)]" />
              <Input
                type="text"
                placeholder={t('Rechercher par facture ou transaction ID...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,45,230,0.15)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {methodTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMethodFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-[var(--radius-full)] text-[var(--step-xs)] font-medium transition-all ${
                    methodFilter === tab.id
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] border border-[var(--border)]'
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">{t('Réf. Transaction')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Facture liée')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Date de règlement')}</TableHead>
                <TableHead>{t('Mode de paiement')}</TableHead>
                <TableHead className="numeric">{t('Montant')}</TableHead>
                <TableHead className="text-center">{t('Statut')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((pay) => (
                  <PaymentTableRow key={pay.id} payment={pay} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
                        <CreditCard className="h-7 w-7 text-[var(--accent)]" />
                      </div>
                      <p className="font-medium text-[var(--ink)]">{t('Aucun paiement trouvé')}</p>
                      <p className="text-[var(--step-sm)] text-[var(--muted)] max-w-sm">{t('Essayez de modifier vos filtres ou votre recherche.')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <p className="text-[var(--step-sm)] text-[var(--muted)]">
            {t('Page')} {page} · {filteredPayments.length} {t('résultat(s) sur')} {data?.meta.total ?? filteredPayments.length} {t('paiement(s)')}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>{t('Précédent')}</Button>
            <Button variant="ghost" size="sm" disabled={!data || page >= data.meta.totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>{t('Suivant')}</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PaymentTableRow({ payment }: { payment: Payment }) {
  const locale = useAuthStore((state) => state.preferredLanguage)
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[rgba(31,45,230,0.1)]">
            <CreditCard className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--ink)] text-[var(--step-body)]">{payment.transactionId || payment.id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell font-mono text-[var(--step-sm)] text-[var(--accent)]">{payment.invoice?.invoiceNumber ?? payment.invoiceId ?? '—'}</TableCell>
      <TableCell className="hidden md:table-cell text-[var(--step-sm)] text-[var(--muted)]">{payment.paidAt ? formatDate(payment.paidAt, 'short', locale) : '—'}</TableCell>
      <TableCell>
        <PaymentMethodBadge method={payment.provider} />
      </TableCell>
      <TableCell className="numeric font-mono text-[var(--accent)]">{formatCurrency(payment.amount, payment.currency, locale)}</TableCell>
      <TableCell className="text-center">
        <PaymentStatusBadge status={payment.status} />
      </TableCell>
    </TableRow>
  )
}

function PaymentMethodBadge({ method }: { method: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode }> = {
    STRIPE: { label: 'Stripe', icon: <CreditCard className="h-3 w-3" /> },
    CINETPAY: { label: 'CinetPay', icon: <Smartphone className="h-3 w-3" /> },
    FEDAPAY: { label: 'FedaPay', icon: <Landmark className="h-3 w-3" /> },
  }

  const current = map[method] || { label: method, icon: <ShieldCheck className="h-3 w-3" /> }

  return (
    <Badge variant="neutral" className="gap-1.5 text-[11px]">
      {current.icon}
      {current.label}
    </Badge>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslate()
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    SUCCEEDED: { label: 'Validé', variant: 'success' },
    PENDING: { label: 'En cours', variant: 'warning' },
    FAILED: { label: 'Échoué', variant: 'danger' },
    REFUNDED: { label: 'Remboursé', variant: 'danger' },
  }

  const current = map[status] || { label: status, variant: 'neutral' }

  return <Badge variant={current.variant} className="text-[11px]">{t(current.label)}</Badge>
}