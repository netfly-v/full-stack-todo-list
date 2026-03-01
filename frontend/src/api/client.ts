import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

const shouldSkipRefresh = (config?: InternalAxiosRequestConfig) => {
  const url = config?.url ?? '';
  return (
    url.includes('/auth/me') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/refresh')
  );
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshApi.post('/auth/refresh').then(() => undefined);
      }

      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);
