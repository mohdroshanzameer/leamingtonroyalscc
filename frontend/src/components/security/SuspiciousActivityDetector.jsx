/**
 * Suspicious Activity Detection
 * Monitors and logs unusual user behavior patterns
 */

import { SystemLogger } from '../logging/AuditLogger';

// In-memory tracking (per session)
const activityTracker = {
  failedAttempts: {},
  rapidActions: {},
  lastAction: {}
};

// Thresholds
const THRESHOLDS = {
  MAX_FAILED_ATTEMPTS: 5,        // Max failures before alert
  FAILED_WINDOW_MS: 300000,      // 5 minutes
  RAPID_ACTION_COUNT: 20,        // Actions in window
  RAPID_ACTION_WINDOW_MS: 60000, // 1 minute
  MIN_ACTION_INTERVAL_MS: 100    // Too fast = bot
};

/**
 * Track failed attempts (login, payment, etc.)
 */
export function trackFailedAttempt(action, user = null) {
  const key = `${action}_${user?.email || 'anonymous'}`;
  const now = Date.now();
  
  if (!activityTracker.failedAttempts[key]) {
    activityTracker.failedAttempts[key] = [];
  }
  
  // Clean old attempts
  activityTracker.failedAttempts[key] = activityTracker.failedAttempts[key]
    .filter(t => now - t < THRESHOLDS.FAILED_WINDOW_MS);
  
  activityTracker.failedAttempts[key].push(now);
  
  const count = activityTracker.failedAttempts[key].length;
  
  if (count >= THRESHOLDS.MAX_FAILED_ATTEMPTS) {
    SystemLogger.logSecurityAlert(
      `Multiple failed ${action} attempts detected`,
      user,
      { action, failedCount: count, windowMinutes: THRESHOLDS.FAILED_WINDOW_MS / 60000 }
    );
    return { suspicious: true, count, shouldBlock: true };
  }
  
  return { suspicious: false, count, shouldBlock: false };
}

/**
 * Track rapid actions (potential bot or attack)
 */
export function trackRapidAction(action, user = null) {
  const key = `${action}_${user?.email || 'anonymous'}`;
  const now = Date.now();
  
  // Check if action is too fast
  const lastTime = activityTracker.lastAction[key] || 0;
  const interval = now - lastTime;
  activityTracker.lastAction[key] = now;
  
  if (interval < THRESHOLDS.MIN_ACTION_INTERVAL_MS && lastTime > 0) {
    SystemLogger.logSuspiciousActivity(
      `Unusually rapid ${action} detected (${interval}ms interval)`,
      user,
      { action, intervalMs: interval }
    );
    return { suspicious: true, reason: 'too_fast' };
  }
  
  // Track action count in window
  if (!activityTracker.rapidActions[key]) {
    activityTracker.rapidActions[key] = [];
  }
  
  activityTracker.rapidActions[key] = activityTracker.rapidActions[key]
    .filter(t => now - t < THRESHOLDS.RAPID_ACTION_WINDOW_MS);
  
  activityTracker.rapidActions[key].push(now);
  
  const count = activityTracker.rapidActions[key].length;
  
  if (count >= THRESHOLDS.RAPID_ACTION_COUNT) {
    SystemLogger.logSecurityAlert(
      `Rate limit exceeded for ${action}`,
      user,
      { action, actionCount: count, windowSeconds: THRESHOLDS.RAPID_ACTION_WINDOW_MS / 1000 }
    );
    return { suspicious: true, reason: 'rate_limit', count };
  }
  
  return { suspicious: false, count };
}

/**
 * Detect unusual data patterns
 */
export function detectAnomalousData(data, context, user = null) {
  const anomalies = [];
  
  // Unusually large amounts
  if (data.amount && parseFloat(data.amount) > 50000) {
    anomalies.push({ type: 'large_amount', value: data.amount });
  }
  
  // Unusual time (outside business hours for sensitive operations)
  const hour = new Date().getHours();
  if (context === 'financial' && (hour < 6 || hour > 22)) {
    anomalies.push({ type: 'unusual_time', hour });
  }
  
  // Multiple records with same reference
  if (data.reference && data.existingReferences?.includes(data.reference)) {
    anomalies.push({ type: 'duplicate_reference', reference: data.reference });
  }
  
  if (anomalies.length > 0) {
    SystemLogger.logSuspiciousActivity(
      `Anomalous data detected in ${context}`,
      user,
      { anomalies, data: { ...data, existingReferences: undefined } }
    );
  }
  
  return anomalies;
}

/**
 * Check for privilege escalation attempts
 */
export function checkPrivilegeEscalation(user, requiredRole, action) {
  if (!user) {
    SystemLogger.logSecurityAlert(
      `Unauthenticated access attempt: ${action}`,
      null,
      { action, requiredRole }
    );
    return true;
  }
  
  const roleHierarchy = {
    'user': 1,
    'player': 2,
    'captain': 3,
    'treasurer': 4,
    'admin': 5,
    'super_admin': 6
  };
  
  const userLevel = roleHierarchy[user.role] || 1;
  const requiredLevel = roleHierarchy[requiredRole] || 1;
  
  if (userLevel < requiredLevel) {
    SystemLogger.logSecurityAlert(
      `Privilege escalation attempt: ${action}`,
      user,
      { action, userRole: user.role, requiredRole }
    );
    return true;
  }
  
  return false;
}

/**
 * Reset tracking for a user (e.g., after successful login)
 */
export function resetTracking(action, user) {
  const key = `${action}_${user?.email || 'anonymous'}`;
  delete activityTracker.failedAttempts[key];
  delete activityTracker.rapidActions[key];
}

export default {
  trackFailedAttempt,
  trackRapidAction,
  detectAnomalousData,
  checkPrivilegeEscalation,
  resetTracking
};