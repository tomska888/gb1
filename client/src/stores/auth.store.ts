import { defineStore } from 'pinia'
import {
  signup as signupRequest,
  login as loginRequest,
  setAuthHeader,
  clearAuthHeader,
  Credentials,
} from '@/services/auth.service'

interface AuthState {
  token: string | null
  userEmail: string | null
  userCreatedAt: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    userEmail: localStorage.getItem('userEmail'),
    userCreatedAt: localStorage.getItem('userCreatedAt'),
  }),

  actions: {
    async signup(creds: Credentials) {
      await signupRequest(creds)
      await this.login(creds) // your current flow, now login returns created_at too
    },

    async login(creds: Credentials) {
      const { data } = await loginRequest(creds)

      // 1) token
      this.token = data.token
      localStorage.setItem('token', data.token)
      setAuthHeader(data.token)

      // 2) user email
      this.userEmail = data.user.email
      localStorage.setItem('userEmail', data.user.email)

      // 3) member since
      const createdAt = (data?.user as any)?.created_at ?? null
      this.userCreatedAt = createdAt
      if (createdAt) localStorage.setItem('userCreatedAt', createdAt)
      else localStorage.removeItem('userCreatedAt')
    },

    async refreshMe() {
      // Use fetch directly; your auth.service may not have /me helper
      if (!this.token) return
      const r = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (!r.ok) return
      const me = await r.json()
      this.userEmail = me.email ?? this.userEmail
      this.userCreatedAt = me.created_at ?? this.userCreatedAt
      if (this.userEmail) localStorage.setItem('userEmail', this.userEmail)
      if (this.userCreatedAt) localStorage.setItem('userCreatedAt', this.userCreatedAt)
    },

    logout() {
      this.token = null
      this.userEmail = null
      this.userCreatedAt = null
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userCreatedAt')
      clearAuthHeader()
    },
  },
})
