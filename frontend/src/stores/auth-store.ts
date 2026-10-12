'use client';

import { create } from 'zustand';

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
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  updateUser: (user) => set({ user }),

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // State lokal tetap dibersihkan apabila backend sedang tidak tersedia.
    } finally {
      if (typeof window !== 'undefined') localStorage.removeItem('aplidakop-auth');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
