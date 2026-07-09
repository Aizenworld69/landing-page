import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseClient } from '@/lib/portal/supabase-client';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  refreshToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
        if (typeof window !== 'undefined') {
          // Sync to access_token cookie for middleware verification.
          // Note: Cookie này là SameSite=Lax, KHÔNG httpOnly vì JavaScript cần set/clear nó từ client. 
          // Đây là trade-off đã được cân nhắc — chấp nhận được vì token Supabase tự expire sau 1 giờ và có refresh mechanism.
          document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
        }
      },

      refreshToken: async () => {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.auth.refreshSession();
          if (error || !data.session) {
            set({ user: null, accessToken: null, isAuthenticated: false });
            if (typeof window !== 'undefined') {
              document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
            }
            return null;
          }
          const user: AuthUser = {
            id: data.session.user.id,
            email: data.session.user.email!,
            full_name: data.session.user.user_metadata?.['full_name'] || '',
            avatar_url: data.session.user.user_metadata?.['avatar_url'] || null,
          };
          const token = data.session.access_token;
          set({ user, accessToken: token, isAuthenticated: true });
          if (typeof window !== 'undefined') {
            document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          }
          return token;
        } catch (err) {
          set({ user: null, accessToken: null, isAuthenticated: false });
          if (typeof window !== 'undefined') {
            document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
          }
          return null;
        }
      },
    }),
    {
      name: 'aizen-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
