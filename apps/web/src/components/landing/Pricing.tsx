'use client'

import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { useTranslate } from '@/lib/use-translate'

export function Pricing() {
  const t = useTranslate()
  const plans = [
    {
      name: 'Démarrage',
      price: '0',
      period: '/mois',
      description: 'Pour tester la plateforme',
      features: [
        'Jusqu\'à 50 produits',
        '10 commandes/mois',
        'Catalogue FR/EN',
        'Suivi basique',
        'Support email',
      ],
      cta: 'Commencer gratuitement',
      variant: 'secondary',
      popular: false,
    },
    {
      name: 'Croissance',
      price: '149',
      period: '/mois',
      description: 'Pour les PME actives',
      features: [
        'Produits illimités',
        'Commandes illimitées',
        'Catalogue FR/EN/AR',
        'Règlements multi-devises',
        'Logistique intégrée',
        'Facturation auto',
        'Support prioritaire',
      ],
      cta: 'Lancer ma croissance',
      variant: 'primary',
      popular: true,
    },
    {
      name: 'Entreprise',
      price: 'Sur devis',
      period: '',
      description: 'Pour les grands groupes',
      features: [
        'Tout dans Croissance',
        'API dédiée + webhooks',
        'SSO / SAML / OIDC',
        'SLA 99.9%',
        'Gestionnaire de compte',
        'Formation équipe',
        'Hébergement dédié',
      ],
      cta: 'Contacter les ventes',
      variant: 'secondary',
      popular: false,
    },
  ]

  return (
    <section className="pricing-section" aria-labelledby="pricing-heading">
      <div className="page-frame">
        <header className="section-header">
          <h2 id="pricing-heading" className="section-heading">{t('Tarification simple')}</h2>
          <p className="section-lead">{t('Un plan gratuit pour commencer. Tout inclus pour grandir. Sur mesure pour scaler.')}</p>
        </header>

        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <article key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">{t('Le plus choisi')}</div>}
              <div className="pricing-header">
                <h3 className="pricing-name">{t(plan.name)}</h3>
                <div className="pricing-price">
                  <span className="pricing-amount">{plan.price}</span>
                  <span className="pricing-period">{t(plan.period)}</span>
                </div>
                <p className="pricing-desc">{t(plan.description)}</p>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature, j) => (
                  <li key={feature} className="pricing-feature">
                    <Check className="pricing-check" aria-hidden="true" />
                    {t(feature)}
                  </li>
                ))}
              </ul>
              <Button variant={plan.variant as 'primary' | 'secondary' | 'ghost'} className="pricing-cta w-full" size="lg">
                {t(plan.cta)}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}