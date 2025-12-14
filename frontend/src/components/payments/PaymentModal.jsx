import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle, CreditCard, Building2 } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generatePaymentReference, parseFullName } from './PaymentUtils';
import { formatCurrency, CLUB_CONFIG } from '@/components/ClubConfig';

export default function PaymentModal({ 
  open, 
  onClose, 
  amount, 
  paymentType, 
  payerName, 
  payerEmail, 
  payerPhone,
  relatedEntityType,
  relatedEntityId,
  onPaymentComplete 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      try {
        const list = await api.entities.PaymentSettings.list('', 1);
        return list[0] || null;
      } catch (error) {
        console.warn('Failed to load payment settings:', error);
        return null;
      }
    },
    initialData: null,
    retry: false,
  });

  // Fallback settings if database query fails
  const bankSettings = settings || {
    use_stripe: false,
    bank_name: 'Contact club for bank details',
    account_number: 'To be provided',
    sort_code: 'To be provided',
    account_name: CLUB_CONFIG.name
  };

  useEffect(() => {
    if (open && payerName) {
      const { firstName, lastName } = parseFullName(payerName);
      const ref = generatePaymentReference(firstName, lastName, payerPhone, paymentType);
      setPaymentReference(ref);
      setPaymentCreated(false);
      setCopied(false);
    }
  }, [open, payerName, payerPhone, paymentType]);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(paymentReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Reference copied!');
  };

  const handleBankTransfer = async () => {
    setIsProcessing(true);
    
    await api.entities.Payment.create({
      reference: paymentReference,
      payment_type: paymentType,
      amount: amount,
      payer_name: payerName,
      payer_email: payerEmail,
      payer_phone: payerPhone,
      status: 'pending',
      payment_method: 'bank_transfer',
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId
    });
    
    setIsProcessing(false);
    setPaymentCreated(true);
    toast.success('Payment reference created. Complete the bank transfer using the reference.');
    
    if (onPaymentComplete) {
      onPaymentComplete({ status: 'pending', reference: paymentReference });
    }
  };

  const handleStripePayment = async () => {
    setIsProcessing(true);
    toast.info('Stripe integration requires API setup. Please contact admin.');
    setIsProcessing(false);
  };

  const useStripe = bankSettings?.use_stripe;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500 mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(amount)}</p>
            <Badge className="mt-2" variant="outline">{paymentType.replace('_', ' ').toUpperCase()}</Badge>
          </div>

          {useStripe ? (
            /* Stripe Payment */
            <div className="space-y-3">
              <Button 
                onClick={handleStripePayment}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Pay with Card
              </Button>
              <p className="text-xs text-center text-slate-500">Secure payment powered by Stripe</p>
            </div>
          ) : (
            /* Bank Transfer */
            <div className="space-y-4">
              {!paymentCreated ? (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-800">Bank Transfer</span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium">Bank:</span> {bankSettings.bank_name}</p>
                      <p><span className="font-medium">Account:</span> {bankSettings.account_number}</p>
                      <p><span className="font-medium">Sort Code:</span> {bankSettings.sort_code}</p>
                      <p><span className="font-medium">Name:</span> {bankSettings.account_name}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBankTransfer}
                    disabled={isProcessing}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-12"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Generate Payment Reference
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-800">Payment Reference Created</p>
                  </div>

                  <div className="p-4 bg-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Your Payment Reference</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-lg font-mono font-bold text-slate-900">{paymentReference}</code>
                      <Button size="sm" variant="outline" onClick={handleCopyReference}>
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 space-y-2">
                    <p>1. Transfer <strong>{formatCurrency(amount)}</strong> to the bank account above</p>
                    <p>2. Use <strong>{paymentReference}</strong> as payment reference</p>
                    <p>3. Your payment will be verified within 24-48 hours</p>
                  </div>

                  <Button onClick={onClose} variant="outline" className="w-full">
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}