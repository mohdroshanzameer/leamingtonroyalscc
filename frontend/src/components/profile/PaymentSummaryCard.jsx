import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, TrendingUp, TrendingDown, AlertCircle, Loader2, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PaymentSummaryCard({ totalCharges, totalPaid, balance, onPayNow, playerId, charges = [], allocations = [] }) {
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [paymentType, setPaymentType] = useState('single'); // 'single' or 'bulk'
  const [selectedChargeId, setSelectedChargeId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    reference: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const queryClient = useQueryClient();

  // Calculate pending charges (charges with outstanding balance)
  const getChargeAllocated = (chargeId) => {
    return allocations.filter(a => a.charge_id === chargeId).reduce((sum, a) => sum + (a.amount || 0), 0);
  };

  const pendingCharges = charges.filter(c => {
    const allocated = getChargeAllocated(c.id);
    return c.amount - allocated > 0;
  }).map(c => ({
    ...c,
    allocated: getChargeAllocated(c.id),
    due: c.amount - getChargeAllocated(c.id)
  }));

  // Fetch payment settings to check if Stripe is enabled
  const { data: paymentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['paymentSettingsPublic'],
    queryFn: async () => {
      const list = await api.entities.PaymentSettings.filter({ is_active: true }, '-created_date', 1);
      if (list.length > 0) return list[0];
      // Fallback to any settings with use_stripe enabled
      const allSettings = await api.entities.PaymentSettings.list('-created_date');
      return allSettings.find(s => s.use_stripe) || allSettings[0] || null;
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const selectedCharge = paymentType === 'single' ? pendingCharges.find(c => c.id === selectedChargeId) : null;
      const chargeDescription = selectedCharge 
        ? selectedCharge.description || selectedCharge.charge_type.replace('_', ' ')
        : 'Bulk payment';
      
      return api.entities.PlayerPayment.create({
        player_id: playerId,
        amount: parseFloat(data.amount),
        payment_method: 'Bank Transfer',
        payment_date: data.payment_date,
        reference: data.reference,
        notes: `${data.notes ? data.notes + ' | ' : ''}For: ${chargeDescription} | Submitted by player - pending verification`,
        verified: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerPayments'] });
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      setShowRecordDialog(false);
      setPaymentForm({ amount: '', reference: '', payment_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      setSelectedChargeId('');
      setPaymentType('single');
      toast.success('Payment recorded! Awaiting treasurer approval.');
    },
    onError: () => {
      toast.error('Failed to record payment');
    }
  });

  const validateAndConfirm = () => {
    if (!paymentForm.amount || !paymentForm.reference) {
      toast.error('Please enter amount and bank reference');
      return;
    }
    if (paymentType === 'single' && !selectedChargeId) {
      toast.error('Please select a charge to pay against');
      return;
    }
    setShowConfirm(true);
  };

  const handleRecordPayment = () => {
    setShowConfirm(false);
    recordPaymentMutation.mutate(paymentForm);
  };

  const openRecordDialog = () => {
    setPaymentType('single');
    setSelectedChargeId('');
    setPaymentForm({
      amount: '',
      reference: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    });
    setShowRecordDialog(true);
  };

  // When selecting a charge, auto-fill amount
  const handleChargeSelect = (chargeId) => {
    setSelectedChargeId(chargeId);
    const charge = pendingCharges.find(c => c.id === chargeId);
    if (charge) {
      setPaymentForm(prev => ({ ...prev, amount: charge.due.toString() }));
    }
  };

  const stripeEnabled = paymentSettings?.use_stripe;
  const isOwing = balance < 0;
  
  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-white">Payment Summary</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-white/5">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400">
            {CLUB_CONFIG.finance.currency}{totalCharges}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Total Charges</p>
        </div>
        
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">
            {CLUB_CONFIG.finance.currency}{totalPaid}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Total Paid</p>
        </div>
        
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {isOwing ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <p className={`text-xl font-bold ${isOwing ? 'text-red-400' : 'text-emerald-400'}`}>
            {CLUB_CONFIG.finance.currency}{Math.abs(balance)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
            {isOwing ? 'Outstanding' : 'Credit'}
          </p>
        </div>
      </div>

      {/* Pay Now CTA */}
      {isOwing && (
        <div className="p-4 border-t border-white/5">
          {settingsLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : stripeEnabled ? (
            <>
              <Button 
                className="w-full text-white font-semibold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #635bff 0%, #8b5cf6 100%)' }}
                onClick={onPayNow}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {CLUB_CONFIG.finance.currency}{Math.abs(balance)} with Stripe
              </Button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Secure payment via Stripe
              </p>
            </>
          ) : (
            <>
              <Button 
                className="w-full font-semibold"
                style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                onClick={openRecordDialog}
              >
                <Send className="w-4 h-4 mr-2" />
                I've Made a Payment
              </Button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Record your bank transfer for treasurer approval
              </p>
            </>
          )}
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent style={{ backgroundColor: '#0d0d0d', borderColor: '#262626' }} className="[&>button]:text-white [&>button]:opacity-70 [&>button:hover]:opacity-100 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Record Bank Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 pb-2">
            <p className="text-xs text-slate-400">
              Submit your payment details for treasurer verification.
            </p>

            {/* Payment Type Toggle */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-2 block text-slate-500">Payment Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPaymentType('single'); setSelectedChargeId(''); setPaymentForm(prev => ({ ...prev, amount: '' })); }}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: paymentType === 'single' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                    border: paymentType === 'single' ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: paymentType === 'single' ? '#10b981' : '#a3a3a3'
                  }}
                >
                  Single Charge
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentType('bulk'); setSelectedChargeId(''); setPaymentForm(prev => ({ ...prev, amount: Math.abs(balance).toString() })); }}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: paymentType === 'bulk' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: paymentType === 'bulk' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: paymentType === 'bulk' ? '#3b82f6' : '#a3a3a3'
                  }}
                >
                  Bulk Payment
                </button>
              </div>
            </div>

            {/* Pending Charges List (for single) */}
            {paymentType === 'single' && (
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider mb-2 block text-slate-500">Select Charge to Pay *</label>
                {pendingCharges.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No pending charges</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pendingCharges.map(charge => (
                      <button
                        key={charge.id}
                        type="button"
                        onClick={() => handleChargeSelect(charge.id)}
                        className="w-full p-3 rounded-lg text-left transition-all"
                        style={{ 
                          backgroundColor: selectedChargeId === charge.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                          border: selectedChargeId === charge.id ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {charge.description || charge.charge_type.replace('_', ' ')}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {charge.charge_date ? format(new Date(charge.charge_date), 'dd MMM yyyy') : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-400">{CLUB_CONFIG.finance.currency}{charge.due}</p>
                            <p className="text-[10px] text-slate-500">due</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block text-slate-500">Amount Paid *</label>
              <Input
                type="number"
                placeholder="0.00"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                disabled={paymentType === 'single'}
                style={{ backgroundColor: paymentType === 'single' ? '#111' : '#1a1a1a', borderColor: '#333', color: '#fff' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block text-slate-500">Bank Reference *</label>
              <Input
                placeholder="Enter your transfer reference"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                style={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block text-slate-500">Payment Date</label>
              <Input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                style={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block text-slate-500">Notes (Optional)</label>
              <Input
                placeholder="Any additional info..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                style={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
              />
            </div>

            {/* Confirm Payment */}
            {showConfirm && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#10b981' }}>Confirm Payment</p>
                <p className="text-xs mb-3" style={{ color: '#a3a3a3' }}>
                  Submit payment of {CLUB_CONFIG.finance.currency}{paymentForm.amount} for treasurer approval?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)} style={{ borderColor: '#333', color: '#a3a3a3' }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    {recordPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            {!showConfirm && (
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowRecordDialog(false)}
                  style={{ borderColor: '#333', color: '#a3a3a3' }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={validateAndConfirm}
                  disabled={recordPaymentMutation.isPending || (paymentType === 'single' && pendingCharges.length === 0)}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  Submit
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}