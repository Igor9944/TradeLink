'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { normalizeLocale } from '@/lib/locale'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleDocumentSettings />
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}

function LocaleDocumentSettings() {
  const preferredLanguage = useAuthStore((state) => state.preferredLanguage)
  const userLanguage = useAuthStore((state) => state.user?.preferredLang)
  const setPreferredLanguage = useAuthStore((state) => state.setPreferredLanguage)

  useEffect(() => {
    if (userLanguage && normalizeLocale(userLanguage) !== preferredLanguage) {
      setPreferredLanguage(normalizeLocale(userLanguage))
      return
    }

    document.documentElement.lang = preferredLanguage
    document.documentElement.dir = preferredLanguage === 'ar' ? 'rtl' : 'ltr'
  }, [preferredLanguage, setPreferredLanguage, userLanguage])

  return null
}
