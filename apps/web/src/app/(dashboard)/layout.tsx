'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { UserRole } from '@/types'
import { useTranslate } from '@/lib/use-translate'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslate()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    initialize()
  }, [initialize])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      const returnTo = pathname === '/dashboard/rooms/join'
        ? `${pathname}${window.location.search}`
        : '/dashboard'
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`)
    }
  }, [isAuthenticated, isLoading, mounted, pathname, router])

  const routeRoles: { path: string; roles: UserRole[] }[] = [
    { path: '/dashboard/users', roles: ['ADMIN'] },
    { path: '/dashboard/audit-logs', roles: ['ADMIN'] },
    { path: '/dashboard/kyc', roles: ['ADMIN'] },
    { path: '/dashboard/accounting', roles: ['ADMIN', 'ACCOUNTANT'] },
    { path: '/dashboard/orders', roles: ['CLIENT', 'SUPPLIER', 'ADMIN'] },
    { path: '/dashboard/invoices', roles: ['CLIENT', 'SUPPLIER', 'ADMIN'] },
    { path: '/dashboard/payments', roles: ['CLIENT', 'SUPPLIER', 'ADMIN'] },
    { path: '/dashboard/shipments', roles: ['CLIENT', 'SUPPLIER', 'TRANSPORTER', 'ADMIN'] },
  ]
  const restrictedRoute = routeRoles.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`),
  )
  const hasRouteAccess =
    !restrictedRoute || (user !== null && restrictedRoute.roles.includes(user.role))

  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated && !hasRouteAccess) {
      router.replace('/dashboard')
    }
  }, [hasRouteAccess, isAuthenticated, isLoading, mounted, router])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-3 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <p className="text-[var(--muted)] text-[var(--step-body)]">{t('Chargement…')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !hasRouteAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:ps-[256px]">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="pt-16 min-h-screen">
          <div className="px-[var(--page-margin)] py-[var(--space-6)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}