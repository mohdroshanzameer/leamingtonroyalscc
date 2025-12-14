# Backend Configuration System

## Overview

Zero-hardcoding configuration system for the Cricket Club backend. All settings are managed through environment variables with sensible defaults.

## Files

```
backend/
├── .env                    # Your configuration (DO NOT COMMIT)
├── .env.example           # Configuration template (commit this)
├── config.js              # Configuration loader
├── server-with-https.js   # Server with HTTPS support
└── ssl/                   # SSL certificates (for HTTPS)
    ├── server.key
    └── server.crt
```

## Quick Setup

### 1. Copy Configuration Template
```bash
cd backend
cp .env.example .env
```

### 2. Edit Configuration
```bash
nano .env  # or use your preferred editor
```

Update these critical values:
- `DB_PASSWORD` - Your database password
- `JWT_SECRET` - Strong random secret
- `ENABLE_HTTPS` - true/false based on your needs

### 3. Install Dependencies
```bash
npm install express cors dotenv pg bcryptjs jsonwebtoken multer
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## Configuration Categories

### Project Settings
- Project name, location, environment

### Server Settings
- HTTP/HTTPS ports
- SSL certificate paths
- Redirect configuration

### Database Settings
- Connection details (host, port, credentials)
- Connection pooling
- Timeouts
- SQL file paths

### Authentication
- JWT tokens and expiration
- BCrypt rounds
- Session configuration

### File Uploads
- Upload directory
- Max file size
- Allowed file types

### Email
- SMTP configuration
- Sender address
- Mock mode for development

### Security
- CORS settings
- Rate limiting
- Logging configuration

## Environment-Specific Configs

### Development
```env
NODE_ENV=development
ENABLE_HTTPS=false
HTTP_PORT=5000
DEBUG=true
MOCK_EMAIL=true
```

### Production
```env
NODE_ENV=production
ENABLE_HTTPS=true
HTTPS_PORT=443
DEBUG=false
MOCK_EMAIL=false
```

## Usage in Code

### Import Config
```javascript
const config = require('./config');
```

### Access Settings
```javascript
// Project info
console.log(config.project.name);
console.log(config.isProduction());

// Server
console.log(config.server.getUrl());

// Database
const pool = new Pool(config.database);
const connectionString = config.database.getConnectionString();

// Auth
jwt.sign(payload, config.auth.jwt.secret, { 
  expiresIn: config.auth.jwt.expiresIn 
});

// File upload
if (fileSize > config.upload.maxSizeBytes) {
  // reject
}
```

## HTTPS Setup

See [setup-https.md](./setup-https.md) for detailed instructions.

**Quick Enable:**
```env
ENABLE_HTTPS=true
HTTPS_KEY_PATH="./ssl/server.key"
HTTPS_CERT_PATH="./ssl/server.crt"
```

## Validation

The config module automatically validates required settings on startup:

- Database password
- JWT secret
- HTTPS certificates (if HTTPS enabled)

Missing values will cause the server to exit with clear error messages.

## Security Notes

### DO NOT COMMIT:
- `.env` file
- SSL certificates (`*.key`, `*.crt`)
- Any files with passwords/secrets

### DO COMMIT:
- `.env.example` (template)
- `config.js` (loader)
- Documentation

### Add to .gitignore:
```
.env
.env.local
ssl/
*.key
*.crt
logs/
uploads/
```

## Helper Functions

### Database Connection String
```javascript
config.database.getConnectionString()
// Returns: postgresql://user:pass@host:port/dbname
```

### Server URL
```javascript
config.server.getUrl()
// Returns: http://localhost:5000 or https://localhost:443
```

### Environment Checks
```javascript
if (config.isProduction()) {
  // production-only code
}

if (config.isDevelopment()) {
  // development-only code
}
```

## Migration from Hardcoded Values

### Before (hardcoded):
```javascript
const PORT = 5000;
const DB_HOST = 'localhost';
const JWT_SECRET = 'my-secret';
```

### After (config-based):
```javascript
const config = require('./config');

const PORT = config.server.http.port;
const DB_HOST = config.database.host;
const JWT_SECRET = config.auth.jwt.secret;
```

## Troubleshooting

### "Configuration Error - Missing required environment variables"
- Check your `.env` file exists
- Ensure required variables are set (DB_PASSWORD, JWT_SECRET)
- Copy from `.env.example` if needed

### "Failed to load SSL certificates"
- Verify `HTTPS_KEY_PATH` and `HTTPS_CERT_PATH` are correct
- Check files exist and are readable
- See [setup-https.md](./setup-https.md)

### "Port already in use"
- Change port in `.env`: `HTTP_PORT=5001`
- Or kill the process using that port

## Best Practices

1. **Never hardcode** - Use config for all values
2. **Use .env.example** - Template for new developers
3. **Validate config** - Check required values on startup
4. **Document changes** - Update .env.example when adding settings
5. **Secure secrets** - Use strong passwords, rotate regularly
6. **Environment-specific** - Different configs for dev/prod

## Example: Adding New Config

### 1. Add to .env.example
```env
# New Feature
NEW_FEATURE_ENABLED=true
NEW_FEATURE_API_KEY=""
```

### 2. Add to config.js
```javascript
newFeature: {
  enabled: process.env.NEW_FEATURE_ENABLED === 'true',
  apiKey: process.env.NEW_FEATURE_API_KEY,
},
```

### 3. Use in code
```javascript
if (config.newFeature.enabled) {
  api.authenticate(config.newFeature.apiKey);
}
```

## Resources

- [HTTPS Setup Guide](./setup-https.md)
- [Environment Variables Best Practices](https://12factor.net/config)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

**Zero hardcoding. Full control. Production ready.**