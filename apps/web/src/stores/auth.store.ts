import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@gem/types';
import { api } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      setTokens: (accessToken: string, refreshToken: string) => {
        // Store in-memory for requests
        if (typeof window !== 'undefined') {
          window.__gem_access_token__ = accessToken;
          localStorage.setItem('gem_refresh_token', refreshToken);
        }
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          window.__gem_access_token__ = undefined;
          localStorage.removeItem('gem_refresh_token');
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.auth.login({ email, password });
          const { accessToken, refreshToken, user } = response.data.data;
          get().setTokens(accessToken, refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await api.auth.register(data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await api.auth.logout(refreshToken ?? undefined);
        } catch {
          // Ignore errors on logout
        }
        get().clearAuth();
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const response = await api.auth.me();
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          get().clearAuth();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'gem-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token to window after hydration
        if (state?.accessToken && typeof window !== 'undefined') {
          window.__gem_access_token__ = state.accessToken;
        }
      },
    },
  ),
);
