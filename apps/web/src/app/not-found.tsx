import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Compass, FileText, Home, LayoutDashboard, Package, Sparkles } from 'lucide-react'
import { OrganicWaveBackground } from '@/components/visual/OrganicWaveBackground'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      <OrganicWaveBackground variant="subtle" className="opacity-80" />

      <header className="relative z-20 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-90">
            <Image
              src="/logo-wordmark.png"
              alt="TradeLink"
              width={732}
              height={158}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--raised)]"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Tableau de bord</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_10px_30px_rgba(8,44,85,0.05)] sm:p-12">
            <div className="mb-8 flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--raised)] text-2xl font-bold text-[var(--ink)]">
                404
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Route introuvable</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">Cette page n&apos;existe pas</p>
              </div>
            </div>

            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--raised)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                <Compass className="h-3.5 w-3.5 text-[var(--accent)]" />
                Signal perdu dans le réseau logistique
              </span>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
                Oups ! Cette destination n&apos;existe pas
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Le document, l&apos;expédition ou la ressource que vous recherchez semble introuvable ou a été redirigée vers une autre destination.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] sm:w-auto"
              >
                <LayoutDashboard className="h-4 w-4" />
                Retour au tableau de bord
              </Link>

              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--raised)] sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Page d&apos;accueil
              </Link>
            </div>

            <div className="mt-10 border-t border-[var(--border)] pt-6">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Accès direct aux modules
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Link href="/dashboard/shipments" className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]">
                  <Package className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Expéditions</span>
                </Link>
                <Link href="/dashboard/invoices" className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]">
                  <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Factures</span>
                </Link>
                <Link href="/dashboard/products" className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Catalogue</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-4 text-center text-xs text-[var(--muted)]">
        TradeLink SAAS &copy; 2026 &mdash; Plateforme Import-Export &amp; Logistique
      </footer>
    </div>
  )
}
