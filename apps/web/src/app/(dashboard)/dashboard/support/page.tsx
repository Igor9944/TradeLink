'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LifeBuoy,
  Search,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { supportService } from '@/services/support.service'
import { formatDate } from '@/lib/utils'
import type { Ticket } from '@/types'
import { useTranslate } from '@/lib/use-translate'
import { useAuthStore } from '@/stores/authStore'

export default function SupportPage() {
  const t = useTranslate()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['support-tickets-list'],
    queryFn: supportService.getAll,
    staleTime: 30000,
  })

  const tickets: Ticket[] = data ?? []

  const filteredTickets = tickets.filter((tkt) => {
    const matchesSearch =
      tkt.subject.toLowerCase().includes(search.toLowerCase()) ||
      tkt.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      tkt.category.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'ALL' || tkt.priority === priorityFilter
    return matchesSearch && matchesPriority
  })

  const activeTickets = filteredTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length
  const resolvedTickets = filteredTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length
  const resolutionRate = filteredTickets.length > 0 ? Math.round((resolvedTickets / filteredTickets.length) * 100) : 0
  const urgentTickets = filteredTickets.filter((ticket) => ticket.priority === 'URGENT').length

  const priorityTabs = [
    { id: 'ALL', label: 'Toutes priorités' },
    { id: 'URGENT', label: 'Urgents' },
    { id: 'HIGH', label: 'Haute' },
    { id: 'MEDIUM', label: 'Moyenne' },
    { id: 'LOW', label: 'Basse' },
  ] as const

  return (
    <div className="space-y-6 animate-entrance">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Support')}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--ink)]">{t('Centre d’assistance')}</span>
          </div>
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">
            {t('Centre d’Assistance & Support')}
          </h1>
          <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
            {t('Aide aux opérations de commerce international, douanes et règlements')}
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-6)]">
        {/* Card 1: Tickets Actifs */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Tickets Actifs')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--accent)] mt-2">{activeTickets}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Demandes non résolues')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <LifeBuoy className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('En cours')}</span>
            <span className="font-mono text-[var(--ink)]">
              {filteredTickets.filter((t) => t.status === 'IN_PROGRESS').length}
            </span>
          </div>
        </Card>

        {/* Card 2: Taux de Résolution */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Taux de Résolution')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--success)] mt-2">{resolutionRate}%</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Tickets résolus ou fermés')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Total résolus')}</span>
            <span className="font-mono text-[var(--ink)]">{resolvedTickets}</span>
          </div>
        </Card>

        {/* Card 3: Priorités */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Tickets urgents')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--danger)] mt-2">{urgentTickets}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Dans les résultats filtrés')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--warning-bg)] flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('En cours')}</span>
            <span className="font-mono text-[var(--ink)]">{filteredTickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length}</span>
          </div>
        </Card>
      </div>

      {/* Filter Bar - Table Filter Bar Pattern */}
      <QueryFeedback isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
      <Card variant="default" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[var(--step-h3)] font-semibold text-[var(--accent)]">{t('Tickets')}</h2>
            <Badge variant="neutral">{filteredTickets.length}</Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-light)]" />
              <Input
                type="text"
                placeholder={t('Rechercher par objet, mot-clé ou catégorie...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,45,230,0.15)] focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {priorityTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPriorityFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-[var(--radius-full)] text-[var(--step-xs)] font-medium transition-all ${
                    priorityFilter === tab.id
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

        {/* Support Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">{t('Réf. Ticket')}</TableHead>
                <TableHead>{t('Objet de la demande')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Catégorie')}</TableHead>
                <TableHead className="text-center">{t('Priorité')}</TableHead>
                <TableHead className="text-center">{t('Statut')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('Créé le')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((tkt) => (
                  <TicketTableRow key={tkt.id} ticket={tkt} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
                        <LifeBuoy className="h-7 w-7 text-[var(--accent)]" />
                      </div>
                      <p className="font-medium text-[var(--ink)]">{t('Aucun ticket trouvé')}</p>
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

function TicketTableRow({ ticket }: { ticket: Ticket }) {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  return (
    <TableRow>
      <TableCell className="font-mono text-[var(--step-sm)] text-[var(--ink)]">{ticket.ticketNumber}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-[var(--ink)] truncate max-w-[280px]">{ticket.subject}</p>
          <p className="text-[var(--step-sm)] text-[var(--muted)] truncate max-w-[280px]">{ticket.description}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-[var(--step-sm)] text-[var(--muted)]">{t(ticket.category)}</TableCell>
      <TableCell className="text-center">
        <TicketPriorityBadge priority={ticket.priority} />
      </TableCell>
      <TableCell className="text-center">
        <TicketStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell className="hidden lg:table-cell text-[var(--step-sm)] text-[var(--muted)]">{formatDate(ticket.createdAt, 'short', locale)}</TableCell>
    </TableRow>
  )
}

function TicketPriorityBadge({ priority }: { priority: string }) {
  const t = useTranslate()
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    URGENT: { label: 'Urgent', variant: 'danger' },
    HIGH: { label: 'Haute', variant: 'warning' },
    MEDIUM: { label: 'Moyenne', variant: 'info' },
    LOW: { label: 'Basse', variant: 'neutral' },
  }

  const current = map[priority] || { label: priority, variant: 'neutral' }

  return <Badge variant={current.variant} className="text-[11px]">{t(current.label)}</Badge>
}

function TicketStatusBadge({ status }: { status: string }) {
  const t = useTranslate()
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    RESOLVED: { label: 'Résolu', variant: 'success' },
    CLOSED: { label: 'Fermé', variant: 'success' },
    IN_PROGRESS: { label: 'En cours', variant: 'info' },
    OPEN: { label: 'Nouveau', variant: 'warning' },
  }

  const current = map[status] || { label: status, variant: 'neutral' }

  return <Badge variant={current.variant} className="text-[11px]">{t(current.label)}</Badge>
}