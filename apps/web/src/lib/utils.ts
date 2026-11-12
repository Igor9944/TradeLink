import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AppLocale } from './locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'TND', locale: AppLocale = 'fr'): string {
  const intlLocale = locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-GB' : 'fr-TN'
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function sumByCurrency(items: Array<{ amount: number | string; currency: string }>) {
  return items.reduce<Record<string, number>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] ?? 0) + Number(item.amount)
    return totals
  }, {})
}

export function formatCurrencyTotals(totals: Record<string, number>, locale: AppLocale = 'fr'): string {
  const formatted = Object.entries(totals)
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
    .map(([currency, amount]) => formatCurrency(amount, currency, locale))
  return formatted.length > 0 ? formatted.join(' · ') : '—'
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short', locale: AppLocale = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const intlLocale = locale === 'ar' ? 'ar-TN' : locale === 'en' ? 'en-GB' : 'fr-FR'
  
  if (format === 'short') {
    return new Intl.DateTimeFormat(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  }
  
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}
