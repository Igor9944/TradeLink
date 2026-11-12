import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

// Default redirect path for 401 errors, can be overridden
let unauthorizedRedirectPath = '/login'

export function setUnauthorizedRedirectPath(path: string) {
  unauthorizedRedirectPath = path
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
})

// Request interceptor pour ajouter le token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const state = useAuthStore.getState()
      const token = state.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne rediriger que si on n'est pas déjà sur une page publique
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const { logout } = useAuthStore.getState()
        logout()
        window.location.href = unauthorizedRedirectPath
      }
    }
    return Promise.reject(error)
  }
)

export default api
