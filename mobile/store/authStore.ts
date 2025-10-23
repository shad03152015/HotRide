import { create } from 'zustand';
import { User } from '@/services/auth';
import { saveToken, saveUser, removeToken, removeUser } from '@/utils/storage';

/**
 * Authentication state management with Zustand
 */

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
    saveUser(user);
  },

  setToken: (token: string) => {
    set({ token });
    saveToken(token);
  },

  setAuth: async (token: string, user: User) => {
    await saveToken(token);
    await saveUser(user);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await removeToken();
    await removeUser();
    set({ token: null, user: null, isAuthenticated: false });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
