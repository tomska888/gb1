import { defineStore } from 'pinia';
import {
  signup as signupRequest,
  login as loginRequest,
  setAuthHeader,
  clearAuthHeader,
  Credentials,
  AuthResponse
} from '@/services/auth.service';

interface AuthState {
  token: string | null;
  userEmail: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    userEmail: localStorage.getItem('userEmail'),
  }),
  actions: {
    async signup(creds: Credentials) {
      await signupRequest(creds);
      await this.login(creds);
    },

    async login(creds: Credentials) {
      const { data } = await loginRequest(creds);
      // 1) store token
      this.token = data.token;
      localStorage.setItem('token', data.token);
      setAuthHeader(data.token);

      // 2) store & persist email
      this.userEmail = data.user.email;
      localStorage.setItem('userEmail', data.user.email);
    },

    logout() {
      this.token = null;
      this.userEmail = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      clearAuthHeader();
    },
  },
});
