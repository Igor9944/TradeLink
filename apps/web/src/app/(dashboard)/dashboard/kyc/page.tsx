'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, FileText, ShieldCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { useAuthStore } from '@/stores/authStore'
import { kycService, type KycRecord } from '@/services/kyc.service'
import { formatDate } from '@/lib/utils'
import { getLocalizedValue } from '@/lib/translations'
import { useTranslate } from '@/lib/use-translate'

export default function KycReviewPage() {
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.user?.role)
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = useTranslate()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const query = useQuery({
    queryKey: ['admin-kyc'],
    queryFn: () => kycService.getAll({ page: 1, limit: 50 }),
    enabled: role === 'ADMIN',
    staleTime: 30000,
  })
  const review = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      kycService.review(id, approved, notes[id]?.trim() ?? ''),
    onSuccess: async (_data, variables) => {
      toast.success(t(variables.approved ? 'Dossier KYC approuvé.' : 'Dossier KYC rejeté.'))
      await queryClient.invalidateQueries({ queryKey: ['admin-kyc'] })
      await queryClient.invalidateQueries({ queryKey: ['users-list'] })
    },
    onError: () => toast.error(t('Impossible d’enregistrer la décision KYC. Réessayez.')),
  })

  if (role !== 'ADMIN') {
    return <p role="alert" className="p-6 text-sm text-[var(--danger)]">{t('Accès réservé à l’administration.')}</p>
  }

  const records = query.data?.data ?? []
  const pendingRecords = records.filter((record) => record.status === 'SUBMITTED')

  const confirmReview = (id: string, approved: boolean) => {
    const action = approved ? 'approuver' : 'rejeter'
    if (!window.confirm(`${t('Confirmer la décision :')} ${t(action)} ${t('ce dossier KYC ?')}`)) return
    review.mutate({ id, approved })
  }

  const downloadDocument = async (id: string, name: string) => {
    try {
      const blob = await kycService.downloadDocument(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = name
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('Le document ne peut pas être téléchargé.'))
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header>
        <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">{t('Vérification KYC')}</h1>
        <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
          {t('Examinez les justificatifs transmis avant d’activer les comptes.')}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <Badge variant={pendingRecords.length ? 'warning' : 'success'}>
          {pendingRecords.length} {t('dossier(s) à vérifier')}
        </Badge>
        <span className="text-sm text-[var(--muted)]">{records.length} {t('dossier(s) chargés')}</span>
      </div>

      <QueryFeedback isLoading={query.isLoading} isError={query.isError} onRetry={() => void query.refetch()} />

      {!query.isLoading && !query.isError && pendingRecords.length === 0 && (
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <ShieldCheck className="h-9 w-9 text-[var(--success)]" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">{t('Aucun dossier en attente')}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('Les nouveaux dossiers apparaîtront ici après le dépôt des justificatifs.')}</p>
        </Card>
      )}

      <div className="space-y-4">
        {pendingRecords.map((record: KycRecord) => {
          const userName = typeof record.user.displayName === 'string'
            ? record.user.displayName
            : getLocalizedValue(record.user.displayName, locale) || record.user.email || t('Utilisateur')
          return (
            <Card key={record.id} className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--ink)]">{userName}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{record.user.email ?? record.user.phone} · {record.user.role}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {t('Soumis le')} {record.submittedAt ? formatDate(record.submittedAt, 'short', locale) : t('date inconnue')}
                  </p>
                </div>
                <Badge variant="warning">{t('En attente de validation')}</Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[var(--ink)]">{t('Documents transmis')}</h3>
                {record.documents.length ? record.documents.map((document) => (
                  <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] bg-[var(--bg)] p-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--ink)]">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                      <span className="truncate">{document.fileName}</span>
                      <span className="text-xs text-[var(--muted)]">{t(document.documentType.replaceAll('_', ' '))}</span>
                    </span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => void downloadDocument(document.id, document.fileName)}>
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('Télécharger')}
                    </Button>
                  </div>
                )) : <p className="text-sm text-[var(--danger)]">{t('Aucun document associé au dossier.')}</p>}
              </div>

              <label className="block space-y-1 text-sm font-medium text-[var(--ink)]">
                {t('Motif de rejet (obligatoire pour refuser)')}
                <Input
                  value={notes[record.id] ?? ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [record.id]: event.target.value }))}
                  maxLength={2000}
                  placeholder={t('Saisir le motif avant de refuser')}
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={review.isPending || !record.documents.length || !(notes[record.id] ?? '').trim()}
                  onClick={() => confirmReview(record.id, false)}
                >
                  <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('Rejeter')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={review.isPending || !record.documents.length}
                  onClick={() => confirmReview(record.id, true)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('Approuver le KYC')}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
