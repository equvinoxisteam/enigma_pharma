import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

export const getFriendlyApiError = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error?.response) {
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
      return 'Unable to reach Enigma Pharma right now. Please check your connection and try again in a moment.';
    }
    return fallback;
  }
  const msg = error.response?.data?.message;
  if (msg && typeof msg === 'string' && !msg.startsWith('Server error:')) {
    return msg;
  }
  const status = error.response.status;
  if (status === 403) return 'You do not have permission for this action.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status >= 500) return 'Our servers are busy. Please try again shortly.';
  return fallback;
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = storedToken || user.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    error.friendlyMessage = getFriendlyApiError(error);

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');
      const message = error.response?.data?.message || '';

      if (!isAuthRequest) {
        const keepSession =
          message.includes('Email not verified') ||
          message.includes('plan does not include') ||
          requestUrl.includes('/api/search/recommendations');

        if (!keepSession) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          if (!window.location.pathname.includes('/role-selection') &&
              !window.location.pathname.includes('/login') &&
              !window.location.pathname.includes('/register') &&
              !window.location.pathname.includes('/verify-email') &&
              !window.location.pathname.includes('/forgot-password') &&
              !window.location.pathname.includes('/reset-password')) {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
