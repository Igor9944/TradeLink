'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { translateText } from '@/lib/translations'

export function useTranslate() {
  const locale = useAuthStore((state) => state.preferredLanguage)
  return useCallback((text: string) => translateText(text, locale), [locale])
}
