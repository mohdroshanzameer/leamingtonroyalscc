/**
 * Security Headers and CSP Component
 * Adds security-related meta tags to the document
 */

import { useEffect } from 'react';

export function useSecurityHeaders() {
  useEffect(() => {
    // Content Security Policy via meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = [
        "default-src 'self' https://*.api.io",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.api.io",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.api.io https://api.stripe.com wss://*.api.io",
        "frame-src 'self' https://js.stripe.com https://www.google.com https://*.api.io",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://*.api.io"
      ].join('; ');
      document.head.appendChild(meta);
    }

    // X-Content-Type-Options
    let xContentType = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!xContentType) {
      xContentType = document.createElement('meta');
      xContentType.httpEquiv = 'X-Content-Type-Options';
      xContentType.content = 'nosniff';
      document.head.appendChild(xContentType);
    }

    // Referrer Policy
    let referrer = document.querySelector('meta[name="referrer"]');
    if (!referrer) {
      referrer = document.createElement('meta');
      referrer.name = 'referrer';
      referrer.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrer);
    }

    // Permissions Policy (disable sensitive APIs we don't use)
    let permissions = document.querySelector('meta[http-equiv="Permissions-Policy"]');
    if (!permissions) {
      permissions = document.createElement('meta');
      permissions.httpEquiv = 'Permissions-Policy';
      permissions.content = 'geolocation=(), microphone=(), camera=(), payment=(self)';
      document.head.appendChild(permissions);
    }
  }, []);
}

/**
 * Component version for use in Layout
 */
export default function SecurityHeaders() {
  useSecurityHeaders();
  return null;
}