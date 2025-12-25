import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check for token refresh suggestion
    const refreshSuggested = response.headers['x-token-refresh-suggested'];
    if (refreshSuggested === 'true') {
      // Trigger token refresh in background
      const authService = require('./authService');
      const token = localStorage.getItem('authToken');
      if (token) {
        authService.authService.refreshToken(token).catch(() => {
          // If refresh fails, user will be logged out by auth context
        });
      }
    }
    
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        // Token expired or invalid
        if (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_TOKEN') {
          // Clear auth data and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          
          // Dispatch custom event to notify auth context
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
      
      // Handle rate limiting
      if (status === 429) {
        console.warn('Rate limit exceeded:', data.error);
      }
      
      // Handle server errors
      if (status >= 500) {
        console.error('Server error:', data.error);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.get(url, config),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.post(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.put(url, data, config),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.patch(url, data, config),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.delete(url, config),
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.request) {
    return 'Network error. Please check your connection and try again.';
  } else {
    return 'An unexpected error occurred. Please try again.';
  }
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

export const isServerError = (error: any): boolean => {
  return error.response && error.response.status >= 500;
};

export const isClientError = (error: any): boolean => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};

export default api;