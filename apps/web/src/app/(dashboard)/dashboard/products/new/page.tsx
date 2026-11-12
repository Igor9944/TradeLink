'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Image as ImageIcon,
  ImagePlus,
  PackagePlus,
} from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { productsService } from '@/services/products.service'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import type { MultilingualText } from '@/types'
import { useTranslate } from '@/lib/use-translate'
import { getLocalizedValue } from '@/lib/translations'

const createProductSchema = (t: (text: string) => string) => z.object({
  productName: z.string().trim().min(2, t('Le nom du produit est obligatoire.')).max(120),
  categoryId: z.string().optional(),
  priceHT: z.coerce.number({ invalid_type_error: t('Saisissez un prix valide.') }).finite().min(0, t('Le prix doit être positif.')),
  stockQuantity: z.coerce.number().int().min(0, t('Le stock doit être un entier positif.')),
  stockAlertLevel: z.coerce.number().int().min(0, t('Le seuil doit être un entier positif.')),
  imageUrl: z.string().default(''),
})

type ProductForm = z.infer<ReturnType<typeof createProductSchema>>

function generateProductSku() {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
  return `TRD-${suffix}`
}

export default function NewProductPage() {
  const t = useTranslate()
  const locale = useAuthStore((state) => state.preferredLanguage)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [imagePreviewError, setImagePreviewError] = useState(false)

  const isSupplier = user?.role === 'SUPPLIER'
  const isAdmin = user?.role === 'ADMIN'
  const canManageProducts = isSupplier || isAdmin

  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: productsService.getCategories,
    staleTime: 5 * 60 * 1000,
    enabled: canManageProducts,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: {
      productName: '',
      categoryId: '',
      priceHT: undefined,
      stockQuantity: 0,
      stockAlertLevel: 10,
      imageUrl: '',
    },
  })

  const watchedValues = watch()
  const productName = watchedValues.productName || t('Nom du produit')
  const categoryId = watchedValues.categoryId
  const priceHT = Number(watchedValues.priceHT) || 0
  const stockQuantity = Number(watchedValues.stockQuantity) || 0
  const stockAlertLevel = Number(watchedValues.stockAlertLevel) || 0
  const imageUrl = watchedValues.imageUrl
  const unitLabel = t('unité')

  // Selected Category Name
  const selectedCategory = categoriesQuery.data?.find((c) => c.id === categoryId)

  const createProduct = useMutation({
    mutationFn: (form: ProductForm) => {
      const baseName = form.productName.trim()
      const localeValue = locale === 'ar' ? 'ar' : locale === 'en' ? 'en' : 'fr'
      const name: MultilingualText = {
        fr: localeValue === 'fr' ? baseName : '',
        en: localeValue === 'en' ? baseName : '',
        ar: localeValue === 'ar' ? baseName : '',
      }
      return productsService.create({
        sku: generateProductSku(),
        name,
        ...(form.categoryId ? { categoryId: form.categoryId } : {}),
        priceHT: form.priceHT,
        taxRate: 0.19,
        stockQuantity: form.stockQuantity,
        stockAlertLevel: form.stockAlertLevel,
        unit: 'unité',
        isActive: true,
        isPublic: false,
        ...(form.imageUrl ? { images: [{ url: form.imageUrl, position: 0 }] } : {}),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['manageable-products'] })
      toast.success(t('Le produit a été ajouté au catalogue avec succès !'))
      router.push('/dashboard/products')
    },
    onError: (error) => {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined
      toast.error(
        typeof message === 'string'
          ? t(message)
          : Array.isArray(message)
            ? t(message.join(' '))
            : t('Impossible d’ajouter le produit. Réessayez.'),
      )
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!acceptedTypes.includes(file.type)) {
      toast.error(t('Choisissez une image JPG, PNG ou WebP.'))
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('La photo ne doit pas dépasser 2 Mo.'))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setValue('imageUrl', String(reader.result ?? ''), { shouldDirty: true })
      setImagePreviewError(false)
    }
    reader.onerror = () => toast.error(t('Impossible de lire cette photo. Réessayez.'))
    reader.readAsDataURL(file)
  }

  if (!canManageProducts) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8">
          <h1 className="text-xl font-bold text-[var(--ink)]">{t('Accès non autorisé')}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('Seuls les fournisseurs et les administrateurs peuvent ajouter un produit.')}
          </p>
          <Link
            href="/dashboard/products"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            {t('Retour au catalogue')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0038ff] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('Retour au catalogue produits')}
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#082c55]">
            {t('Nouveau produit')}
          </h1>
          <Badge variant="info" className="text-xs">
            {t('Création B2B')}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {t('Saisissez le nom dans la langue sélectionnée, puis renseignez le prix et le stock.')}
        </p>
      </div>

      {categoriesQuery.isError && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{t('Impossible de charger les catégories. Vous pouvez réessayer ou créer le produit sans catégorie.')}</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => void categoriesQuery.refetch()}>
            {t('Réessayer')}
          </Button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_390px] items-start">
        {/* Left Column: Form */}
        <form
          onSubmit={handleSubmit((form) => createProduct.mutateAsync(form))}
          className="space-y-6"
        >
          <Card variant="default" className="p-6">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-[#082c55]">
                {t('Informations générales du produit')}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label={t('Nom du produit')}
                    placeholder={t('Ex. Huile d’olive vierge extra bio')}
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    required
                    error={errors.productName?.message}
                    {...register('productName')}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('Catégorie (facultative)')}
                  </label>
                  <select
                    id="categoryId"
                    {...register('categoryId')}
                    disabled={categoriesQuery.isLoading}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-[#0038ff] focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:bg-slate-50 transition-all"
                  >
                    <option value="">
                      {(categoriesQuery.data ?? []).length === 0
                        ? t('Aucune catégorie disponible — facultatif')
                        : t('Sélectionner une catégorie')}
                    </option>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {getLocalizedValue(category.name, locale)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Card 2: Prix et Stock */}
          <Card variant="default" className="p-6">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-[#082c55]">
                {t('Tarification & Niveaux de Stock')}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 grid gap-4 sm:grid-cols-2">
              <Input
                label={t('Prix HT (TND)')}
                type="number"
                min="0"
                step="0.001"
                required
                error={errors.priceHT?.message}
                {...register('priceHT')}
              />

              <Input
                label={t('Quantité en stock')}
                type="number"
                min="0"
                step="1"
                required
                error={errors.stockQuantity?.message}
                {...register('stockQuantity')}
              />

              <Input
                label={t('Seuil d’alerte de stock')}
                type="number"
                min="0"
                step="1"
                required
                error={errors.stockAlertLevel?.message}
                {...register('stockAlertLevel')}
              />

            </CardContent>
          </Card>

          {/* Card 3: Présentation & Visibilité */}
          <Card variant="default" className="p-6">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-[#082c55]">
                {t('Visibilité & Illustration')}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {t('Photo du produit')}
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                    <ImagePlus className="h-4 w-4 text-[#0038ff]" aria-hidden="true" />
                    {t('Téléverser une photo')}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <span className="text-xs text-slate-500">
                    {imageUrl ? t('Photo importée') : t('PNG, JPG ou WebP.')} 
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/products"
              className="glass-pill inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              {t('Annuler')}
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="text-sm font-bold"
              loading={isSubmitting || createProduct.isPending}
            >
              <PackagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('Créer et enregistrer le produit')}
            </Button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-24" aria-label={t('Aperçu du produit')}>
          <Card variant="default" className="p-5">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold text-[#082c55]">{t('Aperçu du produit')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {/* Visual Media Showcase */}
            <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              {imageUrl && !imagePreviewError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={t('Aperçu du produit')}
                  className="h-full w-full object-cover"
                  onError={() => setImagePreviewError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
                  <ImageIcon className="h-9 w-9" aria-hidden="true" />
                  <span className="mt-2 text-xs">{t('Aucune photo ajoutée')}</span>
                </div>
              )}

            </div>

            {/* Product Meta */}
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">
                {selectedCategory ? getLocalizedValue(selectedCategory.name, locale) : t('Sans catégorie')}
              </p>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {productName}
              </h3>
            </div>

            {/* Price Calculations */}
            <div className="mt-4 pt-3.5 border-t border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t('Prix unitaire')}:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(priceHT, 'TND', locale)}
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                {t('La TVA sera calculée au niveau de la facture.')}
              </p>
            </div>

            {/* Stock Level Warning Pill */}
            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('Quantité disponible')}:</span>
                <span className="font-bold text-slate-900">
                  {stockQuantity} {unitLabel}
                </span>
              </div>

              <div className="mt-2">
                {stockQuantity > stockAlertLevel ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {t('Stock supérieur au seuil d’alerte.')}
                  </p>
                ) : (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {t('Stock au niveau du seuil d’alerte ou en dessous.')}
                  </p>
                )}
              </div>
            </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
