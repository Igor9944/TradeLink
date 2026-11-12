'use client'

import { Bell, Search, Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { getInitials } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useTranslate } from '@/lib/use-translate'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const t = useTranslate()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      toast.error(t('La session serveur n’a pas pu être révoquée. Vous êtes déconnecté de cet appareil.'))
    } finally {
      logout()
      router.replace('/login')
    }
  }

  const localizedDisplayName =
    typeof user?.displayName === 'string'
      ? user.displayName
      : user?.displayName?.[(user.preferredLang ?? 'FR').toLowerCase() as 'fr' | 'en' | 'ar'] ??
        user?.displayName?.fr ??
        user?.displayName?.en ??
        user?.displayName?.ar
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      localizedDisplayName ||
      user.email ||
      'Utilisateur'
    : 'Utilisateur'

  return (
    <header
      className="h-16 border-b border-[var(--rule)] bg-[var(--surface)] fixed top-0 inset-x-0 lg:start-[260px] z-10"
      style={{ background: 'var(--surface)', borderColor: 'var(--rule)' }}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] rounded-[var(--radius-sm)] transition-colors"
            aria-label={t('Ouvrir le menu')}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 max-w-xl hidden sm:block">
            <div className="relative flex items-center">
              <Search className="absolute start-3.5 h-4 w-4 text-[var(--muted-light)] pointer-events-none" />
              <input
                type="text"
                placeholder={t('Rechercher commandes, produits, partenaires…')}
                className="w-full h-10 ps-10 pe-14 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--raised)] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:bg-[var(--surface)] text-[var(--step-body)] focus:outline-none focus:ring-3 focus:ring-[var(--accent)]/15 focus:border-[var(--accent)] transition-colors"
              />
              <div className="absolute end-3 hidden md:flex items-center pointer-events-none">
                <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-light)] bg-[var(--surface)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                  Cmd+K
                </kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />

          <button
            className="sm:hidden p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] rounded-[var(--radius-sm)] transition-colors"
            aria-label={t('Rechercher')}
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            className="relative p-2.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] rounded-[var(--radius-sm)] transition-colors group"
            aria-label={t('Notifications')}
          >
            <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
            <span className="absolute top-1.5 end-1.5 flex h-2.5 w-2.5">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)]" />
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[var(--rule)]">
            <div className="text-right hidden sm:block">
              <p className="text-[var(--step-body)] font-medium text-[var(--ink)] leading-tight">
                {displayName}
              </p>
              <div className="mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  {user?.role || 'CLIENT'}
                </span>
              </div>
            </div>

            <div className="p-[2px] bg-[var(--accent)] rounded-full">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[var(--ink)] flex items-center justify-center text-[var(--accent-ink)] font-semibold text-xs tracking-wide">
                {user ? getInitials(displayName) : 'U'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-[var(--radius-sm)] transition-colors"
              title={t('Déconnexion')}
              aria-label={t('Déconnexion')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}