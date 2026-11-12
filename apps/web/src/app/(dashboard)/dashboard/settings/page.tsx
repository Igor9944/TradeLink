'use client'

import { useState } from 'react'
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  MonitorSmartphone,
  Smartphone,
  Globe,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  SlidersHorizontal,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { MfaSettings } from '@/components/settings/MfaSettings'
import { SessionSettings } from '@/components/settings/SessionSettings'
import { APP_LOCALES } from '@/lib/locale'
import { useTranslate } from '@/lib/use-translate'

/* ------------------------------------------------------------------ */
/*  Types                                                                */
/* ------------------------------------------------------------------ */
type TabId = 'profil' | 'securite' | 'notifications' | 'apparence'

interface TabDef {
  id: TabId
  label: string
  icon: React.ReactNode
}

/* ------------------------------------------------------------------ */
/*  Constants                                                            */
/* ------------------------------------------------------------------ */
const TABS: TabDef[] = [
  { id: 'profil', label: 'Mon Profil', icon: <User className="h-4 w-4" /> },
  { id: 'securite', label: 'Sécurité', icon: <Lock className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'apparence', label: 'Apparence', icon: <Palette className="h-4 w-4" /> },
]

const AVATAR_GRADIENTS = [
  'from-[var(--accent)] to-indigo-600',
  'from-violet-600 to-purple-600',
  'from-teal-500 to-emerald-600',
  'from-rose-500 to-pink-600',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U'
}

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

/* ------------------------------------------------------------------ */
/*  Page                                                                 */
/* ------------------------------------------------------------------ */
export default function SettingsPage() {
  const { user, preferredLanguage, setPreferredLanguage } = useAuthStore()
  const t = useTranslate()

  /* --- Active tab --------------------------------------------------- */
  const [activeTab, setActiveTab] = useState<TabId>('profil')

  /* --- Profil state ------------------------------------------------- */
  const [profil, setProfil] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: '',
    country: '',
  })

  /* --- Sécurité state ----------------------------------------------- */
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  /* --- Notifications state ------------------------------------------ */
  const [notifs, setNotifs] = useState({
    newOrders: true,
    payments: true,
    stockAlerts: false,
    shipmentUpdates: true,
    weeklyReports: false,
  })

  /* --- Apparence state ---------------------------------------------- */
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  /* --- Handlers ----------------------------------------------------- */
  const handleSave = (section: string) => {
    toast.error(`${t('Paramètres')} « ${t(section)} » ${t('ne sont pas encore reliés à l’API.')}`)
  }

  const initials = getInitials(profil.firstName, profil.lastName)
  const avatarGrad = getAvatarGradient(profil.firstName + profil.lastName)

  /* ------------------------------------------------------------------ */
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-entrance">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">{t('Paramètres & Sécurité')}</h1>
        <p className="text-[var(--step-body)] text-[var(--muted)] mt-0.5">{t('Gérez votre profil professionnel, vos préférences de notification et votre sécurité.')}</p>
      </div>

      {/* ── Pill tab bar ─────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-2 flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-full)] text-[var(--step-body)] font-medium transition-all',
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]'
            )}
          >
            {tab.icon}
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — Mon Profil                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'profil' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)] space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--accent)]" />
              Profil Professionnel
            </h2>
          </div>
          <p className="text-[var(--step-sm)] text-[var(--muted)]">Informations du compte actuellement connecté.</p>

          {/* Avatar + role badge */}
          <div className="flex items-center gap-5 p-4 bg-[var(--raised)] rounded-[var(--radius-lg)]">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'h-20 w-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold shadow-lg',
                  avatarGrad
                )}
              >
                {initials}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[var(--step-h3)] font-bold text-[var(--accent)]">{profil.firstName} {profil.lastName}</p>
              <p className="text-[var(--step-body)] text-[var(--muted)]">{profil.email}</p>
              <Badge variant="info">{user?.role || '—'}</Badge>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prénom"
              value={profil.firstName}
              onChange={(e) => setProfil((p) => ({ ...p, firstName: e.target.value }))}
              required
            />
            <Input
              label="Nom"
              value={profil.lastName}
              onChange={(e) => setProfil((p) => ({ ...p, lastName: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email – read-only with lock icon */}
            <div className="w-full">
              <label className="block text-[var(--step-body)] font-medium text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                Adresse email
                <Lock className="h-4 w-4 text-[var(--muted)]" />
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profil.email}
                  readOnly
                  className="w-full h-10 pl-4 pr-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] text-[var(--step-body)] text-[var(--muted)] cursor-not-allowed select-none"
                />
              </div>
              <p className="mt-1 text-[var(--step-sm)] text-[var(--muted)]">Contactez l&apos;administrateur pour modifier l&apos;email.</p>
            </div>

            <Input
              label="Téléphone"
              type="tel"
              value={profil.phone}
              onChange={(e) => setProfil((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Ville"
              value={profil.city}
              onChange={(e) => setProfil((p) => ({ ...p, city: e.target.value }))}
            />
            <Input
              label="Pays"
              value={profil.country}
              onChange={(e) => setProfil((p) => ({ ...p, country: e.target.value }))}
            />
          </div>

          {/* Role info row */}
          <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] bg-[rgba(31,45,230,0.05)] border border-[rgba(31,45,230,0.1)]">
            <Shield className="h-4 w-4 text-[var(--accent)] shrink-0" />
            <p className="text-[var(--step-sm)] text-[var(--accent)]">
              Votre rôle <strong>{user?.role || '—'}</strong> est géré par l&apos;administrateur système.
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4 border-t border-[var(--rule)]">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="text-[var(--step-body)] font-medium"
              onClick={() => handleSave('Profil')}
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — Sécurité                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'securite' && (
        <div className="space-y-5">
          {/* Change password */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)] space-y-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
                <Lock className="h-5 w-5 text-[var(--accent)]" />
                Modifier le mot de passe
              </h2>
            </div>
            <p className="text-[var(--step-sm)] text-[var(--muted)]">Utilisez un mot de passe fort d&apos;au moins 12 caractères.</p>

            <Input
              label="Mot de passe actuel"
              type="password"
              placeholder="••••••••"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--rule)]">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="text-[var(--step-body)] font-medium"
                onClick={() => handleSave('Mot de passe')}
              >
                <Lock className="mr-2 h-4 w-4" />
                Mettre à jour le mot de passe
              </Button>
            </div>
          </div>

          <MfaSettings />

          <SessionSettings />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — Notifications                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)] space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
              <Bell className="h-5 w-5 text-[var(--accent)]" />
              Préférences de notifications
            </h2>
          </div>
          <p className="text-[var(--step-sm)] text-[var(--muted)]">Choisissez les événements pour lesquels vous souhaitez être alerté.</p>

          <div className="space-y-3">
            {(
              [
                {
                  key: 'newOrders',
                  label: 'Nouvelles commandes',
                  description: 'Recevez une alerte à chaque nouvelle commande passée.',
                },
                {
                  key: 'payments',
                  label: 'Paiements reçus',
                  description: 'Notifications lors de la confirmation d\'un paiement.',
                },
                {
                  key: 'stockAlerts',
                  label: 'Alertes de stock',
                  description: 'Prévenez-moi quand un article passe sous le seuil critique.',
                },
                {
                  key: 'shipmentUpdates',
                  label: 'Mises à jour des expéditions',
                  description: 'Mises à jour de statut des expéditions.',
                },
                {
                  key: 'weeklyReports',
                  label: 'Rapports hebdomadaires',
                  description: 'Résumé des performances envoyé chaque lundi matin.',
                },
              ] as { key: keyof typeof notifs; label: string; description: string }[]
            ).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] hover:bg-[var(--surface)] transition-colors"
              >
                <div>
                  <p className="text-[var(--step-body)] font-semibold text-[var(--ink)]">{item.label}</p>
                  <p className="text-[var(--step-sm)] text-[var(--muted)]">{item.description}</p>
                </div>
                <Toggle
                  checked={notifs[item.key]}
                  onChange={(val) => setNotifs((n) => ({ ...n, [item.key]: val }))}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--rule)]">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="text-[var(--step-body)] font-medium"
              onClick={() => handleSave('Notifications')}
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les préférences
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 4 — Apparence                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'apparence' && (
        <div className="space-y-5">
          {/* Language */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
            <div className="flex items-center gap-2">
              <h2 className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
                <Globe className="h-5 w-5 text-[var(--accent)]" />
                {t('Langue de l’interface')}
              </h2>
            </div>
            <p className="text-[var(--step-sm)] text-[var(--muted)]">{t('La préférence est enregistrée sur cet appareil.')}</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {APP_LOCALES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  aria-pressed={preferredLanguage === lang.value}
                  onClick={() => setPreferredLanguage(lang.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-sm)] border-2 transition-all font-medium text-[var(--step-body)]',
                    preferredLanguage === lang.value
                      ? 'border-[var(--accent)] bg-[rgba(31,45,230,0.05)] text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--raised)] text-[var(--muted)] hover:border-[rgba(31,45,230,0.3)] hover:bg-[rgba(31,45,230,0.05)]'
                  )}
                >
                  <span className="text-2xl">{lang.label}</span>
                  <span>{lang.nativeLabel}</span>
                  {preferredLanguage === lang.value && <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
            <div className="flex items-center gap-2">
              <h2 className="text-[var(--step-h3)] font-bold text-[var(--accent)] flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[var(--accent)]" />
                {t('Thème de l’interface')}
              </h2>
            </div>
            <p className="text-[var(--step-sm)] text-[var(--muted)]">{t('Choisissez comment TradeLink s’affiche sur votre écran.')}</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {(
                [
                  {
                    value: 'light',
                    label: 'Clair',
                    icon: <Sun className="h-5 w-5" />,
                    preview: 'bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200',
                    dot: 'bg-blue-500',
                  },
                  {
                    value: 'dark',
                    label: 'Sombre',
                    icon: <Moon className="h-5 w-5" />,
                    preview: 'bg-gradient-to-br from-slate-900 to-blue-950 border-slate-700',
                    dot: 'bg-indigo-400',
                  },
                  {
                    value: 'system',
                    label: 'Système',
                    icon: <MonitorSmartphone className="h-5 w-5" />,
                    preview: 'bg-gradient-to-br from-slate-100 to-slate-800 border-slate-400',
                    dot: 'bg-slate-400',
                  },
                ] as {
                  value: 'light' | 'dark' | 'system'
                  label: string
                  icon: React.ReactNode
                  preview: string
                  dot: string
                }[]
              ).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-3 p-4 rounded-[var(--radius-sm)] border-2 transition-all',
                    theme === t.value
                      ? 'border-[var(--accent)] bg-[rgba(31,45,230,0.05)]'
                      : 'border-[var(--border)] bg-[var(--raised)] hover:border-[rgba(31,45,230,0.3)] hover:bg-[rgba(31,45,230,0.05)]'
                  )}
                >
                  {/* Mini preview card */}
                  <div className={cn('h-14 w-full rounded-[var(--radius-sm)] border-2', t.preview)}>
                    <div className="p-1.5 space-y-1">
                      <div className={cn('h-1.5 w-8 rounded-full opacity-70', t.dot)} />
                      <div className={cn('h-1.5 w-12 rounded-full opacity-40', t.dot)} />
                      <div className={cn('h-1.5 w-6 rounded-full opacity-20', t.dot)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        theme === t.value ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                      )}
                    >
                      {t.icon}
                    </span>
                    <span
                      className={cn(
                        'text-[var(--step-body)] font-semibold',
                        theme === t.value ? 'text-[var(--accent)]' : 'text-[var(--ink)]'
                      )}
                    >
                      {t.label}
                    </span>
                  </div>

                  {theme === t.value && <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="text-[var(--step-body)] font-medium"
              onClick={() => handleSave('Apparence')}
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les préférences
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}