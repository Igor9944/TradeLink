'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { APP_LOCALES } from '@/lib/locale'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useTranslate } from '@/lib/use-translate'

export function LanguageSwitcher() {
  const t = useTranslate()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const preferredLanguage = useAuthStore((state) => state.preferredLanguage)
  const setPreferredLanguage = useAuthStore((state) => state.setPreferredLanguage)
  const selectedLanguage = APP_LOCALES.find(({ value }) => value === preferredLanguage) ?? APP_LOCALES[0]

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`${t('Langue de l’interface')} : ${selectedLanguage.nativeLabel}`}
        aria-controls="language-switcher-options"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Languages className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
        <span>{selectedLanguage.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id="language-switcher-options"
          role="group"
          aria-label={t('Choisir la langue')}
          className="absolute end-0 z-30 mt-2 w-44 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-float)]"
        >
          {APP_LOCALES.map((language) => {
            const isSelected = language.value === preferredLanguage
            return (
              <button
                key={language.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setPreferredLanguage(language.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-sm transition-colors hover:bg-[var(--raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                  isSelected ? 'font-semibold text-[var(--accent)]' : 'text-[var(--ink)]',
                )}
              >
                <span className="w-6 text-xs font-semibold">{language.label}</span>
                <span className="flex-1">{language.nativeLabel}</span>
                {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
