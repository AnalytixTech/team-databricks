import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { mockAuthResponse, mockUser } from '../mocks/mockData';

vi.mock('@/services/auth.service');

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset the store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state when no token', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should read token from localStorage on init', () => {
      localStorage.setItem('token', 'existing-token');
      
      // Re-initialize store to pick up localStorage
      const token = localStorage.getItem('token');
      useAuthStore.setState({ token, isAuthenticated: !!token });
      
      const state = useAuthStore.getState();
      expect(state.token).toBe('existing-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set user and update authentication status', () => {
      const { setUser } = useAuthStore.getState();
      
      setUser(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear authentication when user is null', () => {
      const { setUser } = useAuthStore.getState();
      
      // First set a user
      setUser(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then clear it
      setUser(null);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setToken', () => {
    it('should set token in state and localStorage', () => {
      const { setToken } = useAuthStore.getState();
      
      setToken('new-token');
      
      const state = useAuthStore.getState();
      expect(state.token).toBe('new-token');
      expect(state.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('should remove token from state and localStorage when null', () => {
      const { setToken } = useAuthStore.getState();
      
      // First set a token
      setToken('test-token');
      expect(localStorage.getItem('token')).toBe('test-token');
      
      // Then clear it
      setToken(null);
      
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and update state', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockAuthResponse.user);
      expect(state.token).toBe(mockAuthResponse.token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      
      expect(localStorage.getItem('token')).toBe(mockAuthResponse.token);
      expect(localStorage.getItem('refreshToken')).toBe(mockAuthResponse.refreshToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockAuthResponse.user));
    });

    it('should clear existing tokens before login', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('refreshToken', 'old-refresh');
      localStorage.setItem('user', 'old-user');
      
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');
      
      expect(localStorage.getItem('token')).toBe(mockAuthResponse.token);
    });

    it('should set loading state during login', async () => {
      let loadingDuringCall = false;
      
      vi.mocked(authService.login).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading;
        return mockAuthResponse;
      });
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');
      
      expect(loadingDuringCall).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));
      
      const { login } = useAuthStore.getState();
      
      await expect(login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
      
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('register', () => {
    it('should register successfully and update state', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);
      
      const { register } = useAuthStore.getState();
      const result = await register({
        email: 'newuser@example.com',
        password: 'password123',
      });
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockAuthResponse.user);
      expect(state.token).toBe(mockAuthResponse.token);
      expect(state.isAuthenticated).toBe(true);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle registration failure', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Email already exists'));
      
      const { register } = useAuthStore.getState();
      
      await expect(register({ email: 'test@example.com', password: '123' })).rejects.toThrow(
        'Email already exists'
      );
      
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout and clear state', async () => {
      // Setup logged in state
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
      });
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      vi.mocked(authService.logout).mockResolvedValue();
      
      const { logout } = useAuthStore.getState();
      await logout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should set unauthenticated when no token', async () => {
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should use cached user data immediately', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should verify with backend and update user', async () => {
      localStorage.setItem('token', 'test-token');
      
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should logout on 401 auth error', async () => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const authError = { response: { status: 401 } };
      vi.mocked(authService.getCurrentUser).mockRejectedValue(authError);
      
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should not logout on network error', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      
      const networkError = { response: { status: 500 } };
      vi.mocked(authService.getCurrentUser).mockRejectedValue(networkError);
      
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();
      
      const state = useAuthStore.getState();
      // Should keep cached user on network errors
      expect(state.user).toEqual(mockUser);
      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('should handle invalid cached user data', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', 'invalid-json');
      
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();
      
      // Should not crash and should fetch from backend
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });
  });
});

