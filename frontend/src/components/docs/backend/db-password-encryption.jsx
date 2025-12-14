/**
 * ============================================================================
 * DATABASE PASSWORD ENCRYPTION UTILITY
 * ============================================================================
 * Encrypts/decrypts sensitive configuration values
 * Use this to secure database passwords in .env files
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // AES-256 requires 32 bytes
const IV_LENGTH = 16;  // AES requires 16 bytes IV

// ============================================================================
// ENCRYPTION KEY MANAGEMENT
// ============================================================================

/**
 * Generate a secure encryption key
 * Store this key securely - if lost, encrypted passwords cannot be recovered
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Get encryption key from environment or file
 */
function getEncryptionKey() {
  // 1. Try environment variable (most secure)
  if (process.env.DB_ENCRYPTION_KEY) {
    return Buffer.from(process.env.DB_ENCRYPTION_KEY, 'hex');
  }

  // 2. Try .encryption-key file (backup)
  const keyFile = path.join(__dirname, '.encryption-key');
  if (fs.existsSync(keyFile)) {
    const keyHex = fs.readFileSync(keyFile, 'utf8').trim();
    return Buffer.from(keyHex, 'hex');
  }

  throw new Error(
    'Encryption key not found. Generate one with: node db-password-encryption.js generate-key'
  );
}

/**
 * Save encryption key to file
 */
function saveEncryptionKey(keyHex) {
  const keyFile = path.join(__dirname, '.encryption-key');
  fs.writeFileSync(keyFile, keyHex, 'utf8');
  console.log(`✅ Encryption key saved to: ${keyFile}`);
  console.log('⚠️  IMPORTANT: Add .encryption-key to .gitignore!');
  console.log('⚠️  IMPORTANT: Back up this key securely!');
}

// ============================================================================
// ENCRYPTION/DECRYPTION
// ============================================================================

/**
 * Encrypt a password
 */
function encrypt(password) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data (both hex encoded)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a password
 */
function decrypt(encryptedPassword) {
  const key = getEncryptionKey();
  
  // Split IV and encrypted data
  const parts = encryptedPassword.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted password format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ============================================================================
// USAGE IN CONFIG
// ============================================================================

/**
 * Get decrypted password from config
 * Automatically handles both encrypted and plain passwords
 */
function getPassword(configValue) {
  if (!configValue) {
    throw new Error('Password not configured');
  }

  // Check if encrypted (contains : separator)
  if (configValue.includes(':') && configValue.split(':').length === 2) {
    try {
      return decrypt(configValue);
    } catch (error) {
      console.error('Failed to decrypt password:', error.message);
      throw new Error('Password decryption failed - check encryption key');
    }
  }

  // Plain text password (for development)
  if (process.env.NODE_ENV === 'development') {
    return configValue;
  }

  console.warn('⚠️  WARNING: Using unencrypted password in production!');
  return configValue;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function showHelp() {
  console.log(`
Database Password Encryption Utility
=====================================

Usage:
  node db-password-encryption.js <command> [options]

Commands:
  generate-key              Generate new encryption key
  encrypt <password>        Encrypt a password
  decrypt <encrypted>       Decrypt a password
  help                      Show this help message

Examples:
  node db-password-encryption.js generate-key
  node db-password-encryption.js encrypt "MyPassword123"
  node db-password-encryption.js decrypt "a1b2c3d4:e5f6g7h8..."

Environment Variables:
  DB_ENCRYPTION_KEY         Hex-encoded encryption key (32 bytes)

Security Notes:
  - Always use DB_ENCRYPTION_KEY environment variable in production
  - Never commit .encryption-key file to version control
  - Store encryption key in secure vault (e.g., AWS Secrets Manager)
  - Back up encryption key securely - if lost, data cannot be recovered
  `);
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'generate-key': {
        const key = generateEncryptionKey();
        saveEncryptionKey(key);
        console.log('\n✅ Encryption key generated successfully!');
        console.log('\nAdd to your .env file:');
        console.log(`DB_ENCRYPTION_KEY=${key}`);
        console.log('\n⚠️  Keep this key secure and backed up!');
        break;
      }

      case 'encrypt': {
        const password = args[1];
        if (!password) {
          console.error('❌ Error: Password required');
          console.log('Usage: node db-password-encryption.js encrypt <password>');
          process.exit(1);
        }
        const encrypted = encrypt(password);
        console.log('\n✅ Password encrypted:');
        console.log(encrypted);
        console.log('\nAdd to your .env file:');
        console.log(`DB_PASSWORD=${encrypted}`);
        break;
      }

      case 'decrypt': {
        const encrypted = args[1];
        if (!encrypted) {
          console.error('❌ Error: Encrypted password required');
          console.log('Usage: node db-password-encryption.js decrypt <encrypted>');
          process.exit(1);
        }
        const decrypted = decrypt(encrypted);
        console.log('\n✅ Password decrypted:');
        console.log(decrypted);
        break;
      }

      case 'help':
      default:
        showHelp();
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateEncryptionKey,
  encrypt,
  decrypt,
  getPassword,
};