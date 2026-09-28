import axios from 'axios';
import Cookies from 'js-cookie';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL,
  timeout: 30000,
});

let refreshRequest: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = Cookies.get('refresh_token');
  if (!refresh) {
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${baseURL}/auth/refresh/`, { refresh })
      .then((response) => {
        const access = response.data.access as string;
        Cookies.set('access_token', access, { expires: 1 / 96, path: '/' });
        if (response.data.refresh) {
          Cookies.set('refresh_token', response.data.refresh, { expires: 7, path: '/' });
        }
        return access;
      })
      .catch(() => {
        Cookies.remove('access_token', { path: '/' });
        Cookies.remove('refresh_token', { path: '/' });
        return null;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

// Attach the access token to every request automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Renew short-lived access tokens with the seven-day refresh token.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const access = await refreshAccessToken();
    if (!access) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${access}`;
    return api(originalRequest);
  }
);

export default api;