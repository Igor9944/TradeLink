'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslate } from '@/lib/use-translate'

export function Footer() {
  const t = useTranslate()
  return (
    <footer className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label={t('TradeLink, accueil')} className="w-fit">
          <Image
            src="/logo-wordmark.png"
            alt="TradeLink — Connect, Trade, Grow"
            width={732}
            height={158}
            className="h-8 w-auto"
          />
        </Link>
        <p className="text-sm text-[var(--muted)]">
          {t('Des outils pour mieux suivre vos opérations commerciales.')}
        </p>
        <nav aria-label={t('Liens utiles')} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link className="font-medium text-[var(--ink-soft)] hover:text-[var(--accent)]" href="/login">
            {t('Se connecter')}
          </Link>
          <Link className="font-medium text-[var(--ink-soft)] hover:text-[var(--accent)]" href="/register">
            {t('Créer un compte')}
          </Link>
          <a className="font-medium text-[var(--ink-soft)] hover:text-[var(--accent)]" href="mailto:contact@tradelink.com">
            {t('Nous contacter')}
          </a>
        </nav>
      </div>
    </footer>
  )
}
