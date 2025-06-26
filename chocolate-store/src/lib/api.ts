import axios from 'axios';
import { parseCookies } from 'nookies';

// Use environment variable or default to your local API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const cookies = parseCookies();
  const token = cookies.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      if (typeof window !== 'undefined') {
        // Only redirect on client side
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;