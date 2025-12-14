# Database Password Encryption Guide

## Overview

The setup scripts currently use **plain text passwords** in `.env` files. This guide shows how to implement **AES-256 encryption** for database passwords and other sensitive values.

## Current Issues in Batch Scripts

### Hardcoded Values Found:

1. **setup-database.bat** (Lines 8-12):
   - DB_NAME, DB_USER, **DB_PASSWORD** (hardcoded!)
   - DB_HOST, DB_PORT

2. **setup-backend.bat** (Lines 8-10, 94-102):
   - PROJECT_DIR, BACKEND_DIR, BACKEND_PORT
   - Creates .env with **hardcoded DB_PASSWORD**
   - Hardcoded JWT_SECRET

3. **setup-frontend.bat** (Lines 8-11, 66):
   - PROJECT_DIR, FRONTEND_DIR, ports
   - Hardcoded API URL

4. **create-admin-user.bat** (Lines 8-9):
   - DB_NAME, DB_USER

### External Service URLs (Currently Not in Scripts):
- Jenkins URL/credentials - **NOT PRESENT**
- Git repository URL - **NOT PRESENT**
- Monitoring URLs - **NOT PRESENT**

## Solution: Centralized Config + Encryption

### 1. Created Files:

✅ **setup.config** - Central configuration for all batch scripts  
✅ **db-password-encryption.js** - Encryption/decryption utility  
✅ **config-with-encryption.js** - Enhanced config.js with auto-decryption  

## Setup Instructions

### Step 1: Generate Encryption Key

```bash
cd backend
node db-password-encryption.js generate-key
```

This creates `.encryption-key` file and displays the key.

**Output:**
```
✅ Encryption key saved to: .encryption-key
⚠️  IMPORTANT: Add .encryption-key to .gitignore!
⚠️  IMPORTANT: Back up this key securely!

Add to your .env file:
DB_ENCRYPTION_KEY=a1b2c3d4e5f6...
```

### Step 2: Encrypt Your Password

```bash
node db-password-encryption.js encrypt "YourActualPassword123"
```

**Output:**
```
✅ Password encrypted:
4f3a8b2c1d5e:9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c

Add to your .env file:
DB_PASSWORD=4f3a8b2c1d5e:9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
```

### Step 3: Update .env File

```env
# Database password (encrypted)
DB_PASSWORD=4f3a8b2c1d5e:9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
DB_PASSWORD_ENCRYPTED=true

# Encryption key (store in secure vault in production!)
DB_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Step 4: Use Enhanced Config

Replace `config.js` with `config-with-encryption.js`:

```bash
cd backend
mv config.js config-old.js
mv config-with-encryption.js config.js
```

The config now automatically decrypts passwords:

```javascript
const config = require('./config');

// Password is automatically decrypted
const pool = new Pool({
  user: config.database.user,
  password: config.database.password,  // Auto-decrypted!
  database: config.database.database,
  host: config.database.host,
  port: config.database.port,
});
```

## How It Works

### Encryption Format

Encrypted passwords use this format:
```
[IV]:[ENCRYPTED_DATA]
```

Example:
```
4f3a8b2c1d5e6f7a:9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
     ↑                        ↑
  16-byte IV           Encrypted password
```

### Automatic Detection

The config automatically detects if a password is encrypted:

```javascript
// Plain text (development)
DB_PASSWORD=MyPassword123

// Encrypted (production)
DB_PASSWORD=4f3a8b2c1d5e:9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c
```

### Security Flow

```
.env file
    ↓
config.js reads DB_PASSWORD
    ↓
Is it encrypted? (contains ':')
    ↓ YES              ↓ NO
Decrypt it         Use plain text
    ↓                  ↓
Return decrypted   Return plain
```

## Production Setup

### Option 1: Environment Variable (Recommended)

```bash
# Don't store key in .env file in production
# Use environment variable instead
export DB_ENCRYPTION_KEY=a1b2c3d4e5f6...

# Or in systemd service:
Environment="DB_ENCRYPTION_KEY=a1b2c3d4e5f6..."
```

### Option 2: AWS Secrets Manager

```javascript
// In config.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getEncryptionKey() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'cricket-club/db-encryption-key'
  }).promise();
  
  return secret.SecretString;
}
```

### Option 3: HashiCorp Vault

```javascript
const vault = require('node-vault')();

async function getEncryptionKey() {
  const result = await vault.read('secret/cricket-club/encryption-key');
  return result.data.key;
}
```

## Updating Batch Scripts to Use setup.config

### Current Problem:
Each batch script has hardcoded values scattered throughout.

### Solution:
All batch scripts should start with:

```batch
@echo off
REM Load centralized configuration
call "%~dp0setup.config"

REM Now use variables instead of hardcoded values
echo Creating database: %DB_NAME%
echo Using user: %DB_USER%
```

### Benefits:
✅ Single source of truth  
✅ Easy to update settings  
✅ No more hardcoded values  
✅ Consistent across all scripts  

## Security Checklist

### Development:
- [ ] Generate encryption key
- [ ] Encrypt database password
- [ ] Add to .env file
- [ ] Test decryption works
- [ ] Add `.encryption-key` to `.gitignore`

### Production:
- [ ] Store encryption key in secure vault (AWS/Vault/etc.)
- [ ] Use environment variables, not .env file
- [ ] Enable `DB_PASSWORD_ENCRYPTED=true`
- [ ] Rotate keys periodically
- [ ] Back up encryption key securely
- [ ] Never commit keys to version control

## Troubleshooting

### "Encryption key not found"
**Solution:** Run `node db-password-encryption.js generate-key`

### "Password decryption failed"
**Causes:**
- Wrong encryption key
- Corrupted encrypted password
- Key file missing

**Solution:** Re-encrypt password with correct key

### "Invalid encrypted password format"
**Cause:** Password doesn't contain `:` separator

**Solution:** Check password format or set `DB_PASSWORD_ENCRYPTED=false`

## Testing

### Test Encryption:
```bash
node db-password-encryption.js encrypt "TestPassword"
```

### Test Decryption:
```bash
node db-password-encryption.js decrypt "4f3a8b2c1d5e:9f8a7b6c..."
```

### Test in Code:
```javascript
const config = require('./config');
console.log('Password:', config.database.password);
// Should print decrypted password
```

## Summary of Changes

### ✅ Created:
1. **setup.config** - Central config for batch scripts
2. **db-password-encryption.js** - Encryption utility
3. **config-with-encryption.js** - Auto-decrypting config

### 🔒 Security Improvements:
- AES-256 encryption for passwords
- Automatic encryption detection
- Secure key management
- Production-ready setup

### 📝 TODO:
- [ ] Update all batch scripts to use setup.config
- [ ] Add Jenkins/Git URLs to setup.config
- [ ] Implement key rotation
- [ ] Add encryption for JWT_SECRET
- [ ] Add encryption for SMTP credentials

---

**Database passwords are now encrypted with AES-256 and automatically decrypted by config.js.**