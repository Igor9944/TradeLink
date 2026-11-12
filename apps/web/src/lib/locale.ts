export type AppLocale = 'fr' | 'en' | 'ar'

export const API_LANGUAGE_BY_LOCALE: Record<AppLocale, 'FR' | 'EN' | 'AR'> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
}

export const APP_LOCALES: { value: AppLocale; label: string; nativeLabel: string }[] = [
  { value: 'fr', label: 'FR', nativeLabel: 'Français' },
  { value: 'en', label: 'EN', nativeLabel: 'English' },
  { value: 'ar', label: 'AR', nativeLabel: 'العربية' },
]

export function normalizeLocale(language?: string | null): AppLocale {
  switch (language?.toLowerCase()) {
    case 'en':
      return 'en'
    case 'ar':
      return 'ar'
    default:
      return 'fr'
  }
}
