'use client'

import {
  ClipboardList,
  FileText,
  PackageSearch,
  ShieldCheck,
  Truck,
  UsersRound,
} from 'lucide-react'
import { useTranslate } from '@/lib/use-translate'

const features = [
  {
    icon: PackageSearch,
    title: 'Catalogue et stocks',
    description: 'Centralisez vos fiches produits, leurs prix et les quantités disponibles.',
  },
  {
    icon: ClipboardList,
    title: 'Commandes',
    description: 'Retrouvez les commandes et suivez leur avancement entre partenaires.',
  },
  {
    icon: FileText,
    title: 'Factures et paiements',
    description: 'Consultez les factures et les paiements associés à vos opérations.',
  },
  {
    icon: Truck,
    title: 'Expéditions',
    description: 'Suivez les statuts de livraison et les informations de transport.',
  },
  {
    icon: UsersRound,
    title: 'Accès par rôle',
    description: 'Des espaces et autorisations adaptés aux responsabilités de chacun.',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité du compte',
    description: 'Protégez votre accès avec la double authentification et la gestion des sessions.',
  },
]

export function Features() {
  const t = useTranslate()
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-y border-[var(--border)] bg-[var(--surface)] px-4 py-16 sm:px-8 sm:py-20 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
            {t('Une vue d’ensemble')}
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[var(--ink)] sm:text-4xl"
          >
            {t('Les outils essentiels pour vos opérations B2B')}
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            {t('Organisez les étapes du quotidien dans une interface conçue pour les équipes commerciales et leurs partenaires.')}
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-bg)] text-[var(--accent)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">{t(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t(description)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
