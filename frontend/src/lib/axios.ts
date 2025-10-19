import axios from 'axios';

// Get base URL from env and append /api for all API calls
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api-fleetly.onrender.com';
const API_URL = `${BASE_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh token for login, register, or refresh endpoints
    const skipRefreshUrls = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/verify-otp",
      "/auth/send-otp",
    ];
    const isSkipUrl = skipRefreshUrls.some((url) =>
      originalRequest.url?.includes(url)
    );

    // If token expired, try to refresh (but not for auth endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isSkipUrl
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // If no refresh token, clear everything and redirect
        if (!refreshToken) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/";
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("refreshToken", data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user silently
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

