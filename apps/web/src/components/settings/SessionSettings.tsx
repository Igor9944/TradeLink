'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MonitorSmartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { authService, type UserSession } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === 'string') return response.data.message
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

function formatSessionDate(value: string | null): string {
  if (!value) return 'Jamais'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date indisponible'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function SessionSettings() {
  const router = useRouter()
  const currentSessionId = useAuthStore((state) => state.sessionId)
  const logout = useAuthStore((state) => state.logout)
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      setSessions(await authService.getSessions())
    } catch (error: unknown) {
      setLoadError(true)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const revoke = async (session: UserSession) => {
    setRevokingId(session.id)
    try {
      await authService.revokeSession(session.id)
      if (session.id === currentSessionId) {
        logout()
        router.replace('/login')
        return
      }
      setSessions((current) => current.filter((item) => item.id !== session.id))
      toast.success('Session révoquée.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <section
      aria-labelledby="sessions-heading"
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)] space-y-4"
    >
      <div>
        <h2 id="sessions-heading" className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
          <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
          Sessions actives
        </h2>
        <p className="mt-2 text-[var(--step-sm)] text-[var(--muted)]">
          Consultez les appareils connectés et révoquez ceux que vous ne reconnaissez pas.
        </p>
      </div>

      {isLoading ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <div className="h-16 animate-pulse rounded-[var(--radius-sm)] bg-[var(--raised)]" />
          <span className="sr-only">Chargement des sessions</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-[var(--danger)]">Impossible de charger les sessions actives.</p>
          <Button type="button" variant="secondary" onClick={() => void loadSessions()}>
            Réessayer
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <p role="status" className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] p-4 text-sm text-[var(--muted)]">
          Aucune session active.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {sessions.map((session) => {
            const isCurrent = session.id === currentSessionId
            return (
              <li key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--ink)]">
                    {session.deviceInfo || 'Appareil non identifié'}
                    {isCurrent && <span className="ml-2 text-xs font-semibold text-[var(--accent)]">Cet appareil</span>}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {session.ipAddress || 'Adresse IP indisponible'} · Dernière activité {formatSessionDate(session.lastUsedAt)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Connecté le {formatSessionDate(session.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={revokingId === session.id}
                  disabled={revokingId !== null}
                  onClick={() => void revoke(session)}
                >
                  {isCurrent ? 'Déconnecter cet appareil' : 'Révoquer'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
