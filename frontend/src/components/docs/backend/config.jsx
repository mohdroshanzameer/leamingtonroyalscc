/**
 * ============================================================================
 * BACKEND CONFIGURATION MODULE
 * ============================================================================
 * Centralized configuration loaded from environment variables
 * Zero hardcoding - all values come from .env file
 */

require('dotenv').config();

const config = {
  // ============================================================================
  // PROJECT INFORMATION
  // ============================================================================
  project: {
    name: process.env.PROJECT_NAME || 'Cricket Club',
    shortName: process.env.PROJECT_SHORT_NAME || 'CC',
    location: process.env.PROJECT_LOCATION || 'backend',
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================
  server: {
    http: {
      enabled: process.env.HTTP_ENABLED === 'true',
      port: parseInt(process.env.HTTP_PORT) || 5000,
    },
    https: {
      enabled: process.env.ENABLE_HTTPS === 'true',
      port: parseInt(process.env.HTTPS_PORT) || 443,
      keyPath: process.env.HTTPS_KEY_PATH || './ssl/server.key',
      certPath: process.env.HTTPS_CERT_PATH || './ssl/server.crt',
      caPath: process.env.HTTPS_CA_PATH || null,
      redirectHttp: process.env.HTTPS_REDIRECT_HTTP === 'true',
    },
  },

  // ============================================================================
  // DATABASE CONFIGURATION
  // ============================================================================
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'cricket_club_db',
    user: process.env.DB_USER || 'cricket_user',
    password: process.env.DB_PASSWORD,
    
    // Connection Pool
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS) || 10000,
    },
    
    // Timeouts
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS) || 30000,
    
    // SQL Files
    schemaPath: process.env.SQL_SCHEMA_PATH || './db/schema.sql',
    seedPath: process.env.SQL_SEED_PATH || './db/seed.sql',
  },

  // ============================================================================
  // AUTHENTICATION & SECURITY
  // ============================================================================
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    },
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    },
  },

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // ============================================================================
  // FILE UPLOAD CONFIGURATION
  // ============================================================================
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxSizeMB: parseInt(process.env.UPLOAD_MAX_SIZE_MB) || 10,
    maxSizeBytes: (parseInt(process.env.UPLOAD_MAX_SIZE_MB) || 10) * 1024 * 1024,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(',').filter(Boolean),
  },

  // ============================================================================
  // EMAIL CONFIGURATION
  // ============================================================================
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@cricketclub.com',
    mock: process.env.MOCK_EMAIL === 'true',
  },

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // ============================================================================
  // LOGGING
  // ============================================================================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    errorFilePath: process.env.LOG_ERROR_FILE_PATH || './logs/error.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
  },

  // ============================================================================
  // EXTERNAL INTEGRATIONS
  // ============================================================================
  integrations: {
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },

  // ============================================================================
  // FRONTEND URL
  // ============================================================================
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // ============================================================================
  // DEVELOPMENT SETTINGS
  // ============================================================================
  dev: {
    debug: process.env.DEBUG === 'true',
    mockEmail: process.env.MOCK_EMAIL === 'true',
    mockPayments: process.env.MOCK_PAYMENTS === 'true',
  },
};

// ============================================================================
// VALIDATION - Ensure required values are present
// ============================================================================
function validateConfig() {
  const required = [
    { key: 'DB_PASSWORD', value: config.database.password, message: 'Database password is required' },
    { key: 'JWT_SECRET', value: config.auth.jwt.secret, message: 'JWT secret is required' },
  ];

  // Only validate HTTPS paths if HTTPS is enabled
  if (config.server.https.enabled) {
    required.push(
      { key: 'HTTPS_KEY_PATH', value: config.server.https.keyPath, message: 'HTTPS key path required when HTTPS enabled' },
      { key: 'HTTPS_CERT_PATH', value: config.server.https.certPath, message: 'HTTPS cert path required when HTTPS enabled' }
    );
  }

  const missing = required.filter(item => !item.value);

  if (missing.length > 0) {
    console.error('❌ Configuration Error - Missing required environment variables:');
    missing.forEach(item => console.error(`   - ${item.key}: ${item.message}`));
    process.exit(1);
  }
}

// Run validation
validateConfig();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get database connection string
 */
config.database.getConnectionString = function() {
  const { host, port, database, user, password } = config.database;
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

/**
 * Get server URL
 */
config.server.getUrl = function() {
  if (config.server.https.enabled) {
    return `https://localhost:${config.server.https.port}`;
  }
  return `http://localhost:${config.server.http.port}`;
};

/**
 * Check if production environment
 */
config.isProduction = function() {
  return config.project.env === 'production';
};

/**
 * Check if development environment
 */
config.isDevelopment = function() {
  return config.project.env === 'development';
};

// ============================================================================
// EXPORT
// ============================================================================
module.exports = config;