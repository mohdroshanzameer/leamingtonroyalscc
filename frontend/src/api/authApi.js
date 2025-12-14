import { httpClient } from './httpClient';

export const authApi = {
  me: async () => {
    return await httpClient('/auth/me');
  },
  login: async (email, password) => {
    const data = await httpClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) localStorage.setItem('auth_token', data.token);
    return data;
  },
  logout: (redirectUrl) => {
    localStorage.removeItem('auth_token');
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.reload();
  },
  updateMe: async (data) => {
    return await httpClient('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  isAuthenticated: async () => {
    try {
      await authApi.me();
      return true;
    } catch {
      return false;
    }
  }
};
