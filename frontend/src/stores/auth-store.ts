'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';

export interface UserProfile {
  id: string;
  username: string;
  nama: string;
  email?: string;
  nip?: string;
  hp?: string;
  instansiNama?: string;
  unitKerjaNama?: string;
  roleId?: string;
  role?: {
    id: string;
    nama: string;
    permissions?: Array<{
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      menu?: {
        id: string;
        title: string;
        url: string;
        icon?: string;
      };
    }>;
  };
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  updateUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (user) => set({ user }),

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch (e) {
          // ignore logout network errors
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          if (!token) {
            set({ isAuthenticated: false, isLoading: false, user: null });
            return;
          }
          const { data } = await api.get('/auth/me');
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isAuthenticated: false, isLoading: false, user: null });
        }
      },
    }),
    {
      name: 'aplidakop-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
