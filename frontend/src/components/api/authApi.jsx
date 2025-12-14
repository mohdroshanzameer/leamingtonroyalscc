/**
 * Auth API - Authentication endpoints
 */

import { httpClient } from './httpClient';
import { config } from '@/components/lib/config';

const { TOKEN_KEY } = config.auth;

export const authApi = {
  /**
   * Login user
   */
  async login(credentials) {
    const response = await httpClient.post('/auth/login', credentials);
    // Backend returns { access_token, user }
    const token = response?.access_token || response?.token;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return response;
  },

  /**
   * Register new user
   */
  async register(userData) {
    const response = await httpClient.post('/auth/register', userData);
    // Backend returns { access_token, user }
    const token = response?.access_token || response?.token;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return response;
  },

  /**
   * Get current user
   */
  async getMe() {
    return httpClient.get('/auth/me');
  },

  /**
   * Update current user
   */
  async updateMe(data) {
    return httpClient.put('/auth/me', data);
  },

  /**
   * Check if authenticated
   */
  async checkAuth() {
    try {
      await httpClient.get('/auth/check');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await httpClient.post('/auth/logout');
    } catch {
      // Continue even if request fails
    }
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Get current token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Set token
   */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Clear token
   */
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export default authApi;