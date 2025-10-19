import { create } from 'zustand';
import { IUser, AuthResponse } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(data);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return response; // Return full response for converted reservations count
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch (error) {
      await authService.logout();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

