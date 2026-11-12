import api from '@/lib/api'
import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '@/types'

interface ApiTokenResponse {
  access_token: string
  refresh_token: string
  session_id: string
}

interface ApiAuthResponse extends ApiTokenResponse {
  user: User
}

interface MfaSetupResponse {
  secret: string
  otpAuthUrl: string
}

interface MfaEnableResponse {
  message: string
  recoveryCodes: string[]
}

export interface UserSession {
  id: string
  deviceInfo: string | null
  ipAddress: string | null
  createdAt: string
  lastUsedAt: string | null
}

function normalizeTokens(response: ApiTokenResponse): RefreshTokenResponse {
  if (!response.access_token || !response.refresh_token || !response.session_id) {
    throw new Error('Réponse d’authentification incomplète')
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    sessionId: response.session_id,
  }
}

function normalizeAuthResponse(response: ApiAuthResponse): AuthResponse {
  return {
    ...normalizeTokens(response),
    user: response.user,
  }
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<
      ApiAuthResponse | Extract<LoginResponse, { requiresMfa: true }>
    >('/auth/login', data)
    return 'requiresMfa' in response.data
      ? response.data
      : normalizeAuthResponse(response.data)
  },

  verifyMfa: async (challengeToken: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<ApiTokenResponse>('/auth/mfa/verify', { challengeToken, code })
    const tokens = normalizeTokens(response.data)
    const profile = await api.get<User>('/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
    return { ...tokens, user: profile.data }
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data)
    return response.data
  },

  verifyOtp: async (userId: string, code: string): Promise<void> => {
    await api.post('/auth/verify-otp', { userId, code, purpose: 'REGISTER' })
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { email, code, newPassword })
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post<ApiTokenResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken },
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    )
    return normalizeTokens(response.data)
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/me')
    return response.data
  },

  setupMfa: async (): Promise<MfaSetupResponse> => {
    const response = await api.post<MfaSetupResponse>('/auth/mfa/setup')
    return response.data
  },

  enableMfa: async (code: string): Promise<MfaEnableResponse> => {
    const response = await api.post<MfaEnableResponse>('/auth/mfa/enable', { code })
    return response.data
  },

  disableMfa: async (code: string): Promise<void> => {
    await api.post('/auth/mfa/disable', { code })
  },

  getSessions: async (): Promise<UserSession[]> => {
    const response = await api.get<UserSession[]>('/users/me/sessions')
    return response.data
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/users/me/sessions/${encodeURIComponent(sessionId)}`)
  },
}
