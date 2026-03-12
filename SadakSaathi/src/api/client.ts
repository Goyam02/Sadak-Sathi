import axios from 'axios';
import { BASE_URL } from '../constants/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — log in dev
client.interceptors.request.use(
  config => {
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor — normalize errors
client.interceptors.response.use(
  response => response,
  error => {
    if (__DEV__) {
      console.error('[API Error]', error.response?.status, error.response?.data ?? error.message);
    }
    return Promise.reject(error);
  },
);

export default client;
