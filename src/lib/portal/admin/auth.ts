// Client-side only — chỉ gọi trong browser context
const ADMIN_TOKEN_KEY = 'admin_access_token';
const ADMIN_USER_KEY = 'admin_user';

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
}

export function setAdminSession(token: string, user: AdminUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  // Cookie cho middleware (8h)
  document.cookie = `admin_token=${token}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AdminUser; } catch { return null; }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}