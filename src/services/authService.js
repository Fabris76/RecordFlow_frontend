import { apiRequest } from './api';

const TOKEN_KEY = 'momo_token';
const USER_KEY = 'momo_user';

export async function login(phone, password) {
  const response = await apiRequest('/auth/login', { method: 'POST', body: { phone, password } });
  sessionStorage.setItem(TOKEN_KEY, response.data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
  return response.data.user;
}

export function logout() { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); }
export function getStoredUser() { try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
export function hasToken() { return Boolean(sessionStorage.getItem(TOKEN_KEY)); }
export async function getCurrentUser() { const response = await apiRequest('/auth/me'); sessionStorage.setItem(USER_KEY, JSON.stringify(response.data)); return response.data; }
