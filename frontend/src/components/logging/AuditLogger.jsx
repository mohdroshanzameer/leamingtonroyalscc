/**
 * Centralized Audit Logger Utility
 * Provides functions to log authentication, user activity, and system events
 */

import { api } from '@/components/api/apiClient';
import { format } from 'date-fns';

// Session ID management
function getSessionId() {
  let sessionId = sessionStorage.getItem('audit_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('audit_session_id', sessionId);
  }
  return sessionId;
}

// Parse user agent for device info
function parseUserAgent() {
  const ua = navigator.userAgent;
  let deviceType = 'unknown';
  let browser = 'unknown';
  let os = 'unknown';

  // Device type
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
  } else {
    deviceType = 'desktop';
  }

  // Browser
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  // OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { deviceType, browser, os, userAgent: ua };
}

// Get common context for all logs
function getCommonContext() {
  const { deviceType, browser, os, userAgent } = parseUserAgent();
  return {
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    ip_address: 'client-side',
    user_agent: userAgent,
    device_type: deviceType,
    browser,
    os,
    page_url: window.location.href
  };
}

/**
 * Authentication Logger
 */
export const AuthLogger = {
  async logLogin(user, success = true, failureReason = null, method = 'password') {
    const context = getCommonContext();
    try {
      await api.entities.AuthLog.create({
        event_type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || 'Unknown',
        success,
        failure_reason: failureReason,
        login_method: method,
        ...context
      });
    } catch (e) {
      console.error('[AuthLogger] Failed to log login:', e);
    }
  },

  async logLogout(user) {
    const context = getCommonContext();
    try {
      await api.entities.AuthLog.create({
        event_type: 'LOGOUT',
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || 'Unknown',
        success: true,
        ...context
      });
    } catch (e) {
      console.error('[AuthLogger] Failed to log logout:', e);
    }
  },

  async logSessionExpired(user) {
    const context = getCommonContext();
    try {
      await api.entities.AuthLog.create({
        event_type: 'SESSION_EXPIRED',
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || 'Unknown',
        success: true,
        ...context
      });
    } catch (e) {
      console.error('[AuthLogger] Failed to log session expiry:', e);
    }
  },

  async logRoleChange(user, oldRole, newRole, changedBy) {
    const context = getCommonContext();
    try {
      await api.entities.AuthLog.create({
        event_type: 'ROLE_CHANGED',
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || 'Unknown',
        success: true,
        old_role: oldRole,
        new_role: newRole,
        changed_by: changedBy?.email || 'system',
        ...context
      });
    } catch (e) {
      console.error('[AuthLogger] Failed to log role change:', e);
    }
  },

  async logPasswordChange(user, success = true) {
    const context = getCommonContext();
    try {
      await api.entities.AuthLog.create({
        event_type: 'PASSWORD_CHANGE',
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || 'Unknown',
        success,
        ...context
      });
    } catch (e) {
      console.error('[AuthLogger] Failed to log password change:', e);
    }
  },

  async logAccountLocked(userEmail, reason) {
    const context = getCommonContext();
    try {
      await api.entities.AuthLog.create({
        event_type: 'ACCOUNT_LOCKED',
        user_email: userEmail,
        user_name: 'Unknown',
        success: true,
        failure_reason: reason,
        ...context
      });
    } catch (e) {
      console.error('[AuthLogger] Failed to log account lock:', e);
    }
  }
};

/**
 * User Activity Logger
 */
export const ActivityLogger = {
  async log(action, entityType, entityId, entityName, user, options = {}) {
    const context = getCommonContext();
    const startTime = options.startTime || Date.now();
    
    try {
      await api.entities.UserActivityLog.create({
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        entity_name: entityName || null,
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || 'Unknown',
        user_role: user?.role || 'unknown',
        changes: options.changes ? JSON.stringify(options.changes) : null,
        success: options.success !== false,
        error_message: options.error || null,
        duration_ms: Date.now() - startTime,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ...context
      });
    } catch (e) {
      console.error('[ActivityLogger] Failed to log activity:', e);
    }
  },

  async logCreate(entityType, entityId, entityName, user, metadata = {}) {
    await this.log('CREATE', entityType, entityId, entityName, user, { metadata });
  },

  async logUpdate(entityType, entityId, entityName, user, changes = {}, metadata = {}) {
    await this.log('UPDATE', entityType, entityId, entityName, user, { changes, metadata });
  },

  async logDelete(entityType, entityId, entityName, user, metadata = {}) {
    await this.log('DELETE', entityType, entityId, entityName, user, { metadata });
  },

  async logView(entityType, entityId, entityName, user, metadata = {}) {
    await this.log('VIEW', entityType, entityId, entityName, user, { metadata });
  },

  async logExport(entityType, user, recordCount, format = 'csv') {
    await this.log('EXPORT', entityType, null, null, user, { 
      metadata: { record_count: recordCount, format } 
    });
  },

  async logBulkOperation(action, entityType, count, user, metadata = {}) {
    await this.log(action, entityType, null, `${count} records`, user, { metadata });
  }
};

/**
 * System Logger
 */
export const SystemLogger = {
  async log(eventType, severity, message, options = {}) {
    const context = getCommonContext();
    
    try {
      await api.entities.SystemLog.create({
        event_type: eventType,
        severity,
        message,
        source: options.source || 'frontend',
        user_email: options.user?.email || null,
        integration_name: options.integrationName || null,
        request_payload: options.request ? JSON.stringify(options.request) : null,
        response_payload: options.response ? JSON.stringify(options.response) : null,
        response_time_ms: options.responseTime || null,
        file_name: options.fileName || null,
        file_size: options.fileSize || null,
        file_type: options.fileType || null,
        error_stack: options.errorStack || null,
        affected_entity: options.affectedEntity || null,
        old_value: options.oldValue ? JSON.stringify(options.oldValue) : null,
        new_value: options.newValue ? JSON.stringify(options.newValue) : null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ...context
      });
    } catch (e) {
      console.error('[SystemLogger] Failed to log:', e);
    }
  },

  async logConfigChange(entity, oldValue, newValue, user) {
    await this.log('CONFIG_CHANGE', 'INFO', `Configuration changed for ${entity}`, {
      affectedEntity: entity,
      oldValue,
      newValue,
      user
    });
  },

  async logIntegrationCall(integrationName, request, response, responseTime, success = true, user = null) {
    await this.log(
      success ? 'INTEGRATION_SUCCESS' : 'INTEGRATION_FAILURE',
      success ? 'INFO' : 'ERROR',
      `${integrationName} ${success ? 'succeeded' : 'failed'}`,
      { integrationName, request, response, responseTime, user }
    );
  },

  async logFileUpload(fileName, fileSize, fileType, user, success = true) {
    await this.log(
      'FILE_UPLOAD',
      success ? 'INFO' : 'ERROR',
      `File uploaded: ${fileName}`,
      { fileName, fileSize, fileType, user }
    );
  },

  async logFileDownload(fileName, user) {
    await this.log('FILE_DOWNLOAD', 'INFO', `File downloaded: ${fileName}`, {
      fileName,
      user
    });
  },

  async logEmailSent(recipient, subject, success = true, user = null) {
    await this.log(
      success ? 'EMAIL_SENT' : 'EMAIL_FAILED',
      success ? 'INFO' : 'ERROR',
      `Email ${success ? 'sent to' : 'failed for'}: ${recipient}`,
      { user, metadata: { recipient, subject } }
    );
  },

  async logError(message, errorStack, source = 'frontend', user = null) {
    await this.log('ERROR', 'ERROR', message, {
      errorStack,
      source,
      user
    });
  },

  async logSecurityAlert(message, user = null, metadata = {}) {
    await this.log('SECURITY_ALERT', 'CRITICAL', message, {
      user,
      metadata
    });
  },

  async logSuspiciousActivity(message, user = null, metadata = {}) {
    await this.log('SUSPICIOUS_ACTIVITY', 'WARNING', message, {
      user,
      metadata
    });
  }
};

// Export all loggers
export default {
  Auth: AuthLogger,
  Activity: ActivityLogger,
  System: SystemLogger
};