import { format } from 'date-fns';

/**
 * Generate payment reference
 * Format: FL+last4phone+type+ddmmyyyy
 * Example: JD1234REG26112024
 */
export function generatePaymentReference(firstName, lastName, phone, paymentType) {
  const initials = (firstName?.[0] || 'X') + (lastName?.[0] || 'X');
  const phoneLast4 = (phone || '0000').slice(-4).replace(/\D/g, '').padStart(4, '0');
  
  const typeMap = {
    registration: 'REG',
    match_fee: 'MF',
    membership: 'MEM',
    event: 'EVT',
    other: 'OTH'
  };
  const typeCode = typeMap[paymentType] || 'OTH';
  
  const dateCode = format(new Date(), 'ddMMyyyy');
  
  return `${initials.toUpperCase()}${phoneLast4}${typeCode}${dateCode}`;
}

/**
 * Parse name into first and last name
 */
export function parseFullName(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

/**
 * Extract payment references from text (bank statement)
 */
export function extractReferencesFromText(text) {
  // Match pattern: 2 letters + 4 digits + 2-3 letters + 8 digits
  const pattern = /[A-Z]{2}\d{4}(?:REG|MF|MEM|EVT|OTH)\d{8}/gi;
  const matches = text.match(pattern) || [];
  return [...new Set(matches.map(m => m.toUpperCase()))];
}