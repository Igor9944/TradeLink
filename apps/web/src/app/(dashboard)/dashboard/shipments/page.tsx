'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Truck,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Boxes,
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
import { shipmentsService } from '@/services/shipments.service'
import { formatDate } from '@/lib/utils'
import type { Shipment } from '@/types'
import { useTranslate } from '@/lib/use-translate'
import { useAuthStore } from '@/stores/authStore'
import { getLocalizedValue } from '@/lib/translations'

export default function ShipmentsPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shipments-list'],
    queryFn: shipmentsService.getAll,
    staleTime: 30000,
  })

  const shipments: Shipment[] = data ?? []

  const filteredShipments = shipments.filter((shp) => {
    const matchesSearch =
      shp.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (shp.order?.orderNumber.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (typeof shp.transporter?.displayName === 'string'
        ? shp.transporter.displayName.toLowerCase().includes(search.toLowerCase())
        : Object.values(shp.transporter?.displayName ?? {}).some((name) =>
            name?.toLowerCase().includes(search.toLowerCase()),
          ))
    const matchesStatus = statusFilter === 'ALL' || shp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const inTransit = filteredShipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY').length
  const now = new Date()
  const deliveredThisMonth = filteredShipments.filter((shipment) => {
    if (shipment.status !== 'DELIVERED' || !shipment.deliveredAt) return false
    const deliveredAt = new Date(shipment.deliveredAt)
    return deliveredAt.getMonth() === now.getMonth() && deliveredAt.getFullYear() === now.getFullYear()
  }).length
  const completedShipments = filteredShipments.filter((shipment) => ['DELIVERED', 'FAILED', 'RETURNED'].includes(shipment.status))
  const successRate = completedShipments.length
    ? Math.round((completedShipments.filter((shipment) => shipment.status === 'DELIVERED').length / completedShipments.length) * 100)
    : null
  const transitDurations = filteredShipments
    .filter((shipment) => shipment.status === 'DELIVERED' && shipment.deliveredAt)
    .map((shipment) => (new Date(shipment.deliveredAt!).getTime() - new Date(shipment.createdAt).getTime()) / 86400000)
    .filter((days) => Number.isFinite(days) && days >= 0)
  const averageTransitDays = transitDurations.length
    ? (transitDurations.reduce((total, days) => total + days, 0) / transitDurations.length).toFixed(1)
    : null

  const statusTabs = [
    { id: 'ALL', label: 'Toutes' },
    { id: 'IN_TRANSIT', label: 'En transit' },
    { id: 'OUT_FOR_DELIVERY', label: 'En cours de livraison' },
    { id: 'DELIVERED', label: 'Livrées' },
    { id: 'ASSIGNED', label: 'Assignée' },
    { id: 'PICKUP', label: 'Enlèvement prévu' },
    { id: 'PICKED_UP', label: 'Enlevée' },
    { id: 'FAILED', label: 'Échec' },
    { id: 'RETURNED', label: 'Retournée' },
  ] as const

  return (
    <div className="space-y-6 animate-entrance">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Logistique')}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--ink)]">{t('Expéditions')}</span>
          </div>
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">
            {t('Expéditions & Fret International')}
          </h1>
          <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
            {t('Suivi des statuts et des dates de livraison estimées')}
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-6)]">
        {/* Card 1: Expéditions en Cours */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Expéditions en cours')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--accent)] mt-2">{inTransit}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('En transit ou en cours de livraison')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
              <Truck className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('En cours de livraison')}</span>
            <span className="font-mono text-[var(--success)]">
              {filteredShipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length}
            </span>
          </div>
        </Card>

        {/* Card 2: Livrées ce mois */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Livrées ce mois')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--success)] mt-2">{deliveredThisMonth}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Émargement numérique validé')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Taux de réussite')}</span>
            <span className="font-mono text-[var(--success)]">{successRate === null ? '—' : `${successRate}%`}</span>
          </div>
        </Card>

        {/* Card 3: Délai Moyen */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Délai moyen d’acheminement')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-[var(--step-h3)] font-mono text-[var(--accent)]">{averageTransitDays ? `${averageTransitDays} ${t('jours')}` : '—'}</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--warning-bg)] flex items-center justify-center">
              <Clock className="h-6 w-6 text-[var(--warning)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Expéditions terminées')}</span>
            <span className="font-mono text-[var(--ink)]">{completedShipments.length}</span>
          </div>
        </Card>
      </div>

      {/* Filter Bar - Table Filter Bar Pattern */}
      <QueryFeedback isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
      <Card variant="default" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[var(--step-h3)] font-semibold text-[var(--accent)]">{t('Expéditions')}</h2>
            <Badge variant="neutral">{filteredShipments.length}</Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-light)]" />
              <Input
                type="text"
                placeholder={t('Rechercher par n° de suivi, transporteur, ville...')}
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

        {/* Shipments Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">{t('N° Suivi (Tracking)')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Commande liée')}</TableHead>
                <TableHead>{t('Transporteur partenaire')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('Itinéraire fret')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Livraison estimée')}</TableHead>
                <TableHead className="text-center">{t('Statut étape')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length > 0 ? (
                filteredShipments.map((shp) => (
                  <ShipmentTableRow key={shp.id} shipment={shp} locale={locale} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
                        <Truck className="h-7 w-7 text-[var(--accent)]" />
                      </div>
                      <p className="font-medium text-[var(--ink)]">{t('Aucune expédition trouvée')}</p>
                      <p className="text-[var(--step-sm)] text-[var(--muted)] max-w-sm">{t('Essayez de modifier vos filtres ou votre recherche.')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
      </Card>
    </div>
  )
}

function ShipmentTableRow({ shipment, locale }: { shipment: Shipment; locale: 'fr' | 'en' | 'ar' }) {
  const t = useTranslate()
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[var(--success-bg)]">
            <Truck className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--ink)] text-[var(--step-body)]">{shipment.shipmentNumber}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell font-mono text-[var(--step-sm)] text-[var(--accent)]">{shipment.order?.orderNumber ?? shipment.orderId}</TableCell>
      <TableCell className="text-[var(--ink)]">
        {typeof shipment.transporter?.displayName === 'string'
          ? shipment.transporter.displayName
          : getLocalizedValue(shipment.transporter?.displayName, locale) || shipment.transporter?.email || t('Non assigné')}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-[var(--step-sm)] text-[var(--muted)]">
          <span className="truncate max-w-[140px]">{shipment.order?.orderNumber ?? shipment.orderId}</span>
          <ArrowRight className="h-3 w-3 text-[var(--muted-light)] flex-shrink-0" />
          <span className="font-medium text-[var(--muted)]">{t('Destination indisponible')}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-[var(--step-sm)] text-[var(--muted)]">
        {shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery, 'short', locale) : t('Non planifiée')}
      </TableCell>
      <TableCell className="text-center">
        <ShipmentStatusBadge status={shipment.status} />
      </TableCell>
    </TableRow>
  )
}

function ShipmentStatusBadge({ status }: { status: string }) {
  const t = useTranslate()
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    DELIVERED: { label: 'Livrée', variant: 'success' },
    OUT_FOR_DELIVERY: { label: 'En cours de livraison', variant: 'info' },
    IN_TRANSIT: { label: 'En transit', variant: 'info' },
    PICKED_UP: { label: 'Enlevée', variant: 'success' },
    ASSIGNED: { label: 'Assignée', variant: 'warning' },
    PICKUP: { label: 'Enlèvement prévu', variant: 'warning' },
    FAILED: { label: 'Échec', variant: 'danger' },
    RETURNED: { label: 'Retournée', variant: 'danger' },
  }

  const current = map[status] || { label: status, variant: 'neutral' }

  return <Badge variant={current.variant} className="text-[11px]">{t(current.label)}</Badge>
}