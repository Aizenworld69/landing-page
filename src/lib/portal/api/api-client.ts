import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/portal/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach auth token from Zustand if present
  instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Interceptor response: if 401, refresh token and retry exactly once
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<{ message?: string }>) => {
      const originalRequest = error.config as CustomAxiosRequestConfig;

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        if (typeof window !== 'undefined') {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              const newToken = await useAuthStore.getState().refreshToken();
              isRefreshing = false;
              if (newToken) {
                onRefreshed(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return instance(originalRequest);
              }
            } catch (refreshError) {
              isRefreshing = false;
              return Promise.reject(refreshError);
            }
          } else {
            return new Promise((resolve) => {
              subscribeTokenRefresh((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(instance(originalRequest));
              });
            });
          }
        }
      }

      const message =
        error.response?.data?.message ?? error.message ?? 'Something went wrong';
      return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
    },
  );

  return instance;
}

export const apiClient = createApiClient();
