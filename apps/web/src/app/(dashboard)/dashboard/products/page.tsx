'use client'

import { useDeferredValue, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Package,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { productsService } from '@/services/products.service'
import { useAuthStore } from '@/stores/authStore'
import { ProductCard } from '@/components/modules/ProductCard'
import type { Category, Product } from '@/types'
import { useTranslate } from '@/lib/use-translate'
import { getLocalizedValue } from '@/lib/translations'

type ViewMode = 'grid' | 'list'

const pageSize = 12

function computeKPIs(products: Product[]) {
  const total = products.length
  const active = products.filter((p) => p.isActive).length
  const outOfStock = products.filter((p) => p.stockQuantity === 0).length
  const catalogValue = products.reduce(
    (acc, p) => acc + Number(p.priceHT) * p.stockQuantity,
    0,
  )
  return { total, active, outOfStock, catalogValue }
}

function ProductTableRow({ product }: { product: Product }) {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const stockQuantity = product.stockQuantity
  const isOutOfStock = stockQuantity === 0
  const isLowStock = !isOutOfStock && stockQuantity <= product.stockAlertLevel
  const isPublished = product.isActive && product.isPublic

  return (
    <tr className="hover:bg-[var(--bg)] transition-colors" style={{ height: '44px' }}>
      <td className="px-[var(--space-6)] py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
            <Package className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-[var(--ink)] text-[var(--step-body)]">
              {getLocalizedValue(product.name, locale)}
            </p>
            <p className="mt-0.5 text-[var(--step-sm)] text-[var(--muted)]">{t('Réf.')} {product.sku}</p>
          </div>
        </div>
      </td>
      <td className="px-[var(--space-6)] py-3 hidden md:table-cell text-[var(--step-sm)] text-[var(--muted)]">
        {getLocalizedValue(product.category?.name, locale) || t('Sans catégorie')}
      </td>
      <td className="px-[var(--space-6)] py-3 text-right font-mono text-[var(--step-body)] text-[var(--accent)]">
        {formatCurrency(Number(product.priceHT), 'TND', locale)}
      </td>
      <td className="px-[var(--space-6)] py-3">
        {isOutOfStock ? (
          <Badge variant="danger" className="gap-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
            {t('Rupture')}
          </Badge>
        ) : isLowStock ? (
          <Badge variant="warning" className="gap-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
            {t('Stock faible')} ({stockQuantity})
          </Badge>
        ) : (
          <Badge variant="success" className="gap-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            {stockQuantity} {t(product.unit ?? 'unités')}
          </Badge>
        )}
      </td>
      <td className="px-[var(--space-6)] py-3 text-center">
        <Badge variant={isPublished ? 'success' : 'neutral'} className="text-[11px]">
          {t(isPublished ? 'Publié' : product.isActive ? 'Non publié' : 'Désactivé')}
        </Badge>
      </td>
    </tr>
  )
}

function EmptyState({
  hasFilters,
  canManageProducts,
  onAdd,
}: {
  hasFilters: boolean
  canManageProducts: boolean
  onAdd: () => void
}) {
  const t = useTranslate()
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center" role="status">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--raised)] text-[var(--muted)]">
        <Package className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--ink)]">
        {t(hasFilters
          ? 'Aucun résultat'
          : canManageProducts
            ? 'Votre catalogue est encore vide'
            : 'Aucun produit disponible')}
      </h2>
      <p className="mt-1 max-w-sm text-[var(--step-sm)] text-[var(--muted)]">
        {t(hasFilters
          ? 'Essayez de modifier votre recherche ou vos filtres.'
          : canManageProducts
            ? 'Ajoutez votre premier produit pour commencer à présenter votre offre.'
            : "Les fournisseurs n'ont pas encore publié de produits.")}
      </p>
      {canManageProducts && !hasFilters && (
        <Button type="button" variant="primary" size="md" onClick={onAdd} className="mt-4">
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          {t('Ajouter un produit')}
        </Button>
      )}
    </div>
  )
}

function ProductsSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const t = useTranslate()
  return (
    <div role="status" aria-busy="true" aria-label={t('Chargement des produits')}>
      <span className="sr-only">{t('Chargement des produits…')}</span>
      {viewMode === 'grid' ? (
        <div className="grid gap-[var(--space-6)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-[var(--raised)]" />
          ))}
        </div>
      ) : (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex h-[73px] items-center gap-6 border-b border-[var(--rule)] px-[var(--space-6)]">
              <div className="h-10 w-10 animate-pulse rounded-[var(--radius-sm)] bg-[var(--raised)]" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--raised)]" />
              <div className="h-4 w-1/6 animate-pulse rounded bg-[var(--raised)]" />
              <div className="h-4 w-1/6 animate-pulse rounded bg-[var(--raised)]" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const canManageProducts = user?.role === 'SUPPLIER' || user?.role === 'ADMIN'

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryNames, setCategoryNames] = useState({ fr: '', en: '', ar: '' })
  const deferredSearch = useDeferredValue(search.trim())

  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: productsService.getCategories,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(user),
  })

  const productsQuery = useQuery({
    queryKey: [
      canManageProducts ? 'manageable-products' : 'public-products',
      deferredSearch,
      activeCategory,
      page,
    ],
    queryFn: () => {
      const params = {
        page,
        limit: pageSize,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(activeCategory !== 'ALL' ? { categoryId: activeCategory } : {}),
      }
      return canManageProducts
        ? productsService.getManageable(params)
        : productsService.getAll(params)
    },
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  })

  const createCategory = useMutation({
    mutationFn: (name: Category['name']) => productsService.createCategory(name),
    onSuccess: async (category) => {
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      setActiveCategory(category.id)
      setCategoryNames({ fr: '', en: '', ar: '' })
      setShowCategoryForm(false)
      toast.success(t('Catégorie créée.'))
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.error(t(typeof message === 'string' ? message : 'Impossible de créer la catégorie.'))
    },
  })

  const apiProducts = productsQuery.data?.data ?? []
  const rawProducts: Product[] = apiProducts
  const categories: Category[] = categoriesQuery.data ?? []

  const meta = productsQuery.data?.meta
  const totalPages = meta?.totalPages ?? 0

  const displayProducts = rawProducts

  const kpi = computeKPIs(rawProducts)

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    setPage(1)
  }

  const handleCreateCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = {
      fr: categoryNames.fr.trim(),
      en: categoryNames.en.trim(),
      ar: categoryNames.ar.trim(),
    }
    if (Object.values(name).some((value) => !value)) {
      toast.error(t('Renseignez le nom de la catégorie dans les trois langues.'))
      return
    }
    createCategory.mutate(name)
  }

  return (
    <div className="space-y-6 animate-entrance">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[var(--step-h2)] font-bold text-[var(--accent)]">
            {t(canManageProducts ? 'Vos produits' : 'Catalogue produits')}
          </h1>
          <p className="text-[var(--step-body)] text-[var(--muted)] mt-0.5">
            {canManageProducts
              ? t('Gérez votre catalogue, vos prix et vos niveaux de stock.')
              : t('Découvrez les produits proposés par les fournisseurs TradeLink.')}
          </p>
        </div>

        {canManageProducts && (
          <Button variant="primary" size="md" onClick={() => router.push('/dashboard/products/new')} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t('Ajouter un produit')}
          </Button>
        )}
      </header>

      {categoriesQuery.isError && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{t('Impossible de charger les catégories. Réessayez pour rétablir les filtres et la création de catégories.')}</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => void categoriesQuery.refetch()}>
            {t('Réessayer')}
          </Button>
        </div>
      )}

      {/* KPI Cards - 4 distinct compositions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-6)]">
        {/* Card 1: Total produits */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Total produits')}</p>
              <p className="text-[var(--step-h1)] font-mono text-[var(--accent)] mt-2">{kpi.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(31,45,230,0.1)] flex items-center justify-center">
              <Package className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Actifs')}</span>
            <span className="font-mono text-[var(--ink)]">{kpi.active}</span>
          </div>
        </div>

        {/* Card 2: Valeur catalogue */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Valeur catalogue')}</p>
              <p className="text-[var(--step-h1)] font-mono text-[var(--success)] mt-2">{formatCurrency(kpi.catalogValue, 'TND', locale)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
              <Package className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Stock total')}</span>
            <span className="font-mono text-[var(--ink)]">{rawProducts.reduce((a, b) => a + b.stockQuantity, 0)}</span>
          </div>
        </div>

        {/* Card 3: Produits actifs */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Produits actifs')}</p>
              <p className="text-[var(--step-h1)] font-mono text-[var(--accent)] mt-2">{kpi.active}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
              <Package className="h-6 w-6 text-[var(--success)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Taux d’activation')}</span>
            <span className="font-mono text-[var(--success)]">{kpi.total > 0 ? Math.round((kpi.active / kpi.total) * 100) : 0}%</span>
          </div>
        </div>

        {/* Card 4: Rupture de stock - Status badge prominent */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Rupture de stock')}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-[var(--step-h1)] font-mono text-[var(--accent)]">{kpi.outOfStock}</p>
                {kpi.outOfStock > 0 && <Badge variant="danger" className="text-[11px]">{t('Action requise')}</Badge>}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
              <Package className="h-6 w-6 text-[var(--danger)]" />
            </div>
          </div>
          <div className="mt-4 h-px bg-[var(--rule)]" />
          <div className="mt-3 flex items-center justify-between text-[var(--step-sm)] text-[var(--muted)]">
            <span>{t('Stock faible')}</span>
            <span className="font-mono text-[var(--warning)]">{rawProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.stockAlertLevel).length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Category Tabs + View Toggle */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
        {/* Search + View toggle row */}
        <div className="flex flex-col gap-3 border-b border-[var(--rule)] p-[var(--space-6)] sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
            <Input
              aria-label={t('Rechercher un produit')}
              placeholder={t('Rechercher par nom ou référence…')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,45,230,0.15)] focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* View mode toggle */}
          <div role="group" aria-label={t('Mode d’affichage')} className="flex items-center gap-1 self-end rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label={t('Vue grille')}
              className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-all ${
                viewMode === 'grid'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label={t('Vue liste')}
              className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
              }`}
            >
              <List className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--rule)] px-[var(--space-6)]">
          {[{ id: 'ALL', name: { fr: 'Toutes les catégories', en: 'All categories', ar: 'كل الفئات' } }, ...categories].map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryChange(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[var(--step-body)] font-medium transition-colors ${
                activeCategory === category.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--muted)] hover:border-[var(--rule)] hover:text-[var(--ink)]'
              }`}
            >
              {getLocalizedValue(category.name, locale)}
            </button>
          ))}
          {canManageProducts && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setShowCategoryForm((visible) => !visible)}
              aria-expanded={showCategoryForm}
            >
              {showCategoryForm ? <X className="mr-2 h-4 w-4" aria-hidden /> : <Plus className="mr-2 h-4 w-4" aria-hidden />}
              {showCategoryForm ? t('Fermer') : t('Créer une catégorie')}
            </Button>
          )}
        </div>

        {showCategoryForm && canManageProducts && (
          <form onSubmit={handleCreateCategory} className="grid gap-3 border-b border-[var(--rule)] bg-[var(--bg)] p-[var(--space-6)] sm:grid-cols-3">
            {([
              ['fr', 'Nom en français'],
              ['en', 'Name in English'],
              ['ar', 'الاسم بالعربية'],
            ] as const).map(([locale, label]) => (
              <label key={locale} className="space-y-1 text-sm font-medium text-[var(--ink)]">
                {t(label)}
                <Input
                  required
                  value={categoryNames[locale]}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  onChange={(event) => setCategoryNames((current) => ({ ...current, [locale]: event.target.value }))}
                  maxLength={100}
                />
              </label>
            ))}
            <div className="flex justify-end sm:col-span-3">
              <Button type="submit" variant="primary" size="sm" disabled={createCategory.isPending}>
                {createCategory.isPending ? t('Création…') : t('Enregistrer la catégorie')}
              </Button>
            </div>
          </form>
        )}

        {/* Content area */}
        {productsQuery.isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center" role="alert">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--danger)]">
              <span className="text-xl">!</span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-[var(--ink)]">{t('Impossible de charger les produits')}</h2>
            <p className="mt-1 max-w-md text-[var(--step-sm)] text-[var(--muted)]">{t('Vérifiez votre connexion puis réessayez.')}</p>
            <Button type="button" variant="secondary" size="md" className="mt-4" onClick={() => void productsQuery.refetch()}>{t('Réessayer')}</Button>
          </div>
        ) : productsQuery.isLoading ? (
          <ProductsSkeleton viewMode={viewMode} />
        ) : displayProducts.length === 0 ? (
          <EmptyState hasFilters={!!search || activeCategory !== 'ALL'} canManageProducts={canManageProducts} onAdd={() => router.push('/dashboard/products/new')} />
        ) : viewMode === 'grid' ? (
          <div className="p-[var(--space-6)]">
            <ul className="grid gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={t('Grille des produits')}>
              {displayProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b border-[var(--rule)]">
                  <th className="px-[var(--space-6)] py-3 text-left text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Produit')}</th>
                  <th className="px-[var(--space-6)] py-3 text-left text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider hidden md:table-cell">{t('Catégorie')}</th>
                  <th className="px-[var(--space-6)] py-3 text-right text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Prix HT')}</th>
                  <th className="px-[var(--space-6)] py-3 text-center text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Stock')}</th>
                  <th className="px-[var(--space-6)] py-3 text-center text-[var(--step-sm)] font-medium text-[var(--muted)] uppercase tracking-wider">{t('Statut')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {displayProducts.map((product) => (
                  <ProductTableRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {displayProducts.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[var(--rule)] px-[var(--space-6)] py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[var(--step-sm)] text-[var(--muted)]" aria-live="polite">
              {meta?.total ?? displayProducts.length} produit{(meta?.total ?? displayProducts.length) > 1 ? 's' : ''}
              {meta && meta.total > 0 && (
                <span className="text-[var(--muted)]"> · Page {meta.page} sur {Math.max(meta.totalPages, 1)}</span>
              )}
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button type="button" variant="secondary" size="sm" disabled={page <= 1 || productsQuery.isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label={t('Page précédente')}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <span className="min-w-16 text-center text-[var(--step-sm)] text-[var(--muted)]">{page} / {Math.max(totalPages, 1)}</span>
              <Button type="button" variant="secondary" size="sm" disabled={!meta || page >= meta.totalPages || productsQuery.isFetching} onClick={() => setPage((p) => p + 1)} aria-label={t('Page suivante')}>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}