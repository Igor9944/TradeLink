'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Copy, KeyRound, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === 'string') return response.data.message
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export function MfaSettings() {
  const { updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [setup, setSetup] = useState<{ secret: string; otpAuthUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const loadStatus = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const profile = await authService.getProfile()
      setIsEnabled(Boolean(profile.mfaEnabled))
      updateUser({ mfaEnabled: Boolean(profile.mfaEnabled) })
    } catch (error: unknown) {
      setLoadError(true)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [updateUser])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const beginSetup = async () => {
    setIsSubmitting(true)
    try {
      setSetup(await authService.setupMfa())
      setCode('')
      setRecoveryCodes([])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const enable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6) return

    setIsSubmitting(true)
    try {
      const result = await authService.enableMfa(code)
      setIsEnabled(true)
      setSetup(null)
      setCode('')
      setRecoveryCodes(result.recoveryCodes)
      updateUser({ mfaEnabled: true })
      toast.success('Authentification à deux facteurs activée.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const disable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6) return

    setIsSubmitting(true)
    try {
      await authService.disableMfa(code)
      setIsEnabled(false)
      setCode('')
      setRecoveryCodes([])
      updateUser({ mfaEnabled: false })
      toast.success('Authentification à deux facteurs désactivée.')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      toast.success('Codes de récupération copiés.')
    } catch {
      toast.error('Impossible de copier les codes. Copiez-les manuellement.')
    }
  }

  return (
    <section
      aria-labelledby="mfa-heading"
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)] space-y-4"
    >
      <div>
        <h2 id="mfa-heading" className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
          <Shield className="h-5 w-5" aria-hidden="true" />
          Authentification à deux facteurs
        </h2>
        <p className="mt-2 text-[var(--step-sm)] text-[var(--muted)]">
          Ajoutez un code généré par une application d’authentification à votre connexion.
        </p>
      </div>

      {isLoading ? (
        <div role="status" aria-busy="true" className="h-12 rounded-[var(--radius-sm)] bg-[var(--raised)] animate-pulse">
          <span className="sr-only">Chargement de l’état MFA</span>
        </div>
      ) : isEnabled === null ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-[var(--danger)]">
            {loadError ? 'Impossible de vérifier l’état MFA.' : 'État MFA indisponible.'}
          </p>
          <Button type="button" variant="secondary" onClick={() => void loadStatus()}>
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          <p role="status" className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] p-3 text-[var(--step-sm)] text-[var(--ink)]">
            <span className={`h-2.5 w-2.5 rounded-full ${isEnabled ? 'bg-emerald-600' : 'bg-[var(--muted-light)]'}`} aria-hidden="true" />
            {isEnabled ? 'La double authentification est activée.' : 'La double authentification est désactivée.'}
          </p>

          {recoveryCodes.length > 0 && (
            <div className="space-y-3 rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 p-4 text-slate-900">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">Enregistrez vos codes de récupération</h3>
                  <p className="mt-1 text-sm">
                    Chaque code ne peut être utilisé qu’une seule fois. Ils ne seront plus affichés après avoir quitté cette page.
                  </p>
                </div>
              </div>
              <ul aria-label="Codes de récupération" className="grid gap-2 font-mono text-sm sm:grid-cols-2">
                {recoveryCodes.map((recoveryCode) => <li key={recoveryCode}>{recoveryCode}</li>)}
              </ul>
              <Button type="button" variant="secondary" size="sm" onClick={copyRecoveryCodes}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copier les codes
              </Button>
            </div>
          )}

          {!isEnabled && !setup && (
            <Button type="button" onClick={beginSetup} loading={isSubmitting}>
              <Shield className="h-4 w-4" aria-hidden="true" />
              Configurer le MFA
            </Button>
          )}

          {!isEnabled && setup && (
            <form onSubmit={enable} className="space-y-4">
              <div className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] p-4">
                <h3 className="font-semibold text-[var(--ink)]">Ajoutez TradeLink à votre application</h3>
                <p className="text-sm text-[var(--muted)]">
                  Saisissez cette clé dans une application compatible TOTP, puis confirmez avec le code à 6 chiffres.
                </p>
                <code className="block break-all rounded bg-[var(--surface)] p-3 font-mono text-sm text-[var(--ink)]">
                  {setup.secret}
                </code>
                <p className="text-xs text-[var(--muted)]">
                  Gardez cette clé privée. La configuration n’est pas activée tant que le code n’a pas été vérifié.
                </p>
              </div>
              <Input
                label="Code de l’application"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                required
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={isSubmitting} disabled={code.length !== 6}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Vérifier et activer
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setSetup(null); setCode('') }}>
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {isEnabled && (
            <form onSubmit={disable} className="space-y-3">
              <Input
                label="Code de l’application pour désactiver le MFA"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                required
              />
              <Button type="submit" variant="secondary" loading={isSubmitting} disabled={code.length !== 6}>
                Désactiver le MFA
              </Button>
            </form>
          )}
        </>
      )}
    </section>
  )
}
