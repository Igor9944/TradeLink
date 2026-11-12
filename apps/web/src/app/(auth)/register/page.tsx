'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ShoppingBag, Building2, Truck, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth.service'
import { OrganicWaveBackground } from '@/components/visual/OrganicWaveBackground'
import { useTranslate } from '@/lib/use-translate'
import { useAuthStore } from '@/stores/authStore'
import { API_LANGUAGE_BY_LOCALE } from '@/lib/locale'

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'SUPPLIER', 'TRANSPORTER']),
})

type RegisterForm = z.infer<typeof registerSchema>

const roleOptions = [
  {
    id: 'CLIENT',
    title: 'Client Acheteur',
    subtitle: 'Importateur & Commerce',
    icon: ShoppingBag,
    badge: 'Image 2 Blue Glass',
  },
  {
    id: 'SUPPLIER',
    title: 'Fournisseur',
    subtitle: 'Producteur & Exportateur',
    icon: Building2,
    badge: 'Image 1 Logistics',
  },
  {
    id: 'TRANSPORTER',
    title: 'Transporteur',
    subtitle: 'Fret, Maritime & Terrestre',
    icon: Truck,
    badge: 'Image 3 Fleet Pulse',
  },
] as const

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslate()
  const preferredLanguage = useAuthStore((state) => state.preferredLanguage)
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState<{
    userId: string
    email: string
  } | null>(null)
  const [otpCode, setOtpCode] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CLIENT',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true)
      const response = await authService.register({
        email: data.email,
        password: data.password,
        displayName: `${data.firstName} ${data.lastName}`.trim(),
        phone: data.phone || undefined,
        role: data.role,
        preferredLang: API_LANGUAGE_BY_LOCALE[preferredLanguage],
      })
      setPendingVerification({ userId: response.userId, email: data.email })
      toast.success(t('Un code de vérification a été envoyé à votre adresse email.'))
    } catch (error: any) {
      toast.error(t(error.response?.data?.message || 'Erreur lors de l\'inscription.'))
    } finally {
      setLoading(false)
    }
  }

  const verifyRegistration = async () => {
    if (!pendingVerification) return

    try {
      setLoading(true)
      await authService.verifyOtp(pendingVerification.userId, otpCode)
      toast.success(t('Votre adresse email est vérifiée. Vous pouvez vous connecter.'))
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

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6 text-center">
          <Link href="/" className="mb-3 inline-block transition-transform hover:scale-[1.01]">
            <Image
              src="/logo-wordmark.png"
              alt="TradeLink"
              width={732}
              height={158}
              sizes="204px"
              className="mx-auto h-[44px] w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
            {t('Rejoignez le réseau TradeLink')}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t('Créez votre compte B2B professionnel en quelques étapes')}
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(8,44,85,0.06)] sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {pendingVerification ? (
              <>
                <p className="text-sm text-slate-600">
                  {t('Saisissez le code à 6 chiffres envoyé à')} <strong>{pendingVerification.email}</strong>.
                </p>
                <Input
                  label={t('Code de vérification')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                  required
                />
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-semibold"
                  loading={loading}
                  disabled={otpCode.length !== 6}
                  onClick={verifyRegistration}
                >
                  {t('Vérifier mon adresse')}
                </Button>
              </>
            ) : (
              <>
            {/* Visual Role Selector Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                {t('Votre profil d’activité')} <span className="text-danger-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => {
                  const isSelected = selectedRole === opt.id
                  const Icon = opt.icon

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setValue('role', opt.id, { shouldValidate: true })}
                      className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-bg)] ring-2 ring-[var(--accent)]/10'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--raised)]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#0038ff] text-white flex items-center justify-center">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <div className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                        isSelected ? 'bg-[var(--accent)] text-white' : 'bg-[var(--raised)] text-[var(--muted)]'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {t(opt.title)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {t(opt.subtitle)}
                      </span>
                    </button>
                  )
                })}
              </div>
              <input type="hidden" {...register('role')} />
              {errors.role && (
                <p className="mt-1 text-xs text-danger-500">{errors.role.message}</p>
              )}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Input
                label={t('Prénom')}
                placeholder={t('Mohamed')}
                {...register('firstName')}
                error={errors.firstName?.message ? t(errors.firstName.message) : undefined}
                required
              />
              <Input
                label={t('Nom')}
                placeholder={t('Ben Ali')}
                {...register('lastName')}
                error={errors.lastName?.message ? t(errors.lastName.message) : undefined}
                required
              />
            </div>

            <Input
              label={t('Email professionnel')}
              type="email"
              placeholder={t('vous@entreprise.com')}
              {...register('email')}
              error={errors.email?.message ? t(errors.email.message) : undefined}
              required
            />

            <Input
              label={t('Numéro de téléphone')}
              type="tel"
              placeholder="+216 12 345 678"
              {...register('phone')}
              error={errors.phone?.message ? t(errors.phone.message) : undefined}
            />

            <Input
              label={t('Mot de passe')}
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message ? t(errors.password.message) : undefined}
              required
            />

            <div className="flex items-start pt-1">
              <input
                type="checkbox"
                required
                id="terms"
                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-[#0038ff] focus:ring-[#0038ff]"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-slate-600">
                {t('J’accepte les')}{' '}
                <Link href="/terms" className="font-semibold text-[#0038ff] hover:underline">
                  {t('conditions d’utilisation')}
                </Link>{' '}
                {t('et la')}{' '}
                <Link href="/privacy" className="font-semibold text-[#0038ff] hover:underline">
                  {t('politique de confidentialité')}
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-semibold mt-2"
              loading={loading}
            >
              {t('Créer mon compte')}
            </Button>
              </>
            )}
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            {t('Vous avez déjà un compte ?')}{' '}
            <Link
              href="/login"
              className="font-semibold text-[#0038ff] hover:text-blue-700 transition-colors"
            >
              {t('Se connecter')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
