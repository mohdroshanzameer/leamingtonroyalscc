/**
 * ============================================================================
 * BACKEND SERVER WITH HTTPS SUPPORT
 * ============================================================================
 * Supports both HTTP and HTTPS based on configuration
 * Zero hardcoding - all values from config.js
 */

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const config = require('./config');

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================
const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// BASIC ROUTES (example)
// ============================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    project: config.project.name,
    environment: config.project.env,
    https: config.server.https.enabled,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    project: config.project.name,
    environment: config.project.env,
    httpsEnabled: config.server.https.enabled,
  });
});

// ============================================================================
// HTTPS IMPLEMENTATION
// ============================================================================

/**
 * Load SSL certificates if HTTPS is enabled
 */
function loadSSLCredentials() {
  try {
    const credentials = {
      key: fs.readFileSync(config.server.https.keyPath, 'utf8'),
      cert: fs.readFileSync(config.server.https.certPath, 'utf8'),
    };

    // Load CA certificate if provided
    if (config.server.https.caPath) {
      credentials.ca = fs.readFileSync(config.server.https.caPath, 'utf8');
    }

    console.log('✅ SSL certificates loaded successfully');
    return credentials;
  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error.message);
    console.error('   Key path:', config.server.https.keyPath);
    console.error('   Cert path:', config.server.https.certPath);
    process.exit(1);
  }
}

/**
 * Create HTTP redirect server (redirects all HTTP to HTTPS)
 */
function createHttpRedirectServer() {
  const redirectApp = express();
  
  redirectApp.use('*', (req, res) => {
    const httpsUrl = `https://${req.hostname}:${config.server.https.port}${req.originalUrl}`;
    console.log(`🔀 Redirecting HTTP → HTTPS: ${req.originalUrl}`);
    res.redirect(301, httpsUrl);
  });

  return http.createServer(redirectApp);
}

/**
 * Start servers based on configuration
 */
function startServers() {
  console.log('\n' + '='.repeat(70));
  console.log(`🚀 Starting ${config.project.name} Backend Server`);
  console.log('='.repeat(70));
  console.log(`Environment: ${config.project.env}`);
  console.log(`HTTPS Enabled: ${config.server.https.enabled}`);
  console.log('='.repeat(70) + '\n');

  // ============================================================================
  // HTTPS MODE
  // ============================================================================
  if (config.server.https.enabled) {
    console.log('🔒 HTTPS mode enabled');
    
    // Load SSL certificates
    const credentials = loadSSLCredentials();
    
    // Create HTTPS server
    const httpsServer = https.createServer(credentials, app);
    
    httpsServer.listen(config.server.https.port, () => {
      console.log(`✅ HTTPS server running on port ${config.server.https.port}`);
      console.log(`   URL: https://localhost:${config.server.https.port}`);
    });

    // Create HTTP redirect server if enabled
    if (config.server.https.redirectHttp && config.server.http.enabled) {
      const httpRedirectServer = createHttpRedirectServer();
      
      httpRedirectServer.listen(config.server.http.port, () => {
        console.log(`🔀 HTTP redirect server running on port ${config.server.http.port}`);
        console.log(`   (Redirects to HTTPS)`);
      });
    }

    // Handle HTTPS errors
    httpsServer.on('error', (error) => {
      if (error.code === 'EACCES') {
        console.error(`❌ Port ${config.server.https.port} requires elevated privileges`);
        console.error('   Try running with sudo or use a port >= 1024');
      } else if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.server.https.port} is already in use`);
      } else {
        console.error('❌ HTTPS Server error:', error.message);
      }
      process.exit(1);
    });

  // ============================================================================
  // HTTP MODE
  // ============================================================================
  } else {
    console.log('🌐 HTTP mode (HTTPS disabled)');
    
    const httpServer = http.createServer(app);
    
    httpServer.listen(config.server.http.port, () => {
      console.log(`✅ HTTP server running on port ${config.server.http.port}`);
      console.log(`   URL: http://localhost:${config.server.http.port}`);
      console.log('\n⚠️  WARNING: HTTPS is disabled. Enable in production!');
    });

    // Handle HTTP errors
    httpServer.on('error', (error) => {
      if (error.code === 'EACCES') {
        console.error(`❌ Port ${config.server.http.port} requires elevated privileges`);
      } else if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.server.http.port} is already in use`);
      } else {
        console.error('❌ HTTP Server error:', error.message);
      }
      process.exit(1);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('Database:', config.database.getConnectionString().replace(/:[^:@]+@/, ':****@'));
  console.log('Frontend:', config.frontend.url);
  console.log('='.repeat(70) + '\n');
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// ============================================================================
// START SERVER
// ============================================================================
startServers();

module.exports = app;