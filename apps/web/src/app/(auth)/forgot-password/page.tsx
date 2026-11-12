'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { OrganicWaveBackground } from '@/components/visual/OrganicWaveBackground'
import { useTranslate } from '@/lib/use-translate'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const t = useTranslate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const requestResetCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setLoading(true)
      await authService.forgotPassword(email)
      setCodeSent(true)
      toast.success(t('Si cette adresse existe, un code de réinitialisation a été envoyé.'))
    } catch (error: any) {
      toast.error(t(error.response?.data?.message || 'Impossible d’envoyer le code de réinitialisation.'))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setLoading(true)
      await authService.resetPassword(email, code, newPassword)
      toast.success(t('Votre mot de passe a été modifié. Vous pouvez vous connecter.'))
      router.push('/login')
    } catch (error: any) {
      toast.error(t(error.response?.data?.message || 'Code invalide ou expiré.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(21,88,166,0.08),transparent_42%)]" />
      <OrganicWaveBackground variant="subtle" className="opacity-70" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block">
            <Image
              src="/logo-wordmark.png"
              alt="TradeLink"
              width={732}
              height={158}
              sizes="204px"
              className="mx-auto h-[46px] w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            {t('Mot de passe oublié ?')}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t('Recevez un code pour sécuriser la réinitialisation de votre mot de passe.')}
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(8,44,85,0.06)] sm:p-8">
          {codeSent ? (
            <form onSubmit={resetPassword} className="space-y-5">
              <p className="text-sm text-slate-600">
                {t('Si le compte existe, le code a été envoyé à')} <strong>{email}</strong>.
              </p>
              <Input
                label={t('Code de vérification')}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                required
              />
              <Input
                label={t('Nouveau mot de passe')}
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={code.length !== 6 || newPassword.length < 8}
              >
                {t('Réinitialiser le mot de passe')}
              </Button>
            </form>
          ) : (
            <form onSubmit={requestResetCode} className="space-y-5">
              <Input
                label={t('Adresse email')}
                type="email"
                autoComplete="email"
                placeholder={t('vous@exemple.com')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                {t('Envoyer le code')}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="font-semibold text-[#0038ff] transition-colors hover:text-blue-700"
            >
              {t('Retour à la connexion')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
