/**
 * Input Validation Utilities
 * Sanitize and validate user inputs to prevent injection attacks
 */

// Sanitize string input - remove potential XSS
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Validate email format
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate phone number (UK format)
export function isValidPhone(phone) {
  if (!phone) return true; // Optional field
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+44|0)[1-9]\d{9,10}$/.test(cleaned);
}

// Validate amount (positive number, max 2 decimals)
export function isValidAmount(amount) {
  if (amount === '' || amount === null || amount === undefined) return false;
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0 || num > 10000000) return false;
  // Check max 2 decimal places
  const decimalPart = amount.toString().split('.')[1];
  if (decimalPart && decimalPart.length > 2) return false;
  return true;
}

// Validate date string
export function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

// Validate date is not in future (for payment dates, etc.)
export function isNotFutureDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}

// Validate reference/ID format (alphanumeric with dashes/underscores)
export function isValidReference(ref) {
  if (!ref) return true; // Optional
  return /^[a-zA-Z0-9\-_\s]{1,100}$/.test(ref);
}

// Validate sort code (UK format: XX-XX-XX)
export function isValidSortCode(sortCode) {
  if (!sortCode) return false;
  const cleaned = sortCode.replace(/[\s\-]/g, '');
  return /^\d{6}$/.test(cleaned);
}

// Validate account number (UK: 8 digits)
export function isValidAccountNumber(accNum) {
  if (!accNum) return false;
  const cleaned = accNum.replace(/[\s\-]/g, '');
  return /^\d{8}$/.test(cleaned);
}

// Validate URL
export function isValidUrl(url) {
  if (!url) return true; // Optional
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate name (letters, spaces, hyphens, apostrophes)
export function isValidName(name) {
  if (!name) return false;
  return /^[a-zA-Z\s\-'\.]{2,100}$/.test(name);
}

// Check for SQL injection patterns
export function hasSqlInjection(input) {
  if (!input || typeof input !== 'string') return false;
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i
  ];
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Check for script injection
export function hasScriptInjection(input) {
  if (!input || typeof input !== 'string') return false;
  const scriptPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i
  ];
  return scriptPatterns.some(pattern => pattern.test(input));
}

// Comprehensive validation for form data
export function validateFormData(data, rules) {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    if (fieldRules.required && !value) {
      errors[field] = `${fieldRules.label || field} is required`;
      continue;
    }
    
    if (value) {
      // Check for injection attacks
      if (typeof value === 'string') {
        if (hasSqlInjection(value)) {
          errors[field] = 'Invalid characters detected';
          continue;
        }
        if (hasScriptInjection(value)) {
          errors[field] = 'Invalid content detected';
          continue;
        }
      }
      
      // Type-specific validation
      if (fieldRules.type === 'email' && !isValidEmail(value)) {
        errors[field] = 'Invalid email format';
      } else if (fieldRules.type === 'phone' && !isValidPhone(value)) {
        errors[field] = 'Invalid phone number';
      } else if (fieldRules.type === 'amount' && !isValidAmount(value)) {
        errors[field] = 'Invalid amount';
      } else if (fieldRules.type === 'date' && !isValidDate(value)) {
        errors[field] = 'Invalid date';
      } else if (fieldRules.type === 'name' && !isValidName(value)) {
        errors[field] = 'Invalid name format';
      } else if (fieldRules.type === 'url' && !isValidUrl(value)) {
        errors[field] = 'Invalid URL';
      } else if (fieldRules.type === 'sortCode' && !isValidSortCode(value)) {
        errors[field] = 'Invalid sort code (XX-XX-XX)';
      } else if (fieldRules.type === 'accountNumber' && !isValidAccountNumber(value)) {
        errors[field] = 'Invalid account number (8 digits)';
      }
      
      // Min/max length
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors[field] = `Minimum ${fieldRules.minLength} characters`;
      }
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors[field] = `Maximum ${fieldRules.maxLength} characters`;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  sanitizeString,
  isValidEmail,
  isValidPhone,
  isValidAmount,
  isValidDate,
  isNotFutureDate,
  isValidReference,
  isValidSortCode,
  isValidAccountNumber,
  isValidUrl,
  isValidName,
  hasSqlInjection,
  hasScriptInjection,
  validateFormData
};