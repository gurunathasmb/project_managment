import axios from 'axios';

// Base configuration
const instance = axios.create({
  baseURL: 'http://localhost:8000/api', // Change if using a different port or path
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to all requests (if available)
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default instance;
