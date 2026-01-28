import { toast } from 'react-toastify';

/* ---------------- TOAST HELPERS ---------------- */

export const handleSuccess = (msg) => {
  toast.success(msg, {
    position: 'top-right',
    autoClose: 3000,
  });
};

export const handleError = (msg) => {
  toast.error(msg, {
    position: 'top-right',
    autoClose: 4000,
  });
};

/* ---------------- LOGOUT HELPER ---------------- */

export const logout = (navigate) => {
  // 🔥 Clear auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user'); // if stored

  // Optional hard reset
  // localStorage.clear();

  // 🔁 Redirect to login
  navigate('/login', { replace: true });

  // 💥 Force app reset so ProtectedRoute re-checks auth
  window.location.reload();
};