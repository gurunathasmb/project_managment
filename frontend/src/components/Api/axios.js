import axios from 'axios';

// Base configuration
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
// Attach token to every request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
// Auto logout on 401 / 403
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // 🔥 Token invalid / expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 🔁 Redirect to login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default instance;