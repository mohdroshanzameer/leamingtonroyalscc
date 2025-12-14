/**
 * Utility Functions
 * 
 * Helper functions used throughout the application
 */

/**
 * Creates a URL for a page based on its name
 * Converts page names to kebab-case URLs
 * 
 * @param {string} pageName - The name of the page (e.g., 'Home', 'MyProfile', 'Tournaments')
 * @returns {string} - The URL path (e.g., '/', '/my-profile', '/tournaments')
 */
export function createPageUrl(pageName, params = {}) {
  // Allow callers to pass `"PageName?x=1"` as a shorthand.
  const [basePageName, inlineQueryString] = String(pageName).split('?');

  // Special-case routes that are not pure kebab-case
  const special = {
    Home: '/',
    SignIn: '/signin',
  };

  const kebabCase = basePageName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

  const baseUrl = special[basePageName] ?? `/${kebabCase}`;

  const mergedParams = new URLSearchParams(inlineQueryString || '');
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) mergedParams.set(k, String(v));
  });

  const qs = mergedParams.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: '£')
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = '£') {
  return `${currency}${amount?.toLocaleString() || 0}`;
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format date and time to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date-time string
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}