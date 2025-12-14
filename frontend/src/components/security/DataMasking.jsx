/**
 * Sensitive Data Masking Utilities
 * Hide sensitive information in UI displays
 */

/**
 * Mask bank account number (show last 4 digits)
 * 12345678 -> ****5678
 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber) return '';
  const str = accountNumber.toString().replace(/\s/g, '');
  if (str.length <= 4) return str;
  return '****' + str.slice(-4);
}

/**
 * Mask sort code (show last 2 digits)
 * 12-34-56 -> **-**-56
 */
export function maskSortCode(sortCode) {
  if (!sortCode) return '';
  const cleaned = sortCode.replace(/[\s\-]/g, '');
  if (cleaned.length !== 6) return sortCode;
  return `**-**-${cleaned.slice(-2)}`;
}

/**
 * Mask email address
 * john.doe@example.com -> j***e@example.com
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mask phone number (show last 4 digits)
 * 07123456789 -> *******6789
 */
export function maskPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length <= 4) return cleaned;
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

/**
 * Mask card number (show last 4 digits)
 * 4111111111111111 -> **** **** **** 1111
 */
export function maskCardNumber(cardNumber) {
  if (!cardNumber) return '';
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return cleaned;
  return `**** **** **** ${cleaned.slice(-4)}`;
}

/**
 * Mask name (show first letter and last name)
 * John Doe -> J*** Doe
 */
export function maskName(name) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].length > 1 ? `${parts[0][0]}***` : parts[0];
  }
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName[0]}*** ${lastName}`;
}

/**
 * Mask reference/ID (show first 3 and last 3)
 * ABC123456XYZ -> ABC***XYZ
 */
export function maskReference(ref) {
  if (!ref) return '';
  const str = ref.toString();
  if (str.length <= 6) return str;
  return `${str.slice(0, 3)}***${str.slice(-3)}`;
}

/**
 * Mask IP address
 * 192.168.1.100 -> 192.168.*.* 
 */
export function maskIpAddress(ip) {
  if (!ip) return '';
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.*.*`;
}

/**
 * Mask monetary amount (for privacy in lists)
 * 1234.56 -> £****
 */
export function maskAmount(amount, currency = '£') {
  if (amount === null || amount === undefined) return '';
  return `${currency}****`;
}

/**
 * Component to display masked data with reveal option
 */
export function MaskedValue({ 
  value, 
  maskFn, 
  revealable = false, 
  className = '' 
}) {
  const [revealed, setRevealed] = React.useState(false);
  
  if (!value) return <span className={className}>-</span>;
  
  const displayValue = revealed ? value : maskFn(value);
  
  if (!revealable) {
    return <span className={className}>{displayValue}</span>;
  }
  
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{displayValue}</span>
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="text-xs opacity-60 hover:opacity-100"
      >
        {revealed ? '🙈' : '👁️'}
      </button>
    </span>
  );
}

// Need React for MaskedValue component
import React from 'react';

export default {
  maskAccountNumber,
  maskSortCode,
  maskEmail,
  maskPhone,
  maskCardNumber,
  maskName,
  maskReference,
  maskIpAddress,
  maskAmount,
  MaskedValue
};