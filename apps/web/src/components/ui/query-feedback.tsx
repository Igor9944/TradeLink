'use client'

import { Button } from '@/components/ui/button'

interface QueryFeedbackProps {
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function QueryFeedback({ isLoading, isError, onRetry }: QueryFeedbackProps) {
  if (isLoading) {
    return (
      <p role="status" className="rounded-[var(--radius-sm)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        Chargement des données…
      </p>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)]/20 bg-[var(--danger-bg)] p-4">
        <p className="text-sm text-[var(--danger)]">Impossible de charger les données depuis le serveur.</p>
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    )
  }

  return null
}
