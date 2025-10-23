import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '@/constants/Config';
import { getToken } from '@/utils/storage';
import { showError } from '@/utils/toast';

/**
 * Axios instance with configuration and interceptors
 */

const api: AxiosInstance = axios.create({
  baseURL: Config.API_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        showError('Request timed out. Please try again.');
      } else {
        showError('No internet connection. Please check your network.');
      }
      return Promise.reject(error);
    }

    // Handle HTTP errors
    const status = error.response.status;

    if (status === 401) {
      // Unauthorized - token expired or invalid
      // This would trigger logout in the app
      showError('Session expired. Please log in again.');
    } else if (status === 500) {
      showError('Something went wrong. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default api;
