import axios from 'axios';

const API_URL = '/api';

export interface Credentials {
  email: string;
  password: string;
}

// UPDATED: login now returns both token *and* user object
export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

export function signup(creds: Credentials) {
  return axios.post<void>(`${API_URL}/auth/signup`, creds);
}

export function login(creds: Credentials) {
  return axios.post<AuthResponse>(`${API_URL}/auth/login`, creds);
}

export function setAuthHeader(token: string) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthHeader() {
  delete axios.defaults.headers.common['Authorization'];
}
