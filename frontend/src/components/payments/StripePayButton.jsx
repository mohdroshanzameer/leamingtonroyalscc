import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getFinanceTheme } from '../ClubConfig';
import { format } from 'date-fns';

const colors = getFinanceTheme();

/**
 * Creates an audit log entry for payment actions
 * Stores in dedicated PaymentAuditLog entity with optional Transaction reference
 */
async function createPaymentAuditLog(action, details, user, transactionId = null) {
  const timestamp = new Date().toISOString();
  const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
  
  const auditEntry = {
    transaction_id: transactionId || details.transaction_id || null,
    action,
    status: details.status || 'initiated',
    amount: details.amount || 0,
    currency: 'GBP',
    description: details.description || '',
    user_email: user?.email || 'unknown',
    user_name: user?.full_name || 'Unknown User',
    timestamp,
    session_id: sessionId,
    ip_address: 'client-side',
    user_agent: navigator.userAgent,
    page_url: window.location.href,
    referrer: document.referrer || '',
    stripe_session_id: details.stripe_session_id || null,
    stripe_payment_intent: details.stripe_payment_intent || null,
    error_message: details.error || null,
    metadata: JSON.stringify(details.metadata || {})
  };

  // Log to console for debugging
  console.log(`[STRIPE AUDIT] ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} - ${action}:`, auditEntry);

  // Store in PaymentAuditLog entity
  try {
    await api.entities.PaymentAuditLog.create(auditEntry);
  } catch (error) {
    console.error('[STRIPE AUDIT] Failed to save audit log:', error);
  }

  return auditEntry;
}

function generateSessionId() {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('session_id', id);
  return id;
}

/**
 * Reusable Stripe Pay Button Component
 * Shows a "Pay Now" button only when Stripe is enabled in payment settings.
 * Includes detailed audit logging for compliance and tracking.
 * 
 * Props:
 * - amount: number (required) - Payment amount
 * - description: string - Payment description
 * - onPaymentInitiated: function - Callback when payment is initiated
 * - onPaymentSuccess: function - Callback on successful payment
 * - disabled: boolean - Disable the button
 * - className: string - Additional CSS classes
 * - size: string - Button size ('sm', 'default', 'lg')
 * - variant: string - Button variant
 * - metadata: object - Additional metadata to include in audit logs
 */
export default function StripePayButton({ 
  amount, 
  description = 'Payment',
  onPaymentInitiated,
  onPaymentSuccess,
  disabled = false,
  className = '',
  size = 'default',
  variant = 'default',
  metadata = {},
  children
}) {
  const [processing, setProcessing] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const queryClient = useQueryClient();

  // Fetch current user for audit logging
  React.useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: paymentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      const list = await api.entities.PaymentSettings.list('-created_date', 1);
      return list[0] || { use_stripe: false };
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const handlePayNow = async () => {
    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      await createPaymentAuditLog('PAYMENT_VALIDATION_FAILED', {
        amount,
        description,
        status: 'failed',
        metadata: { ...metadata, error: 'Invalid amount' }
      }, user);
      return;
    }

    setProcessing(true);
    
    // Log payment initiation
    await createPaymentAuditLog('PAYMENT_INITIATED', {
      amount,
      description,
      status: 'initiated',
      metadata: { ...metadata, payment_method: 'stripe' }
    }, user);
    
    try {
      // Notify parent that payment is being initiated
      if (onPaymentInitiated) {
        await onPaymentInitiated({ amount, description });
      }

      // Log button click action
      await createPaymentAuditLog('STRIPE_CHECKOUT_REQUESTED', {
        amount,
        description,
        status: 'pending',
        metadata: { ...metadata, stripe_enabled: true }
      }, user);

      // In production, this would redirect to Stripe Checkout
      // Requires backend functions to be enabled for full implementation
      toast.info('Stripe payment would be processed here. Backend functions required for full integration.');
      
      // Log that we're in demo mode
      await createPaymentAuditLog('STRIPE_DEMO_MODE', {
        amount,
        description,
        status: 'demo',
        metadata: { ...metadata, note: 'Backend functions required for production' }
      }, user);
      
      // Invalidate queries to refresh audit logs
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Simulate success callback for demo
      if (onPaymentSuccess) {
        // onPaymentSuccess({ amount, description, status: 'pending' });
      }
    } catch (error) {
      // Log payment failure
      await createPaymentAuditLog('PAYMENT_FAILED', {
        amount,
        description,
        status: 'failed',
        metadata: { ...metadata, error: error.message || 'Unknown error' }
      }, user);
      
      toast.error('Payment failed: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  // Don't render if Stripe is not enabled or still loading
  if (settingsLoading || !paymentSettings?.use_stripe) {
    return null;
  }

  return (
    <Button
      onClick={handlePayNow}
      disabled={disabled || processing || !amount}
      size={size}
      variant={variant}
      className={className}
      style={{ background: colors.gradientPrimary }}
    >
      {processing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-1" />
      )}
      {children || 'Pay Now'}
    </Button>
  );
}

/**
 * Hook to check if Stripe payments are enabled
 */
export function useStripeEnabled() {
  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      const list = await api.entities.PaymentSettings.list('-created_date', 1);
      return list[0] || { use_stripe: false };
    },
    staleTime: 60000,
  });

  return {
    isStripeEnabled: paymentSettings?.use_stripe || false,
    isLoading,
    paymentSettings
  };
}