'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  CreditCard,
  Package,
  Truck,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { useAuthStore } from '@/stores/authStore'
import { dashboardService, type ActivityPeriod } from '@/services/dashboard.service'
import { formatCurrency, formatCurrencyTotals, formatDate } from '@/lib/utils'
import { useTranslate } from '@/lib/use-translate'
import type { OrderStatus } from '@/types'

interface TooltipProps {
  active?: boolean
  payload?: { value: number; payload?: { currency?: string } }[]
  label?: string
  locale: 'fr' | 'en' | 'ar'
}

function RevenueTooltip({ active, payload, label, locale }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm shadow-[var(--shadow-float)]">
      <p className="mb-1 text-[var(--muted)]">{label}</p>
      <p className="font-semibold text-[var(--ink)]">
        {formatCurrency(payload[0].value, payload[0].payload?.currency ?? 'TND', locale)}
      </p>
    </div>
  )
}

const statusLabels: Record<OrderStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PREPARATION: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  DISPUTED: 'En litige',
}

function statusVariant(status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (status === 'DELIVERED') return 'success'
  if (status === 'PENDING') return 'warning'
  if (status === 'CANCELLED') return 'danger'
  if (status === 'SHIPPED' || status === 'CONFIRMED' || status === 'IN_PREPARATION') return 'info'
  return 'neutral'
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  illustration,
  href,
}: {
  label: string
  value: string
  detail: string
  icon: typeof ClipboardList
  illustration?: string
  href?: string
}) {
  const content = (
    <div className="flex min-h-32 items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-[var(--ink)]">{value}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
      </div>
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center text-[var(--muted)]" aria-hidden="true">
        {illustration
          ? <Image src={illustration} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          : <Icon className="h-5 w-5" />}
      </span>
    </div>
  )

  return (
    <Card className="overflow-hidden">
      {href ? (
        <Link
          href={href}
          className="block rounded-[var(--radius-lg)] transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        >
          {content}
        </Link>
      ) : content}
    </Card>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const locale = useAuthStore((state) => state.preferredLanguage)
  const t = useTranslate()
  const isAdmin = user?.role === 'ADMIN'
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>('30d')
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    staleTime: 30000,
    retry: 2,
  })
  const activityQuery = useQuery({
    queryKey: ['dashboard-activity', activityPeriod],
    queryFn: () => dashboardService.getActivity(activityPeriod),
    staleTime: 30000,
  })

  const revenues = stats?.totalRevenueByCurrency ?? []
  const chartCurrency = revenues.length === 1 ? revenues[0].currency : null
  const chartData = useMemo(() => {
    if (!chartCurrency) return []
    return (stats?.revenueByMonth ?? [])
      .filter((entry) => entry.currency === chartCurrency)
      .map((entry) => ({
        ...entry,
        month: entry.date
          ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(entry.date))
          : entry.month,
      }))
  }, [chartCurrency, locale, stats?.revenueByMonth])
  const revenueTotals = formatCurrencyTotals(
    Object.fromEntries(revenues.map(({ currency, amount }) => [currency, amount])),
    locale,
  )

  const quickLinks: {
    href: string
    label: string
    detail: string
    icon: typeof ClipboardList
    illustration?: string
  }[] = [
    { href: '/dashboard/users', label: t('Gérer les utilisateurs'), detail: t('Rôles, comptes et accès'), icon: Users },
    { href: '/dashboard/kyc', label: t('Examiner les dossiers KYC'), detail: t('Valider les nouveaux comptes'), icon: ShieldCheck },
    { href: '/dashboard/audit-logs', label: t('Consulter le journal d’audit'), detail: t('Suivre les actions sensibles'), icon: ClipboardList },
    {
      href: '/dashboard/orders',
      label: t('Suivre les commandes'),
      detail: t('Consulter les opérations'),
      icon: ClipboardList,
      illustration: '/images/admin-icons/parcel-stack.png',
    },
    {
      href: '/dashboard/payments',
      label: t('Suivre paiements & factures'),
      detail: t('État, facture associée et encaissements'),
      icon: CreditCard,
      illustration: '/images/admin-icons/payment-cards.png',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-busy="true" aria-label="Chargement du tableau de bord">
        <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <div className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          <div className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
        </div>
        <span className="sr-only">{t('Chargement des statistiques du compte.')}</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            {isAdmin ? t('Espace administration') : t('Votre espace TradeLink')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
            {isAdmin ? t('Vue d’ensemble') : t('Tableau de bord')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {isAdmin
              ? t('Suivez les opérations de la plateforme et accédez rapidement aux outils de gestion.')
              : t('Suivez vos commandes, règlements et expéditions depuis un seul endroit.')}
          </p>
        </div>
      </header>

      {isError ? (
        <QueryFeedback isLoading={false} isError onRetry={() => void refetch()} />
      ) : (
        <>
          <section aria-label={t('Indicateurs clés')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t('Commandes')}
              value={String(stats?.totalOrders ?? 0)}
              detail={`${stats?.completedOrders ?? 0} ${t('livrées')}`}
              icon={ClipboardList}
              illustration={isAdmin ? '/images/admin-icons/parcel-stack.png' : undefined}
              href="/dashboard/orders"
            />
            <MetricCard
              label={t('À traiter')}
              value={String(stats?.pendingOrders ?? 0)}
              detail={t('En attente ou confirmées')}
              icon={Boxes}
              illustration={isAdmin ? '/images/admin-icons/order-checklist.png' : undefined}
              href="/dashboard/orders"
            />
            <MetricCard
              label={t('Expéditions actives')}
              value={String(stats?.activeShipments ?? 0)}
              detail={t('En transit ou en livraison')}
              icon={Truck}
              illustration={isAdmin ? '/images/admin-icons/delivery-van.png' : undefined}
              href="/dashboard/shipments"
            />
            <MetricCard
              label={t('Produits actifs')}
              value={String(stats?.totalProducts ?? 0)}
              detail={t('Produits visibles selon vos accès')}
              icon={Package}
              illustration={isAdmin ? '/images/admin-icons/shelving-rack.png' : undefined}
              href="/dashboard/products"
            />
          </section>

          {isAdmin && stats?.adminMetrics && (
            <section aria-label={t('Comptes et conformité')} className="space-y-3">
              <h2 className="text-lg font-semibold text-[var(--ink)]">{t('Comptes et conformité')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label={t('Utilisateurs inscrits')}
                  value={String(stats.adminMetrics.totalUsers)}
                  detail={t('Comptes enregistrés sur la plateforme')}
                  icon={Users}
                  href="/dashboard/users"
                />
                <MetricCard
                  label={t('Comptes actifs')}
                  value={String(stats.adminMetrics.activeUsers)}
                  detail={t('Utilisateurs autorisés à accéder au service')}
                  icon={UserCheck}
                  href="/dashboard/users"
                />
                <MetricCard
                  label={t('Comptes suspendus')}
                  value={String(stats.adminMetrics.suspendedUsers)}
                  detail={t('Comptes actuellement suspendus')}
                  icon={UserX}
                  href="/dashboard/users"
                />
                <MetricCard
                  label={t('KYC à examiner')}
                  value={String(stats.adminMetrics.pendingKyc)}
                  detail={t('Dossiers soumis en attente de décision')}
                  icon={ShieldCheck}
                  href="/dashboard/kyc"
                />
              </div>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <Card className="min-w-0 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">{t('Revenus encaissés')}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{t('Factures payées, regroupées par devise')}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--ink)] sm:max-w-[55%] sm:text-right">
                  {revenueTotals}
                </p>
              </div>

              <div className="mt-5 h-64 min-w-0" aria-label={t('Graphique des revenus mensuels')}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                        tickFormatter={(value: number) => new Intl.NumberFormat(locale, { notation: 'compact' }).format(value)}
                      />
                      <Tooltip content={<RevenueTooltip locale={locale} />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        fill="url(#adminRevenueFill)"
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-[var(--radius-control)] bg-[var(--bg)] px-4 text-center">
                    <ArrowDownLeft className="h-5 w-5 text-[var(--muted)]" aria-hidden="true" />
                    <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                      {revenues.length > 1 ? t('Revenus dans plusieurs devises') : t('Aucun revenu encaissé')}
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">
                      {revenues.length > 1
                        ? t('Les montants sont présentés séparément pour éviter de comparer des devises différentes.')
                        : t('Les revenus apparaîtront ici lorsqu’une facture aura été payée.')}
                    </p>
                  </div>
                )}
              </div>
              {revenues.length > 1 && (
                <ul aria-label={t('Revenus encaissés par devise')} className="mt-4 flex flex-wrap gap-2">
                  {revenues.map(({ currency, amount }) => (
                    <li key={currency} className="rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-sm">
                      <span className="text-[var(--muted)]">{currency}</span>
                      <span className="ml-2 font-semibold text-[var(--ink)]">{formatCurrency(amount, currency, locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {isAdmin ? (
              <Card className="p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">{t('Accès rapides')}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{t('Gestion et suivi de la plateforme')}</p>
                </div>
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {quickLinks.map(({ href, label, detail, icon: Icon, illustration }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="group flex items-center gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[var(--muted)]" aria-hidden="true">
                          {illustration
                            ? <Image src={illustration} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
                            : <Icon className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[var(--ink)]">{t(label)}</span>
                          <span className="mt-0.5 block text-xs text-[var(--muted)]">{t(detail)}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-[var(--muted-light)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <Card className="p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">{t('Suivi des opérations')}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{t('Accédez directement à vos activités')}</p>
                </div>
                <div className="mt-5 space-y-3">
                  <QuickLink href="/dashboard/orders" icon={ClipboardList} label={t('Mes commandes')} />
                  <QuickLink href="/dashboard/shipments" icon={Truck} label={t('Mes expéditions')} />
                  <QuickLink href="/dashboard/invoices" icon={CreditCard} label={t('Mes factures')} />
                </div>
              </Card>
            )}
          </section>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink)]">{t('Activité de la plateforme')}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{t('Commandes, expéditions et factures réglées')}</p>
              </div>
              <div role="group" aria-label={t('Période du graphique d’activité')} className="flex gap-1">
                {([
                  ['7d', t('7 jours')],
                  ['30d', t('30 jours')],
                  ['12m', t('12 mois')],
                ] as const).map(([period, label]) => (
                  <button
                    key={period}
                    type="button"
                    aria-pressed={activityPeriod === period}
                    onClick={() => setActivityPeriod(period)}
                    className={`min-h-9 rounded-[var(--radius-control)] px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      activityPeriod === period
                        ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                        : 'bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {activityQuery.isError ? (
              <div className="mt-5">
                <QueryFeedback isLoading={false} isError onRetry={() => void activityQuery.refetch()} />
              </div>
            ) : (
              activityQuery.isLoading ? (
                <div className="mt-5 h-64 animate-pulse rounded-[var(--radius-control)] bg-[var(--raised)]" role="status" aria-label={t('Chargement des activités')} />
              ) : activityQuery.data?.points.every((point) => !point.orders && !point.shipments && !point.payments) ? (
                <div className="mt-5 flex h-64 items-center justify-center rounded-[var(--radius-control)] bg-[var(--bg)] text-sm text-[var(--muted)]" role="status">
                  {t('Aucune activité pour cette période.')}
                </div>
              ) : (
                <div className="mt-5 h-64 min-w-0" aria-label={t('Graphique des activités par période')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(activityQuery.data?.points ?? []).map((point) => ({
                      ...point,
                      label: point.date
                        ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(point.date))
                        : point.label,
                    }))} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} minTickGap={20} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" name={t('Commandes')} stroke="var(--accent)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="shipments" name={t('Expéditions')} stroke="var(--success)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="payments" name={t('Factures payées')} stroke="var(--warning)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink)]">{t('Commandes récentes')}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {isAdmin ? t('Dernières commandes enregistrées sur la plateforme') : t('Dernières commandes associées à votre compte')}
                </p>
              </div>
              <Link href="/dashboard/orders" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline">
                {t('Toutes les commandes')} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {stats?.recentOrders?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold sm:px-6">Commande</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Montant</th>
                      <th scope="col" className="px-5 py-3 font-semibold sm:pr-6">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-[var(--raised)]">
                        <th scope="row" className="px-5 py-4 font-medium text-[var(--ink)] sm:px-6">
                          {order.orderNumber}
                        </th>
                        <td className="whitespace-nowrap px-5 py-4 text-[var(--muted)]">                        {formatDate(order.createdAt, 'short', locale)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-[var(--ink)]">
                          {formatCurrency(order.totalAmount, order.currency, locale)}
                        </td>
                        <td className="px-5 py-4 sm:pr-6">
                          <Badge variant={statusVariant(order.status)}>{statusLabels[order.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center sm:px-6">
                <ClipboardList className="mx-auto h-8 w-8 text-[var(--muted-light)]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-[var(--ink)]">Aucune commande récente</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Les nouvelles commandes apparaîtront ici.</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof ClipboardList
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <Icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-[var(--muted-light)]" aria-hidden="true" />
    </Link>
  )
}
