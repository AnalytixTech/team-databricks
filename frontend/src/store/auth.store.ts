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
      // Clear any existing expired tokens before login attempt
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
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
      localStorage.setItem('user', JSON.stringify(response.user));
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
    const cachedUser = localStorage.getItem('user');
    
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    // Use cached user data immediately to prevent flicker
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        set({ user, isAuthenticated: true });
      } catch (e) {
        // Invalid cached user data
        localStorage.removeItem('user');
      }
    }

    // Then verify with backend in the background
    try {
      const user = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      // Only logout if we get a clear auth error
      // Don't logout on network errors
      const isAuthError = (error as any)?.response?.status === 401;
      if (isAuthError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));

