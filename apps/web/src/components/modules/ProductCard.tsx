'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { LogisticsBadge3D } from '@/components/visual/LogisticsBadge3D'
import type { Product } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { useTranslate } from '@/lib/use-translate'
import { getLocalizedValue } from '@/lib/translations'

interface ProductCardProps {
  product: Product
  className?: string
}

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

function getStockStatus(product: Product): StockStatus {
  if (product.stockQuantity === 0) return 'out-of-stock'
  if (product.stockQuantity <= product.stockAlertLevel) return 'low-stock'
  return 'in-stock'
}

const stockConfig: Record<
  StockStatus,
  { label: string; dotClass: string; textClass: string; badgeClass: string }
> = {
  'in-stock': {
    label: 'En stock',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    badgeClass:
      'bg-emerald-50/80 border border-emerald-200/60 text-emerald-700',
  },
  'low-stock': {
    label: 'Stock faible',
    dotClass: 'bg-amber-500 animate-pulse',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-50/80 border border-amber-200/60 text-amber-700',
  },
  'out-of-stock': {
    label: 'Rupture',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700',
    badgeClass: 'bg-red-50/80 border border-red-200/60 text-red-700',
  },
}

export function ProductCard({
  product,
  className,
}: ProductCardProps) {
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = useTranslate()
  const stockStatus = getStockStatus(product)
  const { dotClass, badgeClass } = stockConfig[stockStatus]
  const stockLabel = {
    'in-stock': t('En stock'),
    'low-stock': t('Stock faible'),
    'out-of-stock': t('Rupture'),
  }[stockStatus]
  const productName = getLocalizedValue(product.name, locale)
  const categoryName = getLocalizedValue(product.category?.name, locale) || t('Sans catégorie')

  return (
    <div
      className={cn(
        // Glass morphism panel
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'glass-panel-light glass-panel-interactive',
        'border border-white/60 bg-white/60 backdrop-blur-xl',
        'shadow-[0_8px_24px_-6px_rgba(8,44,85,0.10)]',
        // Hover lift
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_16px_40px_-8px_rgba(8,44,85,0.18)]',
        className,
      )}
    >
      {/* Top image / badge area */}
      <div
        className={cn(
          'relative flex h-36 items-center justify-center',
          'bg-gradient-to-br from-slate-50/80 via-blue-50/40 to-emerald-50/60',
          'border-b border-white/50',
        )}
      >
        {/* Decorative background blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-200/20 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-200/20 blur-xl" />
        </div>

        <LogisticsBadge3D
          type="parcel"
          size="lg"
          interactive
          className="relative z-10"
        />

        {/* Category chip */}
        <span className="absolute bottom-2.5 left-3 rounded-full bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 backdrop-blur-sm">
          {categoryName}
        </span>

        {/* Stock badge */}
        <span
          className={cn(
            'absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm',
            badgeClass,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
          {stockLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Name + SKU */}
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold leading-snug text-slate-800">
            {productName}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Réf.&nbsp;{product.sku}</p>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-[#082c55]">
              {formatCurrency(Number(product.priceHT), 'TND', locale)}
            </span>
            <span className="rounded-md bg-blue-100/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
              HT
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {product.unit ? t(product.unit) : t('unité')}
          </span>
        </div>

        {/* Stock qty */}
        <p className="text-xs text-slate-400">
          Qté :&nbsp;
          <span
            className={cn(
              'font-semibold',
              stockStatus === 'out-of-stock'
                ? 'text-red-600'
                : stockStatus === 'low-stock'
                  ? 'text-amber-600'
                  : 'text-emerald-600',
            )}
          >
            {product.stockQuantity}
          </span>
          {product.stockAlertLevel > 0 && (
            <span className="ml-1 text-slate-300">
              · seuil&nbsp;{product.stockAlertLevel}
            </span>
          )}
        </p>

      </div>
    </div>
  )
}
