import React, { useState, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, Search, CheckCircle, XCircle, Clock, Upload, 
  Settings, Plus, TrendingUp, Users, AlertCircle, Filter, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { formatCurrency, getFinanceTheme } from '@/components/ClubConfig';
import { extractReferencesFromText } from '../payments/PaymentUtils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ConfirmDialog } from '../ui/confirm-dialog';

const colors = getFinanceTheme();

export default function PaymentManager({ onRecordPayment, showSettingsButton = true, showClubPaymentsButton = false, playerBalances = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [uploadingStatement, setUploadingStatement] = useState(false);
  const [matchedReferences, setMatchedReferences] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['allPlayerPayments'],
    queryFn: () => api.entities.PlayerPayment.list('-payment_date', 1000),
    refetchOnMount: 'always',
  });

  const { data: players = [] } = useQuery({
    queryKey: ['playersForPayments'],
    queryFn: () => api.entities.TeamPlayer.list('player_name', 500),
  });

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.player_name || 'Unknown';
  };

  // Fetch matches for filter
  const { data: matches = [] } = useQuery({
    queryKey: ['matchesForPaymentFilter'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date', 200),
  });

  // Fetch charges to link payments to matches
  const { data: playerCharges = [] } = useQuery({
    queryKey: ['chargesForPaymentFilter'],
    queryFn: () => api.entities.PlayerCharge.filter({ charge_type: 'match_fee' }, '-charge_date', 1000),
  });

  // Fetch allocations to link payments to charges
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocationsForPaymentFilter'],
    queryFn: () => api.entities.PaymentAllocation.list('-created_date', 2000),
  });

  const { data: settings } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      const list = await api.entities.PaymentSettings.list('-created_date', 1);
      return list[0] || { use_stripe: false, bank_name: '', account_number: '', sort_code: '', account_name: '' };
    },
  });

  const [settingsForm, setSettingsForm] = useState(settings || {});
  
  React.useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return api.entities.PaymentSettings.update(settings.id, data);
      }
      return api.entities.PaymentSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      setShowSettings(false);
      toast.success('Payment settings saved');
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, approverEmail }) => {
      // Get the payment details
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      // Update payment as verified
      await api.entities.PlayerPayment.update(paymentId, {
        verified: true,
        verified_by: approverEmail,
        verified_date: new Date().toISOString().split('T')[0]
      });

      // Auto-allocate payment to outstanding charges for this player
      const playerChargesForPlayer = playerCharges.filter(c => c.player_id === payment.player_id && !c.voided);
      const existingAllocations = allocations.filter(a => a.payment_id === paymentId);
      
      // If no allocations exist yet, create them
      if (existingAllocations.length === 0 && playerChargesForPlayer.length > 0) {
        let remainingAmount = payment.amount;
        
        for (const charge of playerChargesForPlayer) {
          if (remainingAmount <= 0) break;
          
          // Calculate how much is already allocated to this charge
          const chargeAllocations = allocations.filter(a => a.charge_id === charge.id);
          const alreadyAllocated = chargeAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
          const chargeOutstanding = charge.amount - alreadyAllocated;
          
          if (chargeOutstanding > 0) {
            const allocationAmount = Math.min(remainingAmount, chargeOutstanding);
            await api.entities.PaymentAllocation.create({
              payment_id: paymentId,
              charge_id: charge.id,
              amount: allocationAmount,
              allocation_date: new Date().toISOString().split('T')[0],
              allocated_by: approverEmail,
              notes: `Auto-allocated on approval`
            });
            remainingAmount -= allocationAmount;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPlayerPayments'] });
      queryClient.invalidateQueries({ queryKey: ['allocationsForPaymentFilter'] });
      queryClient.invalidateQueries({ queryKey: ['paymentAllocations'] });
      toast.success('Payment verified');
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (paymentId) => {
      // Delete related allocations first
      const relatedAllocations = allocations.filter(a => a.payment_id === paymentId);
      for (const allocation of relatedAllocations) {
        await api.entities.PaymentAllocation.delete(allocation.id);
      }
      // Then delete the payment
      return api.entities.PlayerPayment.delete(paymentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPlayerPayments'] });
      queryClient.invalidateQueries({ queryKey: ['allocationsForPaymentFilter'] });
      queryClient.invalidateQueries({ queryKey: ['paymentAllocations'] });
      toast.success('Payment rejected and allocations removed');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStatement(true);
    
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    
    // Extract text from PDF
    const result = await api.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                reference: { type: "string" },
                amount: { type: "number" },
                date: { type: "string" }
              }
            }
          },
          raw_text: { type: "string" }
        }
      }
    });

    if (result.status === 'success' && result.output) {
      // Extract references from raw text or transactions
      let refs = [];
      if (result.output.raw_text) {
        refs = extractReferencesFromText(result.output.raw_text);
      }
      if (result.output.transactions) {
        result.output.transactions.forEach(t => {
          if (t.reference) {
            const extracted = extractReferencesFromText(t.reference);
            refs = [...refs, ...extracted];
          }
        });
      }
      
      setMatchedReferences(refs);
      
      // Auto-approve matching pending payments
      const pendingPayments = payments.filter(p => p.status === 'pending');
      let approvedCount = 0;
      
      for (const payment of pendingPayments) {
        if (refs.includes(payment.reference.toUpperCase())) {
          await approvePaymentMutation.mutateAsync({ 
            paymentId: payment.id, 
            approverEmail: 'auto-matched' 
          });
          approvedCount++;
        }
      }
      
      toast.success(`Found ${refs.length} references. Auto-approved ${approvedCount} payments.`);
    } else {
      toast.error('Could not extract data from statement');
    }
    
    setUploadingStatement(false);
    e.target.value = '';
  };

  const pendingPayments = payments.filter(p => !p.verified);
      const completedPayments = payments.filter(p => p.verified);

      // Get players with unpaid balances
      const unpaidPlayers = useMemo(() => {
        return Object.entries(playerBalances)
          .filter(([_, data]) => data.balance < 0)
          .map(([id, data]) => ({ id, ...data }));
      }, [playerBalances]);

      const totalUnpaid = unpaidPlayers.reduce((sum, p) => sum + Math.abs(p.balance), 0);

      // Default to 'verified' tab if there are no pending payments but there are verified ones
      const defaultTab = pendingPayments.length > 0 ? 'pending' : (completedPayments.length > 0 ? 'verified' : 'pending');
      const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Update tab when data loads if current tab is empty
  React.useEffect(() => {
    if (payments.length > 0 && activeTab === 'pending' && pendingPayments.length === 0 && completedPayments.length > 0) {
      setActiveTab('verified');
    }
  }, [payments, pendingPayments.length, completedPayments.length]);

  // Build payment to match mapping
  const paymentToMatchMap = useMemo(() => {
    const map = {};
    allocations.forEach(a => {
      const charge = playerCharges.find(c => c.id === a.charge_id);
      if (charge?.reference_id) {
        map[a.payment_id] = charge.reference_id;
      }
    });
    return map;
  }, [allocations, playerCharges]);

  const filteredPayments = (list) => {
    let filtered = list;
    
    // Filter by match
    if (selectedMatch !== 'all') {
      filtered = filtered.filter(p => paymentToMatchMap[p.id] === selectedMatch);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const playerName = getPlayerName(p.player_id).toLowerCase();
        return playerName.includes(query) ||
          (p.reference || '').toLowerCase().includes(query) ||
          (p.notes || '').toLowerCase().includes(query) ||
          (p.payment_method || '').toLowerCase().includes(query);
      });
    }
    
    return filtered;
  };

  // Stats calculations
  const stats = useMemo(() => {
    const totalVerified = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const uniquePlayers = new Set(payments.map(p => p.player_id)).size;
    return { totalVerified, totalPending, uniquePlayers, pendingCount: pendingPayments.length };
  }, [payments, pendingPayments, completedPayments]);

  const displayedPayments = activeTab === 'pending' ? filteredPayments(pendingPayments) : filteredPayments(completedPayments);
    
    // Filter unpaid players by search
    const filteredUnpaidPlayers = unpaidPlayers.filter(p => {
      if (!searchQuery.trim()) return true;
      return p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <div className="space-y-6">
      {/* Quick Actions - Clear purpose for each */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Record Player Payment */}
        {onRecordPayment && (
          <button
            onClick={onRecordPayment}
            className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: colors.gradientProfit }}>
              <Plus className="w-5 h-5 text-black" />
            </div>
            <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Record Payment</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Log a player's payment</p>
          </button>
        )}
        
        {/* Club Expenses */}
        {showClubPaymentsButton && (
          <Link to={createPageUrl('ClubPayments')} className="block">
            <div
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] h-full"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: colors.lossLight }}>
                <Receipt className="w-5 h-5" style={{ color: colors.loss }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Club Expenses</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Track club spending</p>
            </div>
          </Link>
        )}
        
        {/* Upload Statement */}
        <label className="cursor-pointer">
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          <div
            className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] h-full"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, opacity: uploadingStatement ? 0.7 : 1 }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: colors.infoLight }}>
              {uploadingStatement ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.info }} /> : <Upload className="w-5 h-5" style={{ color: colors.info }} />}
            </div>
            <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Upload Statement</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Auto-match bank transfers</p>
          </div>
        </label>
        
        {/* Settings */}
        {showSettingsButton && (
          <button
            onClick={() => setShowSettings(true)}
            className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: colors.surfaceHover }}>
              <Settings className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>Settings</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Bank & Stripe config</p>
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.pending }} />
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.pending }}>{stats.pendingCount}</span> pending
          </span>
          <span className="text-sm" style={{ color: colors.textMuted }}>(£{(parseFloat(stats.totalPending) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.profit }} />
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.profit }}>£{(parseFloat(stats.totalVerified) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> verified
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.info }} />
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>{stats.uniquePlayers}</span> players
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
          <Input
            placeholder="Search by player name, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm w-full rounded-xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <Select value={selectedMatch} onValueChange={setSelectedMatch}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
            <SelectValue placeholder="Filter by Match" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <SelectItem value="all" style={{ color: colors.textSecondary }}>All Matches</SelectItem>
            {matches.map(m => (
              <SelectItem key={m.id} value={m.id} style={{ color: colors.textSecondary }}>
                {m.team1_name} vs {m.team2_name} {m.match_date ? `(${format(parseISO(m.match_date), 'dd MMM')})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tab Switcher */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('pending')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      style={{ 
                        backgroundColor: activeTab === 'pending' ? colors.pending : colors.surface,
                        color: activeTab === 'pending' ? '#000' : colors.textSecondary,
                        border: `1px solid ${activeTab === 'pending' ? colors.pending : colors.border}`
                      }}
                    >
                      <Clock className="w-4 h-4" />
                      Pending ({pendingPayments.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('verified')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      style={{ 
                        backgroundColor: activeTab === 'verified' ? colors.profit : colors.surface,
                        color: activeTab === 'verified' ? '#000' : colors.textSecondary,
                        border: `1px solid ${activeTab === 'verified' ? colors.profit : colors.border}`
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verified ({completedPayments.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('unpaid')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      style={{ 
                        backgroundColor: activeTab === 'unpaid' ? colors.loss : colors.surface,
                        color: activeTab === 'unpaid' ? '#fff' : colors.textSecondary,
                        border: `1px solid ${activeTab === 'unpaid' ? colors.loss : colors.border}`
                      }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Unpaid ({unpaidPlayers.length})
                    </button>
                  </div>

      {/* Payments List */}
                  <Card className="border-0 overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                    <CardContent className="p-0">
                      {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} /></div>
                      ) : activeTab === 'unpaid' ? (
                        // Unpaid Players List
                        filteredUnpaidPlayers.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
                              <CheckCircle className="w-6 h-6" style={{ color: colors.profit }} />
                            </div>
                            <p className="font-medium" style={{ color: colors.textSecondary }}>All caught up!</p>
                            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>No outstanding balances</p>
                          </div>
                        ) : (
                          <div className="divide-y" style={{ borderColor: colors.border }}>
                            {/* Unpaid Total Header */}
                            <div className="px-4 py-3 flex justify-between items-center" style={{ backgroundColor: colors.lossLight }}>
                              <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Outstanding</span>
                              <span className="font-bold text-lg" style={{ color: colors.loss }}>£{(parseFloat(totalUnpaid) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {filteredUnpaidPlayers.map((player) => (
                              <div 
                                key={player.id} 
                                className="flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02]"
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                    style={{ background: colors.gradientPrimary, color: 'white' }}
                                  >
                                    {player.name?.charAt(0) || '?'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                                      {player.name || 'Unknown'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                      <span className="text-xs" style={{ color: colors.textMuted }}>
                                         Charged: £{(parseFloat(player.totalCharges) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </span>
                                       <span className="text-xs" style={{ color: colors.textMuted }}>•</span>
                                       <span className="text-xs" style={{ color: colors.profit }}>
                                         Paid: £{(parseFloat(player.totalPayments) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="font-bold text-lg" style={{ color: colors.textLoss }}>
                                  £{(parseFloat(Math.abs(player.balance)) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      ) : displayedPayments.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: colors.surfaceHover }}>
                            {activeTab === 'pending' ? <Clock className="w-6 h-6" style={{ color: colors.textMuted }} /> : <CheckCircle className="w-6 h-6" style={{ color: colors.textMuted }} />}
                          </div>
                          <p className="font-medium" style={{ color: colors.textSecondary }}>
                            {activeTab === 'pending' ? 'No pending payments' : 'No verified payments'}
                          </p>
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                            {activeTab === 'pending' ? 'All payments have been processed' : 'Verified payments will appear here'}
                          </p>
                        </div>
                      ) : (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {displayedPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="p-4 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: colors.gradientPrimary, color: 'white' }}
                      >
                        {getPlayerName(payment.player_id).charAt(0)}
                      </div>
                      {/* Name & Amount */}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                          {getPlayerName(payment.player_id)}
                        </p>
                        <span 
                          className="font-bold text-lg"
                          style={{ color: activeTab === 'verified' ? colors.textProfit : colors.textPrimary }}
                        >
                          £{(parseFloat(payment.amount) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    {/* Actions - Top Right */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeTab === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => approvePaymentMutation.mutate({ paymentId: payment.id, approverEmail: 'treasurer' })}
                            style={{ background: colors.gradientProfit }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setConfirmDialog({
                                open: true,
                                title: 'Reject Payment',
                                message: `Are you sure you want to reject the payment of £${(parseFloat(payment.amount) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} from ${getPlayerName(payment.player_id)}? All allocations will be removed. This action cannot be undone.`,
                                onConfirm: () => rejectPaymentMutation.mutate(payment.id),
                                confirmText: 'Reject Payment',
                                variant: 'danger'
                              });
                            }}
                            style={{ borderColor: colors.loss, color: colors.loss }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {activeTab === 'verified' && (
                        <Badge style={{ backgroundColor: colors.profitLight, color: colors.profit }}>Verified</Badge>
                      )}
                    </div>
                  </div>
                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-2 pl-[52px]">
                    <code className="font-mono text-xs" style={{ color: colors.textMuted }}>
                      {payment.reference || payment.id.slice(0,8)}
                    </code>
                    <span className="text-xs" style={{ color: colors.textMuted }}>•</span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>{payment.payment_method}</span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>•</span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMM d') : '-'}
                    </span>
                  </div>
                  {/* Match Details */}
                  {payment.notes && (() => {
                    const forMatch = payment.notes.match(/For: ([^|]+)/);
                    if (forMatch) {
                      return (
                        <p className="text-xs mt-1.5 pl-[52px]" style={{ color: colors.textSecondary }}>
                          {forMatch[1].trim()}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>Payment Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
              <div>
                <p className="font-medium" style={{ color: colors.textPrimary }}>Use Stripe Gateway</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>Enable online card payments</p>
              </div>
              <Switch 
                checked={settingsForm.use_stripe} 
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, use_stripe: v })}
              />
            </div>

            <div className="space-y-3">
              <p className="font-medium text-sm" style={{ color: colors.textSecondary }}>Bank Transfer Details</p>
              <div className="space-y-2">
                <Label style={{ color: colors.textMuted }}>Bank Name</Label>
                <Input 
                  value={settingsForm.bank_name || ''} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: colors.textMuted }}>Account Name</Label>
                <Input 
                  value={settingsForm.account_name || ''} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, account_name: e.target.value })}
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label style={{ color: colors.textMuted }}>Account Number</Label>
                  <Input 
                    value={settingsForm.account_number || ''} 
                    onChange={(e) => setSettingsForm({ ...settingsForm, account_number: e.target.value })}
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: colors.textMuted }}>Sort Code</Label>
                  <Input 
                    value={settingsForm.sort_code || ''} 
                    onChange={(e) => setSettingsForm({ ...settingsForm, sort_code: e.target.value })}
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={() => saveSettingsMutation.mutate(settingsForm)}
              disabled={saveSettingsMutation.isPending}
              className="w-full"
              style={{ background: colors.gradientProfit }}
            >
              {saveSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </div>
        </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant || 'danger'}
        />
        </div>
        );
        }