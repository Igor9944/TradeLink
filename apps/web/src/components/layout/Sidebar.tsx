'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  LifeBuoy,
  BarChart3,
  Settings,
  Home,
  Users,
  ShieldCheck,
  Video,
  History,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useTranslate } from '@/lib/use-translate'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: Home },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart, roles: ['CLIENT', 'SUPPLIER', 'ADMIN'] },
  { name: 'Paiements & Factures', href: '/dashboard/payments', icon: CreditCard, roles: ['CLIENT', 'SUPPLIER', 'ADMIN'] },
  { name: 'Expéditions', href: '/dashboard/shipments', icon: Truck, roles: ['CLIENT', 'SUPPLIER', 'TRANSPORTER', 'ADMIN'] },
  { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { name: 'Comptabilité', href: '/dashboard/accounting', icon: BarChart3, roles: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Utilisateurs', href: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Vérification KYC', href: '/dashboard/kyc', icon: ShieldCheck, roles: ['ADMIN'] },
  { name: 'Journal d’audit', href: '/dashboard/audit-logs', icon: History, roles: ['ADMIN'] },
  { name: 'Room Live', href: '/dashboard/rooms', icon: Video, roles: ['ADMIN', 'CLIENT', 'SUPPLIER', 'TRANSPORTER'] },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const t = useTranslate()

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 start-0 h-screen w-[260px] bg-[var(--surface)] z-50 transition-transform duration-300 ease-out flex flex-col border-e border-[var(--rule)]',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label={t('Navigation principale')}
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--rule)] px-4">
          <Link
            href="/dashboard"
            className="flex h-11 items-center rounded-[var(--radius-sm)] px-3 transition-colors hover:bg-[var(--raised)]"
            aria-label={t('TradeLink - Accueil')}
          >
            <Image
              src="/logo-wordmark.png"
              alt="TradeLink"
              width={732}
              height={158}
              sizes="160px"
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-[var(--radius-sm)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors"
            aria-label={t('Fermer le menu')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation" aria-label={t('Menu principal')}>
          {filteredNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}`))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[var(--step-body)] font-medium transition-colors relative',
                  isActive
                    ? 'text-[var(--accent)] bg-[var(--bg)]'
                    : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--muted-light)] group-hover:text-[var(--muted)]'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{t(item.name)}</span>
                {/* Active indicator: 2px underline in accent */}
                {isActive && (
                  <span
                    className="absolute bottom-0 start-3 end-3 h-[2px] bg-[var(--accent)] flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[var(--rule)] px-3 py-3">
          <Link
            href="/dashboard/settings"
            onClick={onMobileClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors text-[var(--step-body)]"
          >
            <Settings className="h-5 w-5 flex-shrink-0 text-[var(--muted-light)]" aria-hidden="true" />
            <span className="truncate">{t('Paramètres')}</span>
          </Link>
        </div>
      </aside>
    </>
  )
}