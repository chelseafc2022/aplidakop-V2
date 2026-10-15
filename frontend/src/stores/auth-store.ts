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

const initialStoredUser = typeof window !== 'undefined' ? (() => {
  try {
    const raw = localStorage.getItem('aplidakop-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})() : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: initialStoredUser,
  isAuthenticated: Boolean(initialStoredUser),
  isLoading: false,

  setAuth: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aplidakop-user', JSON.stringify(user));
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },
  updateUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aplidakop-user', JSON.stringify(user));
    }
    set({ user });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // State lokal tetap dibersihkan
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aplidakop-token');
        localStorage.removeItem('aplidakop-user');
        localStorage.removeItem('aplidakop-auth');
      }
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
