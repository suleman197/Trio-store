import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voltiq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    let message = err.response?.data?.message;
    if (!message) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.message === 'Network Error') {
        message = 'Network Error: Failed to upload. Please check your internet connection or try a smaller image.';
      } else {
        message = err.message || 'Something went wrong';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
