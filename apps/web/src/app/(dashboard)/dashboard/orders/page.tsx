'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingCart,
  Search,
  Package,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { ordersService } from '@/services/orders.service'
import { formatCurrency, formatCurrencyTotals, formatDate, sumByCurrency } from '@/lib/utils'
import type { Order } from '@/types'
import { useTranslate } from '@/lib/use-translate'
import { useAuthStore } from '@/stores/authStore'

export default function OrdersPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders-list', page],
    queryFn: () => ordersService.getAll({ page, limit: 50 }),
    staleTime: 30000,
  })

  const rawOrders: Order[] = data?.data ?? []

  const filteredOrders = rawOrders.filter((order) => {
    const clientName = getDisplayName(order.client, locale)
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      (order.shippingAddress &&
        order.shippingAddress.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalValue = sumByCurrency(filteredOrders.map(({ totalAmount: amount, currency }) => ({ amount, currency })))
  const activeShipments = filteredOrders.filter((o) => o.status === 'SHIPPED').length

  const statusTabs = [
    { id: 'ALL', label: 'Toutes' },
    { id: 'PENDING', label: 'En attente' },
    { id: 'CONFIRMED', label: 'Confirmées' },
    { id: 'IN_PREPARATION', label: 'En préparation' },
    { id: 'SHIPPED', label: 'Expédiées' },
    { id: 'DELIVERED', label: 'Livrées' },
    { id: 'CANCELLED', label: 'Annulées' },
    { id: 'DISPUTED', label: 'En litige' },
  ] as const

  return (
    <div className="space-y-6 animate-entrance">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Commandes')}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--ink)]">{t('Gestion des commandes')}</span>
          </div>
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">
            {t('Commandes & Bons de Commande')}
          </h1>
          <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
            {t('Suivi des accords commerciaux, livraisons et documents contractuels')}
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-6)]">
        {/* Card 1: Volume Commandes */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Volume Commandes')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--accent)] mt-2">{filteredOrders.length}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Commandes chargées')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Ce mois')}</span>
            <span className="font-mono text-[var(--ink)]">
              {filteredOrders.filter((order) => {
                const createdAt = new Date(order.createdAt)
                const now = new Date()
                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
              }).length}
            </span>
          </div>
        </Card>

        {/* Card 2: Valeur Totale */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Valeur Totale')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--success)] mt-2">{formatCurrencyTotals(totalValue, locale)}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Montants ventilés par devise')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
              <Package className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Commandes annulées')}</span>
            <span className="font-mono text-[var(--muted)]">{filteredOrders.filter((order) => order.status === 'CANCELLED').length}</span>
          </div>
        </Card>

        {/* Card 3: Expéditions Actives */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Expéditions actives')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-[var(--step-h3)] font-mono text-[var(--accent)]">{activeShipments}</p>
                <Badge variant="info" className="text-[11px]">{t('Expédiées')}</Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <Truck className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Commandes livrées')}</span>
            <span className="font-mono text-[var(--success)]">
              {filteredOrders.filter((order) => order.status === 'DELIVERED').length}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Bar - Table Filter Bar Pattern */}
      <QueryFeedback isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
      <Card variant="default" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[var(--step-h3)] font-semibold text-[var(--accent)]">{t('Commandes')}</h2>
            <Badge variant="neutral">{filteredOrders.length}</Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-light)]" />
              <Input
                type="text"
                placeholder={t('Rechercher par référence, client ou ville...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,45,230,0.15)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-[var(--radius-full)] text-[var(--step-xs)] font-medium transition-all ${
                    statusFilter === tab.id
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

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">{t('N° Commande')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Date')}</TableHead>
                <TableHead>{t('Client Acheteur')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('Destination')}</TableHead>
                <TableHead className="numeric">{t('Montant Total')}</TableHead>
                <TableHead className="text-center">{t('Statut')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderTableRow key={order.id} order={order} locale={locale} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
                        <ShoppingCart className="h-7 w-7 text-[var(--accent)]" />
                      </div>
                      <p className="font-medium text-[var(--ink)]">{t('Aucune commande trouvée')}</p>
                      <p className="text-[var(--step-sm)] text-[var(--muted)] max-w-sm">{t('Essayez de modifier vos filtres ou votre recherche.')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <p className="text-[var(--step-sm)] text-[var(--muted)]">
            {t('Page')} {page} · {filteredOrders.length} {t('résultat(s) sur')} {data?.meta.total ?? filteredOrders.length} {t('commande(s)')}
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

function OrderTableRow({ order, locale }: { order: Order; locale: 'fr' | 'en' | 'ar' }) {
  const t = useTranslate()
  const clientName = getDisplayName(order.client, locale)
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[rgba(31,45,230,0.1)]">
            <ShoppingCart className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--ink)] text-[var(--step-body)]">{order.orderNumber}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-[var(--step-sm)] text-[var(--muted)]">{formatDate(order.createdAt, 'short', locale)}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-[var(--ink)]">{clientName || t('Client')}</p>
          <p className="text-[var(--step-sm)] text-[var(--muted)] truncate max-w-[160px]">{order.client?.email || t('Email indisponible')}</p>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-[var(--step-sm)] text-[var(--muted)] truncate max-w-[180px]">{order.shippingAddress || t('Non spécifiée')}</TableCell>
      <TableCell className="numeric font-mono text-[var(--accent)]">{formatCurrency(order.totalAmount, order.currency, locale)}</TableCell>
      <TableCell className="text-center">
        <OrderStatusBadge status={order.status} />
      </TableCell>
    </TableRow>
  )
}

function getDisplayName(user: Order['client'] | undefined, locale: 'fr' | 'en' | 'ar') {
  if (!user) return ''
  if (typeof user.displayName === 'string') return user.displayName
  const language = locale
  return user.displayName?.[language] ?? user.displayName?.fr ?? user.displayName?.en ?? user.displayName?.ar ??
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
}

function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslate()
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    DELIVERED: { label: 'Livrée', variant: 'success' },
    SHIPPED: { label: 'Expédiée', variant: 'info' },
    IN_PREPARATION: { label: 'En préparation', variant: 'info' },
    CONFIRMED: { label: 'Confirmée', variant: 'success' },
    PENDING: { label: 'En attente', variant: 'warning' },
    CANCELLED: { label: 'Annulée', variant: 'danger' },
    DISPUTED: { label: 'En litige', variant: 'danger' },
    DRAFT: { label: 'Brouillon', variant: 'neutral' },
  }

  const current = map[status] || { label: status, variant: 'neutral' }

  return <Badge variant={current.variant} className="text-[11px]">{t(current.label)}</Badge>
}