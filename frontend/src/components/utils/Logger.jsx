/**
 * Application Logger
 * Provides structured logging for the application
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * Store logs in session storage
 */
const storeLogs = (level, category, message, data) => {
  try {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
    logs.push(log);
    
    // Keep only last 100 logs
    if (logs.length > 100) logs.shift();
    
    sessionStorage.setItem('app_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to store log:', e);
  }
};

/**
 * Logger class
 */
class Logger {
  constructor(category) {
    this.category = category;
  }

  debug(message, data = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG][${this.category}]`, message, data);
      storeLogs('DEBUG', this.category, message, data);
    }
  }

  info(message, data = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.info(`[INFO][${this.category}]`, message, data);
      storeLogs('INFO', this.category, message, data);
    }
  }

  warn(message, data = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[WARN][${this.category}]`, message, data);
      storeLogs('WARN', this.category, message, data);
    }
  }

  error(message, error, data = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR][${this.category}]`, message, error, data);
      storeLogs('ERROR', this.category, message, { 
        ...data, 
        error: error?.message,
        stack: error?.stack 
      });
    }
  }
}

/**
 * Create logger for a category
 */
export const createLogger = (category) => {
  return new Logger(category);
};

/**
 * Get all logs
 */
export const getLogs = () => {
  try {
    return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear logs
 */
export const clearLogs = () => {
  try {
    sessionStorage.removeItem('app_logs');
    console.log('Application logs cleared');
  } catch (e) {
    console.error('Failed to clear logs:', e);
  }
};

/**
 * Export logs as JSON
 */
export const exportLogs = () => {
  const logs = getLogs();
  const dataStr = JSON.stringify(logs, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `app-logs-${new Date().toISOString()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export default createLogger;