'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  Users,
  Search,
  Mail,
  Phone,
  Shield,
  Building2,
  Truck,
  KeyRound,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { QueryFeedback } from '@/components/ui/query-feedback'
import { usersService } from '@/services/users.service'
import { formatDate, getInitials } from '@/lib/utils'
import type { User, UserRole } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { useTranslate } from '@/lib/use-translate'

export default function UsersPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users-list', page, debouncedSearch, roleFilter, statusFilter],
    queryFn: () => usersService.getAll({
      page,
      limit: 50,
      ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    staleTime: 30000,
  })
  const passwordReset = useMutation({
    mutationFn: usersService.requestPasswordReset,
    onSuccess: (result) => toast.success(t(result.message)),
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.error(t(typeof message === 'string' ? message : 'Impossible d’envoyer le code de réinitialisation.'))
    },
  })
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      usersService.updateStatus(id, status),
    onSuccess: async (_result, variables) => {
      toast.success(t(variables.status === 'SUSPENDED' ? 'Compte suspendu.' : 'Compte réactivé.'))
      await queryClient.invalidateQueries({ queryKey: ['users-list'] })
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.error(t(typeof message === 'string' ? message : 'Impossible de modifier le statut du compte.'))
    },
  })

  const users: User[] = data?.data ?? []

  const filteredUsers = users

  const roleTabs = [
    { id: 'ALL', label: 'Tous' },
    { id: 'CLIENT', label: 'Clients' },
    { id: 'SUPPLIER', label: 'Fournisseurs' },
    { id: 'TRANSPORTER', label: 'Transporteurs' },
    { id: 'ACCOUNTANT', label: 'Comptables' },
    { id: 'SUPPORT', label: 'Support' },
    { id: 'ADMIN', label: 'Admins' },
    { id: 'VISITOR', label: 'Visiteurs' },
  ] as const

  return (
    <div className="space-y-6 animate-entrance p-[var(--space-6)]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Administration')}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--ink)]">{t('Utilisateurs')}</span>
          </div>
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">
            {t('Gestion des Utilisateurs')}
          </h1>
          <p className="mt-1 text-[var(--step-body)] text-[var(--muted)]">
            {t('Recherche, filtres de statut et procédures de compte')}
          </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-6)]">
        {/* Card 1: Total Comptes */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Total Comptes')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--accent)] mt-2">{data?.meta.total ?? 0}</p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Utilisateurs correspondant aux filtres')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <Users className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Ce mois · page chargée')}</span>
            <span className="font-mono text-[var(--ink)]">
              {filteredUsers.filter((user) => {
                const createdAt = new Date(user.createdAt)
                const now = new Date()
                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
              }).length}
            </span>
          </div>
        </Card>

        {/* Card 2: Clients Acheteurs */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Clients · page chargée')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-[var(--step-h3)] font-mono text-[var(--success)]">
                  {filteredUsers.filter((u) => u.role === 'CLIENT').length}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
              <Users className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Actifs · page chargée')}</span>
            <span className="font-mono text-[var(--success)]">
              {filteredUsers.filter((u) => u.role === 'CLIENT' && u.status === 'ACTIVE').length}
            </span>
          </div>
        </Card>

        {/* Card 3: Fournisseurs */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Fournisseurs · page chargée')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-[var(--step-h3)] font-mono text-[var(--warning)]">
                  {filteredUsers.filter((u) => u.role === 'SUPPLIER').length}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--warning-bg)] flex items-center justify-center">
              <Building2 className="h-6 w-6 text-[var(--warning)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Nouveaux ce mois · page chargée')}</span>
            <span className="font-mono text-[var(--ink)]">
              {filteredUsers.filter((user) => {
                if (user.role !== 'SUPPLIER') return false
                const createdAt = new Date(user.createdAt)
                const now = new Date()
                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
              }).length}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Actifs · page chargée')}</span>
            <span className="font-mono text-[var(--success)]">
              {filteredUsers.filter((user) => user.role === 'SUPPLIER' && user.status === 'ACTIVE').length}
            </span>
          </div>
        </Card>

        {/* Card 4: Transporteurs */}
        <Card variant="default" className="p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-xs)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Transporteurs · page chargée')}</p>
              <p className="text-[var(--step-h3)] font-mono text-[var(--accent)] mt-2">
                {filteredUsers.filter((u) => u.role === 'TRANSPORTER').length}
              </p>
              <p className="text-[var(--step-xs)] text-[var(--muted)] mt-1">{t('Flotte maritime & routière')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <Truck className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-xs)] text-[var(--muted)]">
            <span>{t('Disponibles · page chargée')}</span>
            <span className="font-mono text-[var(--success)]">
              {filteredUsers.filter((u) => u.role === 'TRANSPORTER' && u.status === 'ACTIVE').length}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Bar - Table Filter Bar Pattern */}
      <QueryFeedback isLoading={isLoading} isError={isError} onRetry={() => void refetch()} />
      <Card variant="default" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[var(--step-h3)] font-semibold text-[var(--accent)]">{t('Utilisateurs')}</h2>
            <Badge variant="neutral">{data?.meta.total ?? 0}</Badge>
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-56 max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-light)]" />
                <Input
                  type="text"
                  placeholder={t('Rechercher par nom, email ou téléphone...')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,45,230,0.15)] focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <label className="sr-only" htmlFor="user-status-filter">{t('Filtrer par statut')}</label>
              <select
                id="user-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
              >
                <option value="">{t('Tous les statuts')}</option>
                <option value="PENDING_KYC">{t('KYC en attente')}</option>
                <option value="KYC_SUBMITTED">{t('KYC soumis')}</option>
                <option value="ACTIVE">{t('Actif')}</option>
                <option value="SUSPENDED">{t('Suspendu')}</option>
                <option value="BANNED">{t('Banni')}</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {roleTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(tab.id)
                    setPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-[var(--radius-full)] text-[var(--step-xs)] font-medium transition-all ${
                    roleFilter === tab.id
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] border border-[var(--border)]'
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Utilisateur')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('Email & Contact')}</TableHead>
                <TableHead>{t('Rôle')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('Langue')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('Inscrit le')}</TableHead>
                <TableHead>{t('Statut')}</TableHead>
                <TableHead><span className="sr-only">{t('Actions administrateur')}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  locale={locale}
                  canAdminister={u.role !== 'ADMIN' && u.id !== currentUserId && u.status !== 'BANNED'}
                  isBusy={passwordReset.isPending || changeStatus.isPending}
                  onPasswordReset={() => {
                    if (u.email && window.confirm(`${t('Envoyer un code de réinitialisation à')} ${u.email} ?`)) {
                      passwordReset.mutate(u.id)
                    }
                  }}
                  onStatusChange={() => {
                    const status = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
                    const prompt = status === 'SUSPENDED'
                      ? t('Suspendre ce compte et révoquer ses sessions ?')
                      : t('Réactiver ce compte ?')
                    if (window.confirm(prompt)) changeStatus.mutate({ id: u.id, status })
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--rule)] px-[var(--space-6)] py-4 bg-[var(--bg)]">
          <p className="text-[var(--step-sm)] text-[var(--muted)]">
            {t('Page')} {page} · {filteredUsers.length} {t('résultat(s) affiché(s) sur')} {data?.meta.total ?? filteredUsers.length} {t('utilisateur(s) filtré(s)')}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>{t('Précédent')}</Button>
            <Button variant="ghost" size="sm" disabled={!data || page >= data.meta.totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>{t('Suivant')}</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function UserTableRow({
  user,
  locale,
  canAdminister,
  isBusy,
  onPasswordReset,
  onStatusChange,
}: {
  user: User
  locale: 'fr' | 'en' | 'ar'
  canAdminister: boolean
  isBusy: boolean
  onPasswordReset: () => void
  onStatusChange: () => void
}) {
  const t = useTranslate()
  const displayName = getDisplayName(user, locale)
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[rgba(31,45,230,0.1)] text-[var(--accent)] font-bold text-[var(--step-xs)]">
            {getInitials(displayName)}
          </div>
          <div>
            <p className="font-medium text-[var(--ink)] text-[var(--step-sm)]">{displayName || user.email || t('Utilisateur')}</p>
            <p className="text-[var(--step-xs)] text-[var(--muted)] font-mono">ID: {user.id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-[var(--step-sm)] text-[var(--muted)]">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-[var(--muted)]" />
          <span>{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="h-3 w-3 text-[var(--muted)]" />
            <span className="text-[var(--step-xs)]">{user.phone}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <UserRoleBadge role={user.role} />
      </TableCell>
      <TableCell className="hidden lg:table-cell text-[var(--step-sm)] text-[var(--muted)] font-mono uppercase">{user.preferredLang || 'FR'}</TableCell>
      <TableCell className="hidden lg:table-cell text-[var(--step-sm)] text-[var(--muted)]">{formatDate(user.createdAt, 'short', locale)}</TableCell>
      <TableCell><UserStatusBadge status={user.status} /></TableCell>
      <TableCell>
        {canAdminister && (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${t('Envoyer un code de réinitialisation à')} ${user.email ?? displayName}`}
              title={t('Envoyer un code de réinitialisation')}
              disabled={isBusy || !user.email}
              onClick={onPasswordReset}
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={user.status === 'SUSPENDED' ? `${t('Réactiver')} ${displayName}` : `${t('Suspendre')} ${displayName}`}
              title={user.status === 'SUSPENDED' ? t('Réactiver le compte') : t('Suspendre le compte')}
              disabled={isBusy}
              onClick={onStatusChange}
            >
              {user.status === 'SUSPENDED'
                ? <UserRoundCheck className="h-4 w-4 text-[var(--success)]" aria-hidden="true" />
                : <UserRoundX className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function getDisplayName(user: User, locale: 'fr' | 'en' | 'ar') {
  if (typeof user.displayName === 'string') return user.displayName
  return user.displayName?.[locale] ?? user.displayName?.fr ?? user.displayName?.en ?? user.displayName?.ar ??
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
}

function UserStatusBadge({ status }: { status?: User['status'] }) {
  const t = useTranslate()
  const labels: Record<NonNullable<User['status']>, string> = {
    PENDING_KYC: 'KYC en attente',
    KYC_SUBMITTED: 'KYC soumis',
    ACTIVE: 'Actif',
    SUSPENDED: 'Suspendu',
    BANNED: 'Banni',
  }
  const variant = status === 'ACTIVE' ? 'success' : status === 'BANNED' || status === 'SUSPENDED' ? 'danger' : 'warning'
  return <Badge variant={variant}>{t(status ? labels[status] : 'Non renseigné')}</Badge>
}

function UserRoleBadge({ role }: { role: UserRole }) {
  const t = useTranslate()
  const map: Record<UserRole, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; icon?: React.ReactNode }> = {
    VISITOR: { label: 'Visiteur', variant: 'neutral' },
    ADMIN: { label: 'Admin', variant: 'info', icon: <Shield className="h-3 w-3" /> },
    CLIENT: { label: 'Client', variant: 'success' },
    SUPPLIER: { label: 'Fournisseur', variant: 'warning', icon: <Building2 className="h-3 w-3" /> },
    TRANSPORTER: { label: 'Transporteur', variant: 'neutral', icon: <Truck className="h-3 w-3" /> },
    ACCOUNTANT: { label: 'Comptable', variant: 'info' },
    SUPPORT: { label: 'Support', variant: 'neutral' },
  }

  const current = map[role] || { label: role, variant: 'neutral' }

  return (
    <Badge variant={current.variant} className="gap-1.5 text-[11px]">
      {current.icon}
      {t(current.label)}
    </Badge>
  )
}