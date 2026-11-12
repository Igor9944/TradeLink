'use client'

import Image from 'next/image'
import { useState } from 'react'
import { BookOpen, Search, Download } from 'lucide-react'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslate } from '@/lib/use-translate'
import { useAuthStore } from '@/stores/authStore'

interface AccountingEntry {
  id: string
  reference: string
  journal: string
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
  currency: string
  date: string
}

export default function AccountingPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const [search, setSearch] = useState('')
  const [journalFilter, setJournalFilter] = useState('ALL')

  const filteredEntries: AccountingEntry[] = []
  const visibleEntries = filteredEntries.filter((ent) => {
    const matchesSearch =
      ent.reference.toLowerCase().includes(search.toLowerCase()) ||
      ent.description.toLowerCase().includes(search.toLowerCase()) ||
      ent.accountCode.includes(search)
    const matchesJournal =
      journalFilter === 'ALL' || ent.journal.toLowerCase().includes(journalFilter.toLowerCase())
    return matchesSearch && matchesJournal
  })

  const journalTabs = [
    { id: 'ALL', label: 'Tous journaux' },
    { id: 'Ventes', label: 'Ventes (VT)' },
    { id: 'Banque', label: 'Banque (BQ)' },
    { id: 'TVA', label: 'TVA (OD)' },
  ] as const

  return (
    <div className="space-y-6 animate-entrance">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-title font-bold text-ledger-accent">{t('Comptabilité & Grand Livre')}</h1>
          <p className="text-body text-ledger-muted mt-0.5">{t('Journal des écritures, déclaration de TVA et rapprochement bancaire multi-devises')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled title={t('L’export sera disponible quand les écritures seront connectées.')} className="h-10 px-4 bg-ledger-surface border border-ledger-rule rounded-control text-body text-ledger-text font-medium opacity-50 cursor-not-allowed flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('Exporter FEC (CSV)')}
          </button>
        </div>
      </div>

      <p role="status" className="rounded-control border border-ledger-rule bg-ledger-surface p-4 text-body text-ledger-muted">
        {t('Le journal comptable n’est pas encore connecté à une source de données. Aucun solde ni aucune écriture fictive ne sont affichés.')}
      </p>

      {/* KPI Cards - 4 distinct compositions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gap">
        {/* Card 1: Total Débit - Large number with icon */}
        <div className="bg-ledger-surface border border-ledger-rule rounded-card p-pad">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Total Débit')}</p>
              <p className="text-kpi font-mono text-ledger-accent mt-2">—</p>
              <p className="text-small text-ledger-muted mt-1">{t('Écritures rapprochées')}</p>
            </div>
            <Image src="/images/admin-icons/invoice-documents.png" alt="" aria-hidden="true" width={40} height={48} className="h-12 w-10 shrink-0 object-contain" />
          </div>
          <div className="mt-4 h-px bg-ledger-rule" />
          <div className="mt-3 flex items-center justify-between text-small text-ledger-muted">
            <span>{t('Ce mois')}</span>
            <span className="font-mono text-ledger-text">—</span>
          </div>
        </div>

        {/* Card 2: Total Crédit - Prominent badge style */}
        <div className="bg-ledger-surface border border-ledger-rule rounded-card p-pad">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Total Crédit')}</p>
              <p className="text-kpi font-mono text-ledger-positive mt-2">—</p>
              <p className="text-small text-ledger-muted mt-1">{t('Données indisponibles')}</p>
            </div>
            <Image src="/images/admin-icons/cash-bag.png" alt="" aria-hidden="true" width={40} height={48} className="h-12 w-10 shrink-0 object-contain" />
          </div>
          <div className="mt-4 h-px bg-ledger-rule" />
          <div className="mt-3 flex items-center justify-between text-small text-ledger-muted">
            <span>{t('vs Débit')}</span>
            <span className="font-mono text-ledger-text">—</span>
          </div>
        </div>

        {/* Card 3: TVA Collectée - Metric with badge */}
        <div className="bg-ledger-surface border border-ledger-rule rounded-card p-pad">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-small font-medium text-ledger-muted uppercase tracking-wider">{t('TVA collectée')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-kpi font-mono text-ledger-warning">—</p>
                <Badge variant="warning">{t('Non disponible')}</Badge>
              </div>
            </div>
            <Image src="/images/admin-icons/calendar-date.png" alt="" aria-hidden="true" width={40} height={48} className="h-12 w-10 shrink-0 object-contain" />
          </div>
          <div className="mt-4 h-px bg-ledger-rule" />
          <div className="mt-3 flex items-center justify-between text-small text-ledger-muted">
            <span>{t('Échéance')}</span>
            <span className="font-mono text-ledger-text">—</span>
          </div>
        </div>

        {/* Card 4: Solde Trésorerie - Accent style */}
        <div className="bg-ledger-surface border border-ledger-rule rounded-card p-pad">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Solde Trésorerie')}</p>
              <p className="text-kpi font-mono text-ledger-accent mt-2">—</p>
              <p className="text-small text-ledger-muted mt-1">{t('Actifs disponibles')}</p>
            </div>
            <Image src="/images/admin-icons/bank-building.png" alt="" aria-hidden="true" width={44} height={48} className="h-12 w-11 shrink-0 object-contain" />
          </div>
          <div className="mt-4 h-px bg-ledger-rule" />
          <div className="mt-3 flex items-center justify-between text-small text-ledger-muted">
            <span>{t('Disponible')}</span>
            <span className="font-mono text-ledger-positive">—</span>
          </div>
        </div>
      </div>

      {/* Filter Bar - Table Filter Bar Pattern */}
      <div className="bg-ledger-surface border border-ledger-rule rounded-card overflow-hidden">
        <div className="px-pad py-4 border-b border-ledger-rule bg-ledger-ground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-section font-bold text-ledger-accent">{t('Écritures Comptables')}</h2>
            <Badge variant="neutral">{visibleEntries.length}</Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-muted" />
              <input
                type="text"
                placeholder={t('Rechercher par référence, libellé ou compte (ex. 707000)...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-ledger-surface border border-ledger-rule rounded-control text-body text-ledger-text placeholder:text-ledger-muted focus:outline-none focus:ring-2 focus:ring-ledger-brand-cobalt/20 focus:border-ledger-brand-cobalt transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {journalTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setJournalFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-control text-small font-medium transition-all ${
                    journalFilter === tab.id
                      ? 'bg-ledger-accent text-white'
                      : 'bg-ledger-surface text-ledger-muted hover:bg-ledger-raised hover:text-ledger-text border border-ledger-rule'
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accounting Table */}
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-ledger-rule">
                <th className="px-pad py-3 text-left text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Date')}</th>
                <th className="px-pad py-3 text-left text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Pièce / Écriture')}</th>
                <th className="px-pad py-3 text-left text-small font-medium text-ledger-muted uppercase tracking-wider hidden md:table-cell">{t('Journal')}</th>
                <th className="px-pad py-3 text-left text-small font-medium text-ledger-muted uppercase tracking-wider">{t('N° Compte')}</th>
                <th className="px-pad py-3 text-left text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Libellé de l’écriture')}</th>
                <th className="px-pad py-3 text-right text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Débit')}</th>
                <th className="px-pad py-3 text-right text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Crédit')}</th>
                <th className="px-pad py-3 text-right text-small font-medium text-ledger-muted uppercase tracking-wider">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-rule">
              {visibleEntries.length > 0 ? (
                visibleEntries.map((ent) => (
                  <tr key={ent.id} className="hover:bg-ledger-ground transition-colors" style={{ height: '44px' }}>
                    <td className="px-pad py-3 text-small text-ledger-muted whitespace-nowrap">{formatDate(ent.date, 'short', locale)}</td>
                    <td className="px-pad py-3 font-mono text-small text-ledger-text">{ent.reference}</td>
                    <td className="px-pad py-3 hidden md:table-cell text-small text-ledger-muted">{ent.journal}</td>
                    <td className="px-pad py-3 font-mono text-small text-ledger-brand-cobalt">{ent.accountCode}</td>
                    <td className="px-pad py-3">
                      <div>
                        <p className="font-medium text-ledger-text text-small truncate max-w-[280px]">{ent.description}</p>
                        <p className="text-xs text-ledger-muted truncate max-w-[280px]">{ent.accountName}</p>
                      </div>
                    </td>
                    <td className="px-pad py-3 text-right font-mono text-small text-ledger-text">
                      {ent.debit > 0 ? formatCurrency(ent.debit, ent.currency, locale) : <span className="text-ledger-muted">-</span>}
                    </td>
                    <td className="px-pad py-3 text-right font-mono text-small text-ledger-text">
                      {ent.credit > 0 ? formatCurrency(ent.credit, ent.currency, locale) : <span className="text-ledger-muted">-</span>}
                    </td>
                    <td className="px-pad py-3 text-right">
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-pad py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-ledger-brand-cobalt/10 flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-ledger-brand-cobalt" />
                      </div>
                      <p className="font-medium text-ledger-text">{t('Aucune écriture trouvée')}</p>
                      <p className="text-small text-ledger-muted max-w-sm">{t('Essayez de modifier vos filtres ou votre recherche.')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Footer */}
        <div className="px-pad py-4 border-t border-ledger-rule bg-ledger-ground flex items-center justify-between">
          <div className="flex items-center gap-6 text-small text-ledger-muted">
            <span className="font-medium text-ledger-text">{t('Total Débit')}: <span className="font-mono text-ledger-accent">—</span></span>
            <span className="font-medium text-ledger-text">{t('Total Crédit')}: <span className="font-mono text-ledger-positive">—</span></span>
            <span className="font-medium text-ledger-accent">{t('Solde')}: <span className="font-mono">—</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}