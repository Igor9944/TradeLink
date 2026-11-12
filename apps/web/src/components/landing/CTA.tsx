'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslate } from '@/lib/use-translate'

export function CTA() {
  const t = useTranslate()
  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="border-y border-[var(--border)] bg-[var(--accent-bg)] px-4 py-14 sm:px-8 sm:py-16 lg:px-12"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h2
            id="cta-heading"
            className="text-2xl font-bold tracking-[-0.03em] text-[var(--ink)] sm:text-3xl"
          >
            {t('Prêt à mieux suivre vos échanges commerciaux ?')}
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            {t('Créez votre compte ou connectez-vous pour accéder à votre espace TradeLink.')}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            {t('Créer un compte')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            {t('Se connecter')}
          </Link>
        </div>
      </div>
    </section>
  )
}
