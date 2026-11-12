import { create } from 'zustand'
import type { User } from '@/types'
import { API_LANGUAGE_BY_LOCALE, normalizeLocale, type AppLocale } from '@/lib/locale'

interface AuthState {
  user: User | null
  token: string | null
  sessionId: string | null
  preferredLanguage: AppLocale
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string, sessionId: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setPreferredLanguage: (language: AppLocale) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  sessionId: null,
  preferredLanguage: 'fr',
  isAuthenticated: false,
  isLoading: false,

  setAuth: (user, token, sessionId) => {
    set({
      user,
      token,
      sessionId,
      preferredLanguage: normalizeLocale(user.preferredLang),
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: () => {
    set({ user: null, token: null, sessionId: null, isAuthenticated: false, isLoading: false })
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
      preferredLanguage: updates.preferredLang
        ? normalizeLocale(updates.preferredLang)
        : state.preferredLanguage,
    })),

  setPreferredLanguage: (language) =>
    set((state) => ({
      preferredLanguage: language,
      user: state.user
        ? { ...state.user, preferredLang: API_LANGUAGE_BY_LOCALE[language] }
        : null,
    })),

  initialize: () => {
    const state = get()

    if (state.token && state.user) {
      set({ isAuthenticated: true, isLoading: false })
    } else {
      set({
        user: null,
        token: null,
        sessionId: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
