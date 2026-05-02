import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role: string }) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        connectSocket(accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          disconnectSocket();
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      refreshUser: async () => {
        try {
          set({ isLoading: true });
          const { data } = await api.get('/auth/me');
          set({ user: data.user, isAuthenticated: true });
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
          localStorage.removeItem('accessToken');
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/register', formData);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyEmail: async (email, otp) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/verify-email', { email, otp });
          get().setAuth(data.user, data.accessToken);
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          get().setAuth(data.user, data.accessToken);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'trustlance-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
