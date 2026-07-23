// Client-side only — chỉ gọi trong browser context
// ⚠️ SECURITY: Token KHÔNG bao giờ lưu vào localStorage (dễ bị XSS đánh cắp)
// Token được lưu bằng document.cookie (SameSite=Lax) — middleware đọc từ cookie này
// User info (không nhạy cảm) lưu sessionStorage để hiển thị UI

const ADMIN_USER_KEY = 'admin_user';
const SESSION_DURATION_SECS = 8 * 60 * 60; // 8 giờ

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
}

export function setAdminSession(token: string, user: AdminUser): void {
  if (typeof window === 'undefined') return;

  // Lưu user info (không nhạy cảm) vào sessionStorage để hiển thị UI admin
  try {
    sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  } catch (_) {}

  // Token → cookie (SameSite=Lax, Secure khi production)
  // Không dùng localStorage — localStorage scope theo origin, khách hàng thấy được!
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `admin_token=${token}; path=/; max-age=${SESSION_DURATION_SECS}; SameSite=Lax${secure}`;
}

export function getAdminToken(): string | null {
  if (typeof document === 'undefined') return null;
  // Đọc từ cookie (không phải localStorage)
  const match = document.cookie.match(/(?:^|;)\s*admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  // Xóa user info khỏi sessionStorage
  try { sessionStorage.removeItem(ADMIN_USER_KEY); } catch (_) {}
  // Xóa token cookie
  document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';

  // Dọn dẹp localStorage cũ (nếu user đã login trước khi fix này)
  try {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_expires_at');
    localStorage.removeItem('admin_user');
  } catch (_) {}
}

export function isAdminLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  const token = getAdminToken();
  return !!token;
}

// Dọn dẹp các key cũ trong localStorage khi app khởi động
// Gọi 1 lần trong layout admin để xóa token cũ còn sót lại
export function cleanupLegacyAdminStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_expires_at');
    // Không xóa admin_user vì có thể dùng sessionStorage rồi
    const oldUser = localStorage.getItem('admin_user');
    if (oldUser) {
      // Di chuyển sang sessionStorage rồi xóa khỏi localStorage
      try { sessionStorage.setItem(ADMIN_USER_KEY, oldUser); } catch (_) {}
      localStorage.removeItem('admin_user');
    }
  } catch (_) {}
}