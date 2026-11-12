'use client'

import { useTranslate } from '@/lib/use-translate'

const steps = [
  {
    number: '01',
    title: 'Créez votre espace',
    description: 'Inscrivez votre compte et choisissez votre profil sur TradeLink.',
  },
  {
    number: '02',
    title: 'Renseignez votre catalogue',
    description: 'Ajoutez vos produits et gardez leurs informations à jour.',
  },
  {
    number: '03',
    title: 'Coordonnez les commandes',
    description: 'Retrouvez les commandes et les informations utiles à leur suivi.',
  },
  {
    number: '04',
    title: 'Suivez la livraison',
    description: 'Consultez les étapes de l’expédition et les documents associés.',
  },
]

export function HowItWorks() {
  const t = useTranslate()
  return (
    <section
      id="parcours"
      aria-labelledby="how-it-works-heading"
      className="px-4 py-16 sm:px-8 sm:py-20 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
            {t('Un parcours lisible')}
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[var(--ink)] sm:text-4xl"
          >
            {t('De vos produits à leur expédition')}
          </h2>
        </div>

        <ol className="mt-10 grid gap-0 border-y border-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.number}
              className="border-b border-[var(--border)] py-6 sm:px-5 sm:py-7 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-[var(--ink)]">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t(step.description)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
