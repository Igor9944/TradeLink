'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useTranslate } from '@/lib/use-translate'

export function Hero() {
  const t = useTranslate()
  return (
    <section aria-labelledby="hero-title" className="px-4 pb-16 pt-5 sm:px-8 sm:pb-20 lg:px-12">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" aria-label={t('TradeLink, accueil')} className="shrink-0">
          <Image
            src="/logo-wordmark.png"
            alt="TradeLink — Connect, Trade, Grow"
            width={732}
            height={158}
            className="h-6 w-auto sm:h-11"
          />
        </Link>

        <nav aria-label={t('Navigation principale')} className="flex items-center gap-3 sm:gap-6">
          <Link
            href="#features"
            className="hidden text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)] md:inline"
          >
            {t('Fonctionnalités')}
          </Link>
          <Link
            href="#parcours"
            className="hidden text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)] md:inline"
          >
            {t('Comment ça marche')}
          </Link>
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--accent)] md:inline"
          >
            {t('Se connecter')}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <span className="md:hidden">{t('Inscription')}</span>
            <span className="hidden md:inline">{t('Créer un compte')}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <div className="mx-auto mt-12 grid max-w-7xl items-center gap-10 md:mt-16 md:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
            {t('Commerce B2B, sans dispersion')}
          </p>
          <h1
            id="hero-title"
            className="max-w-[13ch] text-4xl font-bold leading-[1.06] tracking-[-0.045em] text-[var(--ink)] sm:text-5xl lg:text-6xl"
          >
            {t('Le commerce international, dans un seul espace.')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            {t('TradeLink rassemble vos produits, commandes, factures et expéditions pour vous aider à suivre vos échanges avec vos partenaires.')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              {t('Découvrir TradeLink')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="#features"
              className="min-h-11 content-center text-sm font-semibold text-[var(--ink-soft)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              {t('Voir les fonctionnalités')}
            </Link>
          </div>
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <Image
            src="/logistics-hero.webp"
            alt={t('Transport de marchandises par avion, bateau, train et camion')}
            width={720}
            height={480}
            sizes="(max-width: 768px) 100vw, 52vw"
            className="aspect-[3/2] w-full object-contain p-3 sm:p-6"
          />
          <div className="border-t border-[var(--border)] px-5 py-4 sm:px-6">
            <p className="text-sm font-semibold text-[var(--ink)]">{t('Du catalogue à l’expédition')}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t('Les informations essentielles de vos opérations, au même endroit.')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
