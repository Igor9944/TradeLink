'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { OrganicWaveBackground } from '@/components/visual/OrganicWaveBackground'
import { useTranslate } from '@/lib/use-translate'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

type LoginForm = z.infer<typeof loginSchema>

function getPostLoginPath() {
  const next = new URLSearchParams(window.location.search).get('next')
  if (!next) return '/dashboard'
  try {
    const url = new URL(next, window.location.origin)
    if (
      url.origin === window.location.origin &&
      url.pathname === '/dashboard/rooms/join' &&
      url.search.length <= 256 &&
      new URLSearchParams(url.search).size === 1 &&
      (url.searchParams.has('invite') || url.searchParams.has('code'))
    ) {
      return `${url.pathname}${url.search}`
    }
  } catch {
    return '/dashboard'
  }
  return '/dashboard'
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true)
      const response = await authService.login(data)
      if ('requiresMfa' in response) {
        setMfaChallengeToken(response.challengeToken)
        return
      }
      setAuth(response.user, response.accessToken, response.sessionId)
      toast.success(t('Connexion réussie ! Bienvenue sur TradeLink.'))
      router.push(getPostLoginPath())
    } catch (error: any) {
      toast.error(t(error.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.'))
    } finally {
      setLoading(false)
    }
  }

  const verifyMfa = async () => {
    if (!mfaChallengeToken || mfaCode.length !== 6) return

    try {
      setLoading(true)
      const response = await authService.verifyMfa(mfaChallengeToken, mfaCode)
      setAuth(response.user, response.accessToken, response.sessionId)
      toast.success(t('Connexion réussie ! Bienvenue sur TradeLink.'))
      router.push(getPostLoginPath())
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(t(typeof message === 'string' ? message : 'Code de vérification invalide ou expiré.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(21,88,166,0.08),transparent_42%)]" />
      <OrganicWaveBackground variant="subtle" className="opacity-75" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block transition-transform hover:scale-[1.01]">
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
            {t('Connexion à votre espace')}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t('Accédez à vos flux de commerce international')}
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(8,44,85,0.06)] sm:p-8">
          {mfaChallengeToken ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void verifyMfa()
              }}
              className="space-y-5"
            >
              <p className="text-sm text-slate-600">
                {t('Saisissez le code à 6 chiffres de votre application d’authentification.')}
              </p>
              <Input
                label={t('Code MFA')}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ''))}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-base font-semibold"
                loading={loading}
                disabled={mfaCode.length !== 6}
              >
                {t('Vérifier et se connecter')}
              </Button>
              <button
                type="button"
                className="w-full text-sm font-medium text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setMfaChallengeToken(null)
                  setMfaCode('')
                }}
              >
                {t('Retour à la connexion')}
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <Input
                label={t('Adresse email')}
                type="email"
                placeholder="vous@exemple.com"
                {...register('email')}
                error={errors.email?.message ? t(errors.email.message) : undefined}
                required
              />
            </div>

            <div className="space-y-1">
              <Input
                label={t('Mot de passe')}
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message ? t(errors.password.message) : undefined}
                required
              />
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm font-semibold text-[#0038ff] hover:text-blue-700 transition-colors"
              >
                {t('Mot de passe oublié ?')}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-semibold"
              loading={loading}
            >
              {t('Se connecter')}
            </Button>
          </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            {t('Pas encore de compte ?')}{' '}
            <Link
              href="/register"
              className="font-semibold text-[#0038ff] hover:text-blue-700 transition-colors"
            >
              {t('S’inscrire gratuitement')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
