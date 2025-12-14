/**
 * Production-Grade API Client
 * 
 * Features:
 * - JWT authentication with auto-refresh
 * - Request/response interceptors
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Comprehensive error handling
 * - Request cancellation with AbortController
 * - Persistent offline queue with IndexedDB
 * - Performance monitoring & analytics
 * - WebSocket support for real-time updates
 * - Rate limiting
 * - Optimistic updates
 * - Request timeout
 * - Response caching with configurable TTL
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const CIRCUIT_BREAKER_THRESHOLD = 5; // failures before opening
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
const COMPRESSION_THRESHOLD = 1024; // 1KB

// ============================================================================
// Token Management
// ============================================================================

class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem(TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.refreshPromise = null;
  }

  getAccessToken() {
    return this.accessToken;
  }

  setTokens(access, refresh = null) {
    this.accessToken = access;
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) {
      this.refreshToken = refresh;
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  async refreshAccessToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    })
      .then(res => res.json())
      .then(data => {
        this.setTokens(data.access_token, data.refresh_token);
        return data.access_token;
      })
      .catch(() => {
        this.clearTokens();
        throw new Error('Session expired');
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}

const tokenManager = new TokenManager();

// ============================================================================
// IndexedDB Manager (Persistent Offline Queue)
// ============================================================================

class IndexedDBManager {
  constructor() {
    this.dbName = 'api_client_db';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addToQueue(request) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const req = store.add({ ...request, timestamp: Date.now() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getQueue() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline_queue'], 'readonly');
      const store = transaction.objectStore('offline_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async removeFromQueue(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async setCache(key, data, ttl = 300000) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const req = store.put({ key, data, timestamp: Date.now(), ttl });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getCache(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (result && Date.now() - result.timestamp < result.ttl) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearExpiredCache() {
    if (!this.db) await this.init();
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');
    const request = index.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const record = cursor.value;
        if (Date.now() - record.timestamp > record.ttl) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}

const idbManager = new IndexedDBManager();
idbManager.init().catch(console.error);

// Cleanup expired cache every 5 minutes
setInterval(() => idbManager.clearExpiredCache(), 300000);

// ============================================================================
// Request Queue (with IndexedDB persistence)
// ============================================================================

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.loadPersistedQueue();
  }

  async loadPersistedQueue() {
    try {
      const persistedQueue = await idbManager.getQueue();
      for (const item of persistedQueue) {
        this.enqueue(item.fn, true, item.id);
      }
    } catch (error) {
      console.error('Failed to load persisted queue:', error);
    }
  }

  async enqueue(request, skipPersist = false, id = null) {
    this.queue.push({ fn: request, id });
    
    if (!skipPersist) {
      try {
        await idbManager.addToQueue({ fn: request.toString() });
      } catch (error) {
        console.error('Failed to persist request:', error);
      }
    }

    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    try {
      await item.fn();
      if (item.id) {
        await idbManager.removeFromQueue(item.id);
      }
    } catch (error) {
      console.error('Queued request failed:', error);
      // Re-queue on failure
      this.queue.push(item);
    }

    this.process();
  }
}

const requestQueue = new RequestQueue();

// Process queue when coming back online
window.addEventListener('online', () => {
  console.log('Back online, processing queue...');
  requestQueue.loadPersistedQueue();
});

// ============================================================================
// Request Deduplication
// ============================================================================

class RequestCache {
  constructor() {
    this.pending = new Map();
  }

  getKey(url, options) {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  }

  getPending(url, options) {
    const key = this.getKey(url, options);
    return this.pending.get(key);
  }

  setPending(url, options, promise) {
    const key = this.getKey(url, options);
    this.pending.set(key, promise);
    promise.finally(() => this.pending.delete(key));
  }
}

const requestCache = new RequestCache();

// ============================================================================
// Performance Monitor
// ============================================================================

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }

  startRequest(endpoint) {
    return {
      endpoint,
      startTime: Date.now(),
    };
  }

  endRequest(metric, status, error = null) {
    const duration = Date.now() - metric.startTime;
    this.metrics.push({
      ...metric,
      duration,
      status,
      error,
      timestamp: Date.now(),
    });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Log slow requests (> 2s)
    if (duration > 2000) {
      console.warn(`Slow request: ${metric.endpoint} took ${duration}ms`);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageDuration() {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
  }
}

const perfMonitor = new PerformanceMonitor();

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }

  waitTime() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW);

// ============================================================================
// Request Throttling/Debouncing
// ============================================================================

class ThrottleDebounce {
  constructor() {
    this.throttleTimers = new Map();
    this.debounceTimers = new Map();
  }

  throttle(key, fn, delay = 1000) {
    if (!this.throttleTimers.has(key)) {
      fn();
      this.throttleTimers.set(key, true);
      setTimeout(() => this.throttleTimers.delete(key), delay);
    }
  }

  debounce(key, fn, delay = 1000) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    const timer = setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay);
    this.debounceTimers.set(key, timer);
  }

  cancel(key) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.delete(key);
    }
    this.throttleTimers.delete(key);
  }
}

const throttleDebounce = new ThrottleDebounce();

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

class CircuitBreaker {
  constructor(threshold, timeout) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.warn('Circuit breaker OPEN - too many failures');
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.nextAttempt,
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }
}

const circuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT);

// ============================================================================
// Priority Queue
// ============================================================================

class PriorityQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(fn, priority = 'NORMAL') {
    const priorities = { HIGH: 1, NORMAL: 2, LOW: 3 };
    this.queue.push({ fn, priority: priorities[priority] || 2 });
    this.queue.sort((a, b) => a.priority - b.priority);
    
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    try {
      await item.fn();
    } catch (error) {
      console.error('Priority queue item failed:', error);
    }

    this.process();
  }
}

const priorityQueue = new PriorityQueue();

// ============================================================================
// Request/Response Compression
// ============================================================================

class CompressionManager {
  async compress(data) {
    const str = JSON.stringify(data);
    if (str.length < COMPRESSION_THRESHOLD) return str;

    // Use CompressionStream if available
    if (typeof CompressionStream !== 'undefined') {
      const blob = new Blob([str]);
      const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(stream).blob();
      const arrayBuffer = await compressedBlob.arrayBuffer();
      return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }

    return str;
  }

  async decompress(data) {
    if (!data || typeof data !== 'string') return data;

    // Use DecompressionStream if available
    if (typeof DecompressionStream !== 'undefined' && data.startsWith('H4sI')) {
      try {
        const binaryString = atob(data);
        const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
        const blob = new Blob([bytes]);
        const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressed = await new Response(stream).text();
        return JSON.parse(decompressed);
      } catch {
        return data;
      }
    }

    return data;
  }
}

const compressionManager = new CompressionManager();

// ============================================================================
// Multi-Environment Configuration
// ============================================================================

class EnvironmentConfig {
  constructor() {
    this.environments = {
      development: {
        apiUrl: 'http://localhost:5000/api',
        wsUrl: 'ws://localhost:5000',
        timeout: 30000,
        retries: 3,
        logging: true,
      },
      staging: {
        apiUrl: 'https://staging-api.example.com/api',
        wsUrl: 'wss://staging-api.example.com',
        timeout: 20000,
        retries: 2,
        logging: true,
      },
      production: {
        apiUrl: 'https://api.example.com/api',
        wsUrl: 'wss://api.example.com',
        timeout: 15000,
        retries: 3,
        logging: false,
      },
    };

    this.current = process.env.REACT_APP_ENV || 'development';
  }

  get() {
    return this.environments[this.current];
  }

  set(env) {
    if (this.environments[env]) {
      this.current = env;
      return true;
    }
    return false;
  }

  getApiUrl() {
    return process.env.REACT_APP_API_URL || this.get().apiUrl;
  }

  getWsUrl() {
    return process.env.REACT_APP_WS_URL || this.get().wsUrl;
  }
}

const envConfig = new EnvironmentConfig();

// ============================================================================
// Advanced Analytics Dashboard
// ============================================================================

class AnalyticsDashboard {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      averageResponseTime: 0,
      slowestEndpoint: null,
      fastestEndpoint: null,
      errorsByType: {},
      requestsByEndpoint: {},
      bandwidthUsed: 0,
    };
  }

  recordRequest(endpoint, duration, status, bytes = 0) {
    this.metrics.totalRequests++;
    this.metrics.bandwidthUsed += bytes;

    if (status === 'success') {
      this.metrics.successfulRequests++;
    } else if (status === 'error') {
      this.metrics.failedRequests++;
    } else if (status === 'cache-hit') {
      this.metrics.cachedRequests++;
    }

    // Update average response time
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (total - 1) + duration) / total;

    // Track by endpoint
    if (!this.metrics.requestsByEndpoint[endpoint]) {
      this.metrics.requestsByEndpoint[endpoint] = {
        count: 0,
        avgDuration: 0,
        errors: 0,
      };
    }
    const epMetrics = this.metrics.requestsByEndpoint[endpoint];
    epMetrics.count++;
    epMetrics.avgDuration = 
      (epMetrics.avgDuration * (epMetrics.count - 1) + duration) / epMetrics.count;
    if (status === 'error') epMetrics.errors++;

    // Update slowest/fastest
    if (!this.metrics.slowestEndpoint || duration > this.metrics.slowestEndpoint.duration) {
      this.metrics.slowestEndpoint = { endpoint, duration };
    }
    if (!this.metrics.fastestEndpoint || duration < this.metrics.fastestEndpoint.duration) {
      this.metrics.fastestEndpoint = { endpoint, duration };
    }
  }

  recordError(type) {
    this.metrics.errorsByType[type] = (this.metrics.errorsByType[type] || 0) + 1;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
      cacheHitRate: this.metrics.totalRequests > 0
        ? (this.metrics.cachedRequests / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
    };
  }

  exportReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      ...this.getMetrics(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      averageResponseTime: 0,
      slowestEndpoint: null,
      fastestEndpoint: null,
      errorsByType: {},
      requestsByEndpoint: {},
      bandwidthUsed: 0,
    };
  }
}

const analytics = new AnalyticsDashboard();

// ============================================================================
// GraphQL Client
// ============================================================================

class GraphQLClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async query(query, variables = {}) {
    const response = await httpClient.post(this.endpoint, {
      query,
      variables,
    });
    
    if (response.errors) {
      throw new Error(response.errors[0].message);
    }
    
    return response.data;
  }

  async mutate(mutation, variables = {}) {
    return this.query(mutation, variables);
  }

  async subscribe(subscription, variables = {}, callback) {
    // Use WebSocket for subscriptions
    const subscriptionId = `gql-${Date.now()}`;
    
    wsManager.send('graphql', {
      id: subscriptionId,
      type: 'start',
      payload: { query: subscription, variables },
    });

    return wsManager.subscribe('graphql', (data) => {
      if (data.id === subscriptionId) {
        callback(data.payload);
      }
    });
  }
}

const graphqlClient = new GraphQLClient('/graphql');

// ============================================================================
// WebSocket Manager
// ============================================================================

class WebSocketManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = tokenManager.getAccessToken();
    this.ws = new WebSocket(`${this.baseUrl}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const subscribers = this.subscribers.get(message.channel) || [];
        subscribers.forEach(callback => callback(message.data));
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.reconnect();
    };
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel).push(callback);

    // Send subscribe message
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }

    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    const subscribers = this.subscribers.get(channel) || [];
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }

    if (subscribers.length === 0) {
      this.subscribers.delete(channel);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
      }
    }
  }

  send(channel, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', channel, data }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const wsManager = new WebSocketManager(WS_BASE_URL);

// ============================================================================
// Optimistic Update Manager
// ============================================================================

class OptimisticUpdateManager {
  constructor() {
    this.updates = new Map();
  }

  apply(key, optimisticData, rollbackData) {
    this.updates.set(key, { optimistic: optimisticData, rollback: rollbackData });
    return optimisticData;
  }

  commit(key) {
    this.updates.delete(key);
  }

  rollback(key) {
    const update = this.updates.get(key);
    if (update) {
      this.updates.delete(key);
      return update.rollback;
    }
    return null;
  }

  getOptimistic(key) {
    return this.updates.get(key)?.optimistic;
  }
}

const optimisticManager = new OptimisticUpdateManager();

// ============================================================================
// HTTP Client with Enhanced Features
// ============================================================================

class HTTPClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.abortControllers = new Map();
  }

  addRequestInterceptor(fn) {
    this.requestInterceptors.push(fn);
  }

  addResponseInterceptor(fn) {
    this.responseInterceptors.push(fn);
  }

  cancelRequest(requestId) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  async request(endpoint, options = {}, retryCount = 0) {
    // Circuit breaker check
    return circuitBreaker.execute(async () => {
      // Rate limiting
      if (!rateLimiter.canMakeRequest()) {
        const waitTime = rateLimiter.waitTime();
        console.warn(`Rate limit reached. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      rateLimiter.recordRequest();

      const url = `${this.baseURL}${endpoint}`;
      const metric = perfMonitor.startRequest(endpoint);

      // Check cache first for GET requests
      if ((options.method || 'GET') === 'GET' && options.cache !== false) {
        const cached = await idbManager.getCache(url);
        if (cached) {
          perfMonitor.endRequest(metric, 'cache-hit');
          analytics.recordRequest(endpoint, 0, 'cache-hit');
          return cached;
        }
      }

    // Check for pending identical request
    const pendingRequest = requestCache.getPending(url, options);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create abort controller for request cancellation
    const requestId = options.requestId || `${endpoint}-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    // Request timeout
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT);

    // Build request config
    let config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    };

    // Add compression header if body is large
    if (config.body && config.body.length > COMPRESSION_THRESHOLD) {
      config.headers['Content-Encoding'] = 'gzip';
      config.headers['Accept-Encoding'] = 'gzip';
    }

    // Add auth token
    const token = tokenManager.getAccessToken();
    if (token && !tokenManager.isTokenExpired(token)) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    // Make request
    const requestPromise = fetch(url, config)
      .then(async (response) => {
        clearTimeout(timeoutId);
        this.abortControllers.delete(requestId);

        // Handle 401 - token expired
        if (response.status === 401 && retryCount === 0) {
          try {
            await tokenManager.refreshAccessToken();
            // Retry with new token
            return this.request(endpoint, options, retryCount + 1);
          } catch {
            tokenManager.clearTokens();
            window.location.href = '/login';
            throw new Error('Session expired');
          }
        }

        // Handle errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
          const error = new Error(errorData.error || `HTTP ${response.status}`);
          error.status = response.status;
          error.data = errorData;
          throw error;
        }

        return response.json();
      })
      .then(async (data) => {
        // Cache GET responses
        if ((options.method || 'GET') === 'GET' && options.cache !== false) {
          const cacheTTL = options.cacheTTL || 300000; // 5 minutes default
          await idbManager.setCache(url, data, cacheTTL);
        }

        // Apply response interceptors
        let result = data;
        for (const interceptor of this.responseInterceptors) {
          result = await interceptor(result);
        }
        
        const duration = Date.now() - metric.startTime;
        perfMonitor.endRequest(metric, 'success');
        analytics.recordRequest(endpoint, duration, 'success', JSON.stringify(result).length);
        return result;
      })
      .catch(async (error) => {
        clearTimeout(timeoutId);
        this.abortControllers.delete(requestId);
        const duration = Date.now() - metric.startTime;
        perfMonitor.endRequest(metric, 'error', error.message);
        analytics.recordRequest(endpoint, duration, 'error');
        analytics.recordError(error.status || 'unknown');

        // Handle abort
        if (error.name === 'AbortError') {
          throw new Error('Request cancelled or timed out');
        }

        // Handle offline - queue request
        if (!navigator.onLine && options.queueOffline !== false) {
          console.log('Offline: Queueing request...');
          await requestQueue.enqueue(() => this.request(endpoint, options));
          throw new Error('Request queued for when online');
        }

        // Retry logic for network errors
        if (retryCount < MAX_RETRIES && this.shouldRetry(error)) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request(endpoint, options, retryCount + 1);
        }

        throw error;
      });
    });

    // Cache pending request
    requestCache.setPending(url, options, requestPromise);

    return requestPromise;
  }

  shouldRetry(error) {
    // Retry on network errors, 5xx errors, timeouts
    return !error.status || error.status >= 500 || error.message.includes('fetch');
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

const httpClient = new HTTPClient(API_BASE_URL);

// Auto-connect WebSocket on client initialization
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    wsManager.connect();
  });
}

// ============================================================================
// Request Interceptors
// ============================================================================

// Add request ID for tracing
httpClient.addRequestInterceptor(async (config) => {
  config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return config;
});

// Add timestamp
httpClient.addRequestInterceptor(async (config) => {
  config.headers['X-Request-Time'] = new Date().toISOString();
  return config;
});

// ============================================================================
// Response Interceptors
// ============================================================================

// Log responses in development
if (process.env.NODE_ENV === 'development') {
  httpClient.addResponseInterceptor(async (data) => {
    console.log('[API Response]', data);
    return data;
  });
}

// ============================================================================
// Entity Manager
// ============================================================================

class EntityManager {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.cache = new Map();
  }

  /**
   * List all records
   * @param {string} entityName 
   * @param {string} sort - Field name (prefix with '-' for descending)
   * @param {number} limit 
   */
  async list(entityName, sort = null, limit = null) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    const query = params.toString() ? `?${params}` : '';
    
    return this.httpClient.get(`/entities/${entityName}${query}`);
  }

  /**
   * Filter records
   * @param {string} entityName 
   * @param {Object} query - Filter conditions
   * @param {string} sort 
   * @param {number} limit 
   */
  async filter(entityName, query, sort = null, limit = null) {
    return this.httpClient.post(`/entities/${entityName}/filter`, {
      query,
      sort,
      limit,
    });
  }

  /**
   * Get single record by ID
   * @param {string} entityName 
   * @param {string} id 
   */
  async get(entityName, id) {
    const cacheKey = `${entityName}:${id}`;
    
    // Check cache (valid for 5 seconds)
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5000) {
      return cached.data;
    }

    const data = await this.httpClient.get(`/entities/${entityName}/${id}`);
    
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Create new record
   * @param {string} entityName 
   * @param {Object} data 
   */
  async create(entityName, data, options = {}) {
    // Optimistic update
    if (options.optimistic) {
      const optimisticId = `temp-${Date.now()}`;
      const optimisticData = { ...data, id: optimisticId };
      optimisticManager.apply(`${entityName}:create`, optimisticData, null);
    }

    try {
      const result = await this.httpClient.post(`/entities/${entityName}`, data);
      this.invalidateCache(entityName);
      if (options.optimistic) {
        optimisticManager.commit(`${entityName}:create`);
      }
      return result;
    } catch (error) {
      if (options.optimistic) {
        optimisticManager.rollback(`${entityName}:create`);
      }
      throw error;
    }
  }

  /**
   * Bulk create records
   * @param {string} entityName 
   * @param {Array} items 
   */
  async bulkCreate(entityName, items) {
    const result = await this.httpClient.post(`/entities/${entityName}/bulk`, items);
    this.invalidateCache(entityName);
    return result;
  }

  /**
   * Update record
   * @param {string} entityName 
   * @param {string} id 
   * @param {Object} data 
   */
  async update(entityName, id, data, options = {}) {
    // Optimistic update
    let originalData = null;
    if (options.optimistic) {
      originalData = await this.get(entityName, id).catch(() => null);
      optimisticManager.apply(`${entityName}:${id}`, { ...originalData, ...data }, originalData);
    }

    try {
      const result = await this.httpClient.put(`/entities/${entityName}/${id}`, data);
      this.invalidateCache(entityName, id);
      if (options.optimistic) {
        optimisticManager.commit(`${entityName}:${id}`);
      }
      return result;
    } catch (error) {
      if (options.optimistic && originalData) {
        optimisticManager.rollback(`${entityName}:${id}`);
      }
      throw error;
    }
  }

  /**
   * Delete record
   * @param {string} entityName 
   * @param {string} id 
   */
  async delete(entityName, id) {
    const result = await this.httpClient.delete(`/entities/${entityName}/${id}`);
    this.invalidateCache(entityName, id);
    return result;
  }

  /**
   * Get entity schema
   * @param {string} entityName 
   */
  async schema(entityName) {
    return this.httpClient.get(`/entities/${entityName}/schema`);
  }

  invalidateCache(entityName, id = null) {
    if (id) {
      this.cache.delete(`${entityName}:${id}`);
    } else {
      // Clear all cache for this entity
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${entityName}:`)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

const entityManager = new EntityManager(httpClient);

// ============================================================================
// Entity Proxy - Auto-generate methods for any entity
// ============================================================================

const createEntityProxy = () => {
  return new Proxy({}, {
    get: (target, entityName) => {
      if (!target[entityName]) {
        target[entityName] = {
          list: (sort, limit, options) => entityManager.list(entityName, sort, limit),
          filter: (query, sort, limit) => entityManager.filter(entityName, query, sort, limit),
          get: (id) => entityManager.get(entityName, id),
          create: (data, options) => entityManager.create(entityName, data, options),
          bulkCreate: (items) => entityManager.bulkCreate(entityName, items),
          update: (id, data, options) => entityManager.update(entityName, id, data, options),
          delete: (id) => entityManager.delete(entityName, id),
          schema: () => entityManager.schema(entityName),
          // Real-time subscription
          subscribe: (callback) => wsManager.subscribe(`entity:${entityName}`, callback),
        };
      }
      return target[entityName];
    },
  });
};

// ============================================================================
// Authentication Manager
// ============================================================================

class AuthManager {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.currentUser = null;
  }

  /**
   * Register new user
   * @param {Object} credentials - { email, password, full_name }
   */
  async register(credentials) {
    const response = await this.httpClient.post('/auth/register', credentials);
    return response;
  }

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await this.httpClient.post('/auth/login', credentials);
    
    if (response.access_token) {
      tokenManager.setTokens(response.access_token, response.refresh_token);
      this.currentUser = response.user;
    }

    return response;
  }

  /**
   * Get current user
   */
  async me() {
    if (!tokenManager.getAccessToken()) {
      throw new Error('Not authenticated');
    }

    if (this.currentUser) {
      return this.currentUser;
    }

    this.currentUser = await this.httpClient.get('/auth/me');
    return this.currentUser;
  }

  /**
   * Update current user
   * @param {Object} data 
   */
  async updateMe(data) {
    const result = await this.httpClient.put('/auth/me', data);
    this.currentUser = result;
    return result;
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated() {
    const token = tokenManager.getAccessToken();
    if (!token) return false;

    try {
      await this.httpClient.get('/auth/check');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logout user
   * @param {string} redirectUrl 
   */
  async logout(redirectUrl = null) {
    try {
      await this.httpClient.post('/auth/logout');
    } catch {
      // Continue even if request fails
    }

    tokenManager.clearTokens();
    this.currentUser = null;

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  }

  /**
   * Redirect to login page
   * @param {string} nextUrl 
   */
  redirectToLogin(nextUrl = null) {
    const returnUrl = nextUrl || window.location.href;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  /**
   * Verify email
   * @param {Object} data - { email }
   */
  async verifyEmail(data) {
    return this.httpClient.post('/auth/verify-email', data);
  }

  /**
   * Reset password
   * @param {Object} data - { email, password }
   */
  async resetPassword(data) {
    return this.httpClient.post('/auth/reset-password', data);
  }

  /**
   * Set token (for external auth flows)
   */
  setToken(token, refresh = null) {
    tokenManager.setTokens(token, refresh);
  }

  /**
   * Get current token
   */
  getToken() {
    return tokenManager.getAccessToken();
  }
}

const authManager = new AuthManager(httpClient);

// ============================================================================
// Integration Manager
// ============================================================================

class IntegrationManager {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Invoke LLM
   * @param {Object} params - { prompt, add_context_from_internet, response_json_schema, file_urls }
   */
  async invokeLLM(params) {
    return this.httpClient.post('/integrations/llm', params);
  }

  /**
   * Send email
   * @param {Object} params - { to, subject, body, from_name }
   */
  async sendEmail(params) {
    return this.httpClient.post('/integrations/send-email', params);
  }

  /**
   * Upload file (public)
   * @param {File} file 
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/integrations/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  /**
   * Upload private file
   * @param {File} file 
   */
  async uploadPrivateFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/integrations/upload-private`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  /**
   * Create signed URL for private file
   * @param {Object} params - { file_uri, expires_in }
   */
  async createFileSignedUrl(params) {
    return this.httpClient.post('/integrations/signed-url', params);
  }

  /**
   * Generate image with AI
   * @param {Object} params - { prompt }
   */
  async generateImage(params) {
    return this.httpClient.post('/integrations/generate-image', params);
  }

  /**
   * Extract data from uploaded file
   * @param {Object} params - { file_url, json_schema }
   */
  async extractDataFromFile(params) {
    return this.httpClient.post('/integrations/extract-data', params);
  }
}

const integrationManager = new IntegrationManager(httpClient);

// ============================================================================
// Core Integrations Object (matches Base44 API)
// ============================================================================

const Core = {
  InvokeLLM: (params) => integrationManager.invokeLLM(params),
  SendEmail: (params) => integrationManager.sendEmail(params),
  UploadFile: ({ file }) => integrationManager.uploadFile(file),
  UploadPrivateFile: ({ file }) => integrationManager.uploadPrivateFile(file),
  CreateFileSignedUrl: (params) => integrationManager.createFileSignedUrl(params),
  GenerateImage: (params) => integrationManager.generateImage(params),
  ExtractDataFromUploadedFile: (params) => integrationManager.extractDataFromFile(params),
};

// ============================================================================
// Batch Operations
// ============================================================================

class BatchProcessor {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Execute multiple operations in parallel
   * @param {Array} operations - Array of { entity, operation, data }
   */
  async executeBatch(operations) {
    const promises = operations.map(op => {
      switch (op.operation) {
        case 'create':
          return entityManager.create(op.entity, op.data);
        case 'update':
          return entityManager.update(op.entity, op.id, op.data);
        case 'delete':
          return entityManager.delete(op.entity, op.id);
        default:
          return Promise.reject(new Error(`Unknown operation: ${op.operation}`));
      }
    });

    return Promise.allSettled(promises);
  }

  /**
   * Bulk update multiple records
   * @param {string} entityName 
   * @param {Array} updates - Array of { id, data }
   */
  async bulkUpdate(entityName, updates) {
    const promises = updates.map(({ id, data }) => 
      entityManager.update(entityName, id, data)
    );

    return Promise.allSettled(promises);
  }

  /**
   * Bulk delete multiple records
   * @param {string} entityName 
   * @param {Array} ids 
   */
  async bulkDelete(entityName, ids) {
    const promises = ids.map(id => 
      entityManager.delete(entityName, id)
    );

    return Promise.allSettled(promises);
  }
}

const batchProcessor = new BatchProcessor(httpClient);

// ============================================================================
// Export API Client
// ============================================================================

export const api = {
  // Entity operations
  entities: createEntityProxy(),

  // Authentication
  auth: {
    register: (credentials) => authManager.register(credentials),
    login: (credentials) => authManager.login(credentials),
    me: () => authManager.me(),
    updateMe: (data) => authManager.updateMe(data),
    isAuthenticated: () => authManager.isAuthenticated(),
    logout: (redirectUrl) => authManager.logout(redirectUrl),
    redirectToLogin: (nextUrl) => authManager.redirectToLogin(nextUrl),
    verifyEmail: (data) => authManager.verifyEmail(data),
    resetPassword: (data) => authManager.resetPassword(data),
    setToken: (token, refresh) => authManager.setToken(token, refresh),
    getToken: () => authManager.getToken(),
  },

  // Integrations
  integrations: {
    Core,
  },

  // Batch operations
  batch: {
    execute: (operations) => batchProcessor.executeBatch(operations),
    bulkUpdate: (entityName, updates) => batchProcessor.bulkUpdate(entityName, updates),
    bulkDelete: (entityName, ids) => batchProcessor.bulkDelete(entityName, ids),
  },

  // Utilities
  utils: {
    getMetrics: () => perfMonitor.getMetrics(),
    getAverageDuration: () => perfMonitor.getAverageDuration(),
    clearCache: () => entityManager.cache.clear(),
    cancelRequest: (requestId) => httpClient.cancelRequest(requestId),
    cancelAllRequests: () => httpClient.cancelAllRequests(),
    throttle: (key, fn, delay) => throttleDebounce.throttle(key, fn, delay),
    debounce: (key, fn, delay) => throttleDebounce.debounce(key, fn, delay),
    setEnvironment: (env) => envConfig.set(env),
    getEnvironment: () => envConfig.current,
  },

  // WebSocket
  realtime: {
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    subscribe: (channel, callback) => wsManager.subscribe(channel, callback),
    unsubscribe: (channel, callback) => wsManager.unsubscribe(channel, callback),
    send: (channel, data) => wsManager.send(channel, data),
  },

  // Optimistic updates
  optimistic: {
    apply: (key, optimisticData, rollbackData) => optimisticManager.apply(key, optimisticData, rollbackData),
    commit: (key) => optimisticManager.commit(key),
    rollback: (key) => optimisticManager.rollback(key),
    get: (key) => optimisticManager.getOptimistic(key),
  },

  // Analytics
  analytics: {
    getMetrics: () => analytics.getMetrics(),
    exportReport: () => analytics.exportReport(),
    reset: () => analytics.reset(),
  },

  // Circuit Breaker
  circuitBreaker: {
    getState: () => circuitBreaker.getState(),
    reset: () => circuitBreaker.reset(),
  },

  // GraphQL
  graphql: {
    query: (query, variables) => graphqlClient.query(query, variables),
    mutate: (mutation, variables) => graphqlClient.mutate(mutation, variables),
    subscribe: (subscription, variables, callback) => graphqlClient.subscribe(subscription, variables, callback),
  },

  // Priority Queue
  priority: {
    enqueue: (fn, priority) => priorityQueue.enqueue(fn, priority),
  },
};

export default api;