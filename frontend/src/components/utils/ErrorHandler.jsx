/**
 * Centralized Error Handler
 * Provides consistent error handling and logging across the application
 */

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
export const ErrorCategory = {
  NETWORK: 'network',
  AUTH: 'authentication',
  VALIDATION: 'validation',
  DATABASE: 'database',
  PERMISSION: 'permission',
  BUSINESS_LOGIC: 'business_logic',
  UNKNOWN: 'unknown'
};

/**
 * Log error with full context
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    }
  };

  // Console log for debugging
  console.error('=== ERROR LOG ===');
  console.error('Time:', errorLog.timestamp);
  console.error('Message:', errorLog.message);
  console.error('Context:', errorLog.context);
  if (errorLog.stack) {
    console.error('Stack:', errorLog.stack);
  }
  console.error('================');

  // Store in session storage for viewing
  try {
    const logs = JSON.parse(sessionStorage.getItem('error_logs') || '[]');
    logs.push(errorLog);
    // Keep only last 50 errors
    if (logs.length > 50) logs.shift();
    sessionStorage.setItem('error_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to store error log:', e);
  }

  return errorLog;
};

/**
 * Categorize error type
 */
export const categorizeError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connect')) {
    return ErrorCategory.NETWORK;
  }
  if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
    return ErrorCategory.AUTH;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }
  if (message.includes('permission') || message.includes('forbidden')) {
    return ErrorCategory.PERMISSION;
  }
  if (message.includes('database') || message.includes('query')) {
    return ErrorCategory.DATABASE;
  }
  
  return ErrorCategory.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
export const getUserMessage = (error, category) => {
  const messages = {
    [ErrorCategory.NETWORK]: 'Unable to connect to server. Please check your internet connection.',
    [ErrorCategory.AUTH]: 'Authentication failed. Please sign in again.',
    [ErrorCategory.VALIDATION]: 'Invalid data provided. Please check your inputs.',
    [ErrorCategory.PERMISSION]: 'You do not have permission to perform this action.',
    [ErrorCategory.DATABASE]: 'Database error occurred. Please try again.',
    [ErrorCategory.BUSINESS_LOGIC]: error?.message || 'An error occurred.',
    [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.'
  };

  return messages[category] || messages[ErrorCategory.UNKNOWN];
};

/**
 * Handle error with logging and user feedback
 */
export const handleError = (error, context = {}) => {
  const category = categorizeError(error);
  const userMessage = getUserMessage(error, category);
  
  logError(error, {
    ...context,
    category,
    severity: context.severity || ErrorSeverity.MEDIUM
  });

  return {
    category,
    userMessage,
    technicalMessage: error?.message || 'Unknown error',
    shouldRetry: category === ErrorCategory.NETWORK
  };
};

/**
 * Get all error logs (for debugging)
 */
export const getErrorLogs = () => {
  try {
    return JSON.parse(sessionStorage.getItem('error_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear error logs
 */
export const clearErrorLogs = () => {
  try {
    sessionStorage.removeItem('error_logs');
    console.log('Error logs cleared');
  } catch (e) {
    console.error('Failed to clear error logs:', e);
  }
};

/**
 * Export error logs as JSON (for sending to support)
 */
export const exportErrorLogs = () => {
  const logs = getErrorLogs();
  const dataStr = JSON.stringify(logs, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `error-logs-${new Date().toISOString()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};