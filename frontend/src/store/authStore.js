import { create } from 'zustand';
import { apiRequest } from '../api/client';

const TOKEN_KEY = 'edu_attend_token';
const USER_KEY = 'edu_attend_user';

function loadStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (!token || !user) {
      return { token: null, user: null };
    }

    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const stored = loadStoredAuth();

export const useAuthStore = create((set, get) => ({
  token: stored.token,
  user: stored.user,
  isLoading: false,
  error: null,

  async login(email, password) {
    set({ isLoading: true, error: null });

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        isLoading: false,
        error: null,
      });

      return data.user;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, error: null });
  },

  homePathByRole() {
    const role = get().user?.role;

    if (role === 'admin') return '/admin';
    if (role === 'teacher') return '/teacher';
    if (role === 'student') return '/student';
    return '/login';
  },
}));
