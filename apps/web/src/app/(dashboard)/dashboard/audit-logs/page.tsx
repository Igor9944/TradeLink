'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { auditLogsService, type AdminAuditLog, type AuditAction } from '@/services/audit-logs.service'
import { formatDate } from '@/lib/utils'
import { getLocalizedValue } from '@/lib/translations'
import { useAuthStore } from '@/stores/authStore'
import { useTranslate } from '@/lib/use-translate'

const actions: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'MFA_VERIFIED',
  'MFA_RECOVERY_USED',
  'KYC_APPROVED',
  'KYC_REJECTED',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_REACTIVATED',
  'FIELD_CREATED',
  'EXPORT',
  'ROOM_STARTED',
  'ROOM_ENDED',
  'PAYMENT_PROCESSED',
]

function actorName(displayName: string | Record<string, string> | null, id: string, locale: 'fr' | 'en' | 'ar') {
  if (typeof displayName === 'string' && displayName.trim()) return displayName
  if (displayName && typeof displayName === 'object') {
    const localized = getLocalizedValue(displayName, locale)
    if (localized?.trim()) return localized
  }
  return id
}

export default function AuditLogsPage() {
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = useTranslate()
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<AuditAction | ''>('')
  const [targetType, setTargetType] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<{ action: AuditAction | ''; targetType: string }>({
    action: '',
    targetType: '',
  })
  const query = useQuery({
    queryKey: ['admin-audit-logs', page, appliedFilters],
    queryFn: () => auditLogsService.getAll({
      page,
      limit: 25,
      ...(appliedFilters.action ? { action: appliedFilters.action } : {}),
      ...(appliedFilters.targetType ? { targetType: appliedFilters.targetType } : {}),
    }),
    staleTime: 15000,
  })

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters({ action, targetType: targetType.trim() })
  }

  const logs: AdminAuditLog[] = (query.data?.data ?? []) as AdminAuditLog[]
  const pageCount = query.data?.meta.totalPages ?? 0

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">{t('Journal d’audit')}</h1>
        </div>
        <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
          {t('Consultez les actions administratives et événements de sécurité enregistrés.')}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t('Les métadonnées et adresses IP peuvent contenir des données personnelles; accès réservé aux administrateurs.')}
        </p>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] sm:items-end">
          <label className="space-y-1 text-sm font-medium text-[var(--ink)]">
            {t('Action')}
            <select
              value={action}
              onChange={(event) => setAction(
                actions.find((item) => item === event.target.value) ?? '',
              )}
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
            >
              <option value="">{t('Toutes les actions')}</option>
              {actions.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-[var(--ink)]">
            {t('Type de ressource')}
            <Input
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              maxLength={80}
              placeholder={t('Ex. USER, KYC, ORDER')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters()
              }}
            />
          </label>
          <Button type="button" variant="primary" onClick={applyFilters}>
            <Search className="h-4 w-4" aria-hidden="true" />
            {t('Filtrer')}
          </Button>
        </div>
      </Card>

      <QueryFeedback isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} />

      {!query.isLoading && !query.isError && logs.length === 0 && (
        <Card className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
          <History className="h-8 w-8 text-[var(--muted)]" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-[var(--ink)]">{t('Aucun événement trouvé')}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('Modifiez les filtres ou revenez plus tard.')}</p>
        </Card>
      )}

      {logs.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--raised)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">{t('Date')}</th>
                  <th scope="col" className="px-4 py-3">{t('Événement')}</th>
                  <th scope="col" className="px-4 py-3">{t('Acteur')}</th>
                  <th scope="col" className="px-4 py-3">{t('Ressource')}</th>
                  <th scope="col" className="px-4 py-3">{t('Contexte')}</th>
                  <th scope="col" className="px-4 py-3">{t('Détails')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">{formatDate(log.createdAt, 'short', locale)}</td>
                    <td className="px-4 py-3"><Badge variant={log.action === 'LOGIN_FAILED' ? 'warning' : 'neutral'}>{log.action.replaceAll('_', ' ')}</Badge></td>
                    <td className="max-w-48 truncate px-4 py-3 text-[var(--ink)]">
                      {log.actor ? actorName(log.actor.displayName, log.actor.id, locale) : t('Système')}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink)]">
                      <span>{log.targetType ?? '—'}</span>
                      {log.targetId && <span className="mt-1 block max-w-48 truncate font-mono text-xs text-[var(--muted)]">{log.targetId}</span>}
                    </td>
                    <td className="max-w-64 px-4 py-3 text-xs text-[var(--muted)]">
                      {log.ipAddress && <span className="block">IP : {log.ipAddress}</span>}
                      {log.userAgent && <span className="mt-1 block truncate" title={log.userAgent}>Agent : {log.userAgent}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {log.metadata == null ? '—' : (
                        <details>
                          <summary className="cursor-pointer text-[var(--accent)]">{t('Afficher')}</summary>
                          <pre className="mt-2 max-h-48 max-w-80 overflow-auto whitespace-pre-wrap break-words rounded bg-[var(--raised)] p-2 text-xs text-[var(--ink)]" dir="ltr">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">
              {query.data?.meta.total ?? 0} {t('événement(s) · Page')} {page} / {Math.max(pageCount, 1)}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => current - 1)}>
                {t('Précédent')}
              </Button>
              <Button type="button" variant="secondary" disabled={pageCount === 0 || page >= pageCount || query.isFetching} onClick={() => setPage((current) => current + 1)}>
                {t('Suivant')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
