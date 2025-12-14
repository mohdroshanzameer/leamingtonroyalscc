/**
 * API Client - Local Backend API
 * 
 * This client connects to the local Express.js backend (NO Base44 SDK).
 * Usage: Import { api } from '@/components/api/apiClient'
 */

import { logError, categorizeError } from '@/components/utils/ErrorHandler';
import { createLogger } from '@/components/utils/Logger';

const logger = createLogger('APIClient');

// API Base URL - local backend only
const API_BASE_URL = 'http://localhost:5000/api';

// Token key used across the app
const ACCESS_TOKEN_KEY = 'access_token';

// Helper for API requests
const request = async (endpoint, options = {}) => {
  const startTime = Date.now();
  
  try {
    logger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`, {
      options: { ...options, body: options.body ? 'REDACTED' : undefined }
    });

    // Always read the latest token from storage.
    // (Avoid stale module-level tokens after login/logout.)
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      // Attach status so callers can make correct decisions (e.g. redirect only on 401/403).
      error.status = response.status;
      error.statusText = response.statusText;
      
      logger.error(`API Error: ${endpoint}`, error, {
        status: response.status,
        statusText: response.statusText,
        duration,
        endpoint
      });

      logError(error, {
        type: 'API_ERROR',
        endpoint,
        status: response.status,
        duration,
        category: categorizeError(error)
      });

      throw error;
    }

    const data = await response.json();
    
    logger.debug(`API Success: ${endpoint}`, {
      status: response.status,
      duration
    });

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Network error
    if (!error.message || error.name === 'TypeError') {
      const networkError = new Error('Network error - unable to connect to server');
      
      logger.error(`Network Error: ${endpoint}`, networkError, {
        originalError: error?.message,
        duration,
        endpoint
      });

      logError(networkError, {
        type: 'NETWORK_ERROR',
        endpoint,
        duration,
        originalError: error?.message
      });

      throw networkError;
    }
    
    throw error;
  }
};

// Entity CRUD operations factory (for self-hosted mode)
const createEntityMethods = (entityName) => ({
  // List all records with optional sorting and limit
   list: async (sort = '-created_date', limit = 100) => {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    const query = params.toString() ? `?${params}` : '';
    return request(`/entities/${entityName}${query}`);
  },

  // Filter records with query object
  filter: async (query, sort = '-created_date', limit = 100) => {
    return request(`/entities/${entityName}/filter`, {
      method: 'POST',
      body: JSON.stringify({ query, sort, limit }),
    });
  },

  // Get single record by ID
  get: async (id) => {
    return request(`/entities/${entityName}/${id}`);
  },

  // Create new record
  create: async (data) => {
    return request(`/entities/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bulk create records
  bulkCreate: async (items) => {
    return request(`/entities/${entityName}/bulk`, {
      method: 'POST',
      body: JSON.stringify(items),
    });
  },

  // Update record
  update: async (id, data) => {
    return request(`/entities/${entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete record
  delete: async (id) => {
    return request(`/entities/${entityName}/${id}`, {
      method: 'DELETE',
    });
  },

  // Get schema (for forms)
  schema: async () => {
    return request(`/entities/${entityName}/schema`);
  },
});

// Entity proxy - creates methods on demand for any entity name
const entitiesProxy = new Proxy({}, {
  get: (target, entityName) => {
    if (!target[entityName]) {
      target[entityName] = createEntityMethods(entityName);
    }
    return target[entityName];
  },
});

// Auth methods
const auth = {
  // Get current user
  me: async () => {
    try {
      logger.info('Fetching current user');
      const user = await request('/auth/me');
      logger.info('User fetched successfully', { email: user.email });
      return user;
    } catch (error) {
      logger.warn('Failed to fetch user', error);
      throw error;
    }
  },

  // Check if authenticated
  isAuthenticated: async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      logger.debug('No access token found');
      return false;
    }
    try {
      await request('/auth/check');
      logger.debug('Auth check passed');
      return true;
    } catch (error) {
      logger.debug('Auth check failed', error);
      return false;
    }
  },

  // Update current user
  updateMe: async (data) => {
    try {
      logger.info('Updating user profile');
      const result = await request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      logger.info('User profile updated successfully');
      return result;
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw error;
    }
  },

  // Redirect to login (Supabase Auth UI)
  redirectToLogin: (nextUrl) => {
    const returnUrl = nextUrl || window.location.href;
    logger.info('Redirecting to login', { returnUrl });
    // App uses /signin (see router.jsx)
    window.location.href = `/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
  },

  // Logout
  logout: async (redirectUrl) => {
    try {
      logger.info('Logging out user');
      await request('/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      logger.info('Logout successful');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.reload();
      }
    } catch (error) {
      logger.error('Logout error', error);
      // Still clear token even if request fails
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.location.reload();
    }
  },

  // Set token (called after Supabase auth)
  setToken: (token) => {
    logger.info('Setting access token');
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  // Get current token
  getToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
};

// Integration methods (LLM, Email, File Upload, etc.)
const integrations = {
  Core: {
    // Invoke LLM
    InvokeLLM: async ({ prompt, add_context_from_internet, response_json_schema, file_urls }) => {
      return request('/integrations/llm', {
        method: 'POST',
        body: JSON.stringify({ prompt, add_context_from_internet, response_json_schema, file_urls }),
      });
    },

    // Send email
    SendEmail: async ({ to, subject, body, from_name }) => {
      return request('/integrations/send-email', {
        method: 'POST',
        body: JSON.stringify({ to, subject, body, from_name }),
      });
    },

    // Upload file (public)
    UploadFile: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);

      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      const response = await fetch(`${API_BASE_URL}/integrations/upload`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },

    // Upload private file
    UploadPrivateFile: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);

      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      const response = await fetch(`${API_BASE_URL}/integrations/upload-private`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },

    // Create signed URL for private file
    CreateFileSignedUrl: async ({ file_uri, expires_in = 300 }) => {
      return request('/integrations/signed-url', {
        method: 'POST',
        body: JSON.stringify({ file_uri, expires_in }),
      });
    },

    // Generate image with AI
    GenerateImage: async ({ prompt }) => {
      return request('/integrations/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
    },

    // Extract data from uploaded file
    ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
      return request('/integrations/extract-data', {
        method: 'POST',
        body: JSON.stringify({ file_url, json_schema }),
      });
    },
  },
};

// Export API client
export const api = {
  entities: entitiesProxy,
  auth,
  integrations,
};

export default api;