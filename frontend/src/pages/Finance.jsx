import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { 
  Loader2, Plus, Download, Search, CreditCard, 
  TrendingUp, TrendingDown, Users, FileText, Receipt, 
  Shield, Crown, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronRight, Filter, MoreHorizontal, Building2, Settings, ChevronDown
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

import MembershipManager from '../components/finance/MembershipManager';

import FinancialReports from '../components/finance/FinancialReports';


import PaymentManager from '../components/finance/PaymentManager';
import TransactionForm from '../components/finance/TransactionForm';
import { canViewFinance, canManageFinance, getRoleLabel } from '../components/RoleAccess';
import { CLUB_CONFIG, getFinanceTheme } from '../components/ClubConfig';


// Use finance-specific premium theme
const colors = getFinanceTheme();

export default function Finance() {
  console.log('✅ Finance.js - Component loaded successfully');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({ 
    player_id: '', 
    amount: '', 
    payment_method: 'Cash', 
    notes: '',
    payment_type: 'single', // 'single' or 'bulk'
    match_date: '',
    match_id: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    reference: ''
  });
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'income', 'expense', 'matchfee'
  const [activityLimit, setActivityLimit] = useState(50);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔍 Finance Page - Component Mounted');
    console.log('🔍 Finance Page - Window location:', window.location.href);
    let mounted = true;
    api.auth.me()
      .then(u => { 
        if (mounted) {
          setUser(u);
          console.log('🔍 Finance Page - User Data:', u);
          console.log('🔍 Finance Page - User club_role:', u?.club_role);
          console.log('🔍 Finance Page - canViewFinance:', canViewFinance(u));
        }
      })
      .catch((err) => { 
        console.log('🔍 Finance Page - Auth Error:', err);
        if (mounted) api.auth.redirectToLogin(); 
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const allTx = await api.entities.Transaction.list('-date', 500);
      return allTx.filter(t => !t.is_deleted);
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['memberships-finance'],
    queryFn: () => api.entities.Membership.list('-created_date', 200),
  });

  const { data: playerCharges = [] } = useQuery({
    queryKey: ['playerCharges'],
    queryFn: () => api.entities.PlayerCharge.list('-charge_date', 1000),
  });

  const { data: playerPayments = [] } = useQuery({
    queryKey: ['playerPayments'],
    queryFn: () => api.entities.PlayerPayment.list('-payment_date', 1000),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: sponsorPayments = [] } = useQuery({
    queryKey: ['sponsorPayments'],
    queryFn: () => api.entities.SponsorPayment.list('-payment_date'),
  });

  const { data: sponsorTypes = [] } = useQuery({
    queryKey: ['sponsorTypes'],
    queryFn: () => api.entities.SponsorType.filter({ is_active: true }, 'display_order'),
  });

  const { data: paymentAllocations = [] } = useQuery({
    queryKey: ['paymentAllocations'],
    queryFn: () => api.entities.PaymentAllocation.list('-created_date', 2000),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers'],
    queryFn: () => api.entities.TeamPlayer.list('player_name', 500),
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      try {
        const list = await api.entities.PaymentSettings.list('', 1);
        return list[0] || { use_stripe: false, bank_name: '', account_number: '', sort_code: '', account_name: '' };
      } catch (error) {
        console.warn('Failed to load payment settings:', error);
        return { use_stripe: false, bank_name: '', account_number: '', sort_code: '', account_name: '' };
      }
    },
    initialData: { use_stripe: false, bank_name: '', account_number: '', sort_code: '', account_name: '' },
    retry: false,
  });

  React.useEffect(() => {
    if (paymentSettings) setSettingsForm(paymentSettings);
  }, [paymentSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (paymentSettings?.id) {
        return api.entities.PaymentSettings.update(paymentSettings.id, data);
      }
      return api.entities.PaymentSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      setShowSettingsDialog(false);
      toast.success('Payment settings saved');
    },
  });



  const { data: matches = [] } = useQuery({
    queryKey: ['tournamentMatches'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date', 500),
  });

  // Get unique match dates for selected player
  const playerMatchDates = useMemo(() => {
    if (!paymentData.player_id) return [];
    const playerChargeMatchIds = playerCharges
      .filter(c => c.player_id === paymentData.player_id && c.charge_type === 'match_fee' && c.reference_id)
      .map(c => c.reference_id);
    
    const playerMatchList = matches
      .filter(m => playerChargeMatchIds.includes(m.id) || m.status === 'completed')
      .filter(m => m.match_date)
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
    
    // Get unique dates
    const uniqueDates = [...new Set(playerMatchList.map(m => format(new Date(m.match_date), 'yyyy-MM-dd')))];
    return uniqueDates;
  }, [paymentData.player_id, playerCharges, matches]);

  // Get match for selected date
  const matchForSelectedDate = useMemo(() => {
    if (!paymentData.match_date || !paymentData.player_id) return null;
    return matches.find(m => m.match_date && format(new Date(m.match_date), 'yyyy-MM-dd') === paymentData.match_date);
  }, [paymentData.match_date, paymentData.player_id, matches]);

  // Get charge amount for selected match
  const chargeForSelectedMatch = useMemo(() => {
    if (!matchForSelectedDate || !paymentData.player_id) return null;
    return playerCharges.find(c => 
      c.player_id === paymentData.player_id && 
      c.reference_id === matchForSelectedDate.id && 
      c.charge_type === 'match_fee' &&
      !c.voided
    );
  }, [matchForSelectedDate, paymentData.player_id, playerCharges]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const completedTx = (transactions || []).filter(t => t.status === 'Completed' && !t.is_deleted);
    
    // All-time totals (only verified payments)
    // NOTE: Sponsorships are in Transactions (category_name: 'Sponsorship'), so don't add them separately
    const allTimeTxIncome = completedTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const allTimeTxExpenses = completedTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const allTimePlayerPayments = (playerPayments || []).filter(p => p.verified).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    // For expected income: calculate unique sponsorships (one per sponsor+type+level+season)
    const uniqueDeals = new Map();
    (sponsorPayments || []).forEach(p => {
      const key = `${p.sponsor_id}-${p.season_id || 'none'}-${p.sponsor_type}-${p.sponsorship_level}-${p.competition_id || 'none'}-${p.team_id || 'none'}`;
      if (!uniqueDeals.has(key)) {
        uniqueDeals.set(key, p);
      }
    });
    
    const sponsorshipExpectedTotal = Array.from(uniqueDeals.values()).reduce((sum, p) => {
      const type = (sponsorTypes || []).find(t => t.name === p.sponsor_type);
      return sum + (parseFloat(type?.suggested_amount) || 0);
    }, 0);
    
    const sponsorshipReceivedTotal = (sponsorPayments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const sponsorshipOutstanding = Math.max(0, sponsorshipExpectedTotal - sponsorshipReceivedTotal);
    
    const totalReceivedIncome = (allTimeTxIncome || 0) + (allTimePlayerPayments || 0);
    const totalExpectedIncome = totalReceivedIncome + sponsorshipOutstanding;
    
    console.log('💰 Sponsorship Calc:', { 
      uniqueDeals: uniqueDeals.size, 
      expected: sponsorshipExpectedTotal, 
      received: sponsorshipReceivedTotal, 
      outstanding: sponsorshipOutstanding 
    });
    const balance = totalReceivedIncome - (allTimeTxExpenses || 0);
    const totalExpenses = allTimeTxExpenses || 0;

    // This month transactions
    const thisMonthTx = completedTx.filter(t => t.date && isWithinInterval(new Date(t.date), { start: thisMonthStart, end: thisMonthEnd }));
    const thisMonthTxIncome = thisMonthTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const thisMonthExpense = thisMonthTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    // This month player payments (only verified)
    // NOTE: Sponsorships already in thisMonthTxIncome, don't add separately
    const thisMonthPlayerPayments = (playerPayments || [])
      .filter(p => p.verified && p.payment_date && isWithinInterval(new Date(p.payment_date), { start: thisMonthStart, end: thisMonthEnd }))
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const thisMonthIncome = (thisMonthTxIncome || 0) + (thisMonthPlayerPayments || 0);

    // Last month for trend (only verified payments)
    const lastMonthTx = completedTx.filter(t => t.date && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }));
    const lastMonthTxIncome = lastMonthTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const lastMonthPlayerPayments = (playerPayments || [])
      .filter(p => p.verified && p.payment_date && isWithinInterval(new Date(p.payment_date), { start: lastMonthStart, end: lastMonthEnd }))
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const lastMonthIncome = (lastMonthTxIncome || 0) + (lastMonthPlayerPayments || 0);
    const incomeTrend = (lastMonthIncome || 0) > 0 ? (((thisMonthIncome || 0) - (lastMonthIncome || 0)) / (lastMonthIncome || 0) * 100) : 0;

    // Monthly data for mini chart
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(now, i));
      const mEnd = endOfMonth(subMonths(now, i));
      const mTx = completedTx.filter(t => t.date && isWithinInterval(new Date(t.date), { start: mStart, end: mEnd }));
      const mPlayerPayments = (playerPayments || []).filter(p => p.verified && p.payment_date && isWithinInterval(new Date(p.payment_date), { start: mStart, end: mEnd }));
      monthlyData.push({
        month: format(mStart, 'MMM'),
        income: mTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) + mPlayerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        expenses: mTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
      });
    }

    const activeMemberships = (memberships || []).filter(m => m.status === 'Active').length;

    return { 
      totalReceivedIncome: totalReceivedIncome || 0,
      totalExpectedIncome: totalExpectedIncome || 0,
      totalExpenses: totalExpenses || 0, 
      balance: isNaN(balance) ? 0 : balance, 
      thisMonthIncome: thisMonthIncome || 0, 
      thisMonthExpense: thisMonthExpense || 0, 
      incomeTrend: isNaN(incomeTrend) ? 0 : incomeTrend, 
      monthlyData, 
      activeMemberships,
      sponsorshipOutstanding: sponsorshipOutstanding || 0
    };
  }, [transactions, memberships, playerPayments, sponsorPayments, sponsorTypes]);

  // Player balances from ledger
  const playerBalances = useMemo(() => {
    const balances = {};
    players.forEach(p => {
      balances[p.id] = { name: p.player_name, balance: 0, totalCharges: 0, totalPayments: 0 };
    });
    // Add charges (money owed)
    playerCharges.filter(c => !c.voided).forEach(c => {
      if (!balances[c.player_id]) {
        balances[c.player_id] = { name: 'Unknown', balance: 0, totalCharges: 0, totalPayments: 0 };
      }
      balances[c.player_id].totalCharges += c.amount || 0;
      balances[c.player_id].balance -= c.amount || 0;
    });
    // Add payments (money paid - only verified)
    playerPayments.filter(p => p.verified).forEach(p => {
      if (!balances[p.player_id]) {
        balances[p.player_id] = { name: 'Unknown', balance: 0, totalCharges: 0, totalPayments: 0 };
      }
      balances[p.player_id].totalPayments += p.amount || 0;
      balances[p.player_id].balance += p.amount || 0;
    });
    return balances;
  }, [playerCharges, playerPayments, players]);

  const matchFeeStats = useMemo(() => {
        // Calculate from match_fee charges specifically
        const matchFeeChargesOnly = playerCharges.filter(c => c.charge_type === 'match_fee' && !c.voided);
        const totalExpected = matchFeeChargesOnly.reduce((sum, c) => sum + (c.amount || 0), 0);

        // Calculate allocated amounts per charge
        const chargeAllocations = {};
        paymentAllocations.forEach(a => {
          chargeAllocations[a.charge_id] = (chargeAllocations[a.charge_id] || 0) + (a.amount || 0);
        });

        // Calculate total collected for match fees
        const totalCollected = matchFeeChargesOnly.reduce((sum, c) => {
          return sum + (chargeAllocations[c.id] || 0);
        }, 0);

        const totalOwed = Math.max(0, totalExpected - totalCollected);

        // Count players with outstanding match fees
        const playerMatchFeeBalances = {};
        matchFeeChargesOnly.forEach(c => {
          if (!playerMatchFeeBalances[c.player_id]) {
            playerMatchFeeBalances[c.player_id] = { charged: 0, paid: 0 };
          }
          playerMatchFeeBalances[c.player_id].charged += c.amount || 0;
          playerMatchFeeBalances[c.player_id].paid += chargeAllocations[c.id] || 0;
        });

        const playersOwing = Object.values(playerMatchFeeBalances).filter(p => p.charged > p.paid).length;

        return { totalOwed, totalCollected, playersOwing, totalExpected };
      }, [playerCharges, paymentAllocations]);

      // Calculate unallocated payments (payments not linked to charges - only verified)
      const unallocatedAmount = useMemo(() => {
        const totalPayments = playerPayments.filter(p => p.verified).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalAllocated = paymentAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
        return Math.max(0, totalPayments - totalAllocated);
      }, [playerPayments, paymentAllocations]);

      // Calculate total outstanding from ALL charge types (not just match fees)
      const totalOutstandingAllFees = useMemo(() => {
        return Object.values(playerBalances)
          .filter(data => data.balance < 0)
          .reduce((sum, data) => sum + Math.abs(data.balance), 0);
      }, [playerBalances]);

      // Count players with any outstanding balance
      const playersWithOutstanding = useMemo(() => {
        return Object.values(playerBalances).filter(data => data.balance < 0).length;
      }, [playerBalances]);

      // Calculate total charges and payments for collection rate
      const totalAllCharges = useMemo(() => {
        return playerCharges.filter(c => !c.voided).reduce((sum, c) => sum + (c.amount || 0), 0);
      }, [playerCharges]);

      const totalAllPayments = useMemo(() => {
        return playerPayments.filter(p => p.verified).reduce((sum, p) => sum + (p.amount || 0), 0);
      }, [playerPayments]);

  // Recent activity (transactions + verified player payments) - must be before early returns
  // NOTE: Sponsorships are already in Transactions, so we don't add them separately
  const allActivity = useMemo(() => {
    const paymentActivities = playerPayments.filter(p => p.verified).map(p => {
      const player = players.find(pl => pl.id === p.player_id);
      return {
        id: p.id,
        type: 'Income',
        amount: p.amount,
        date: p.payment_date,
        description: `Player Payment - ${player?.player_name || 'Unknown'}`,
        category_name: 'Player Payment',
        isPayment: true
      };
    });
    const combined = [...transactions, ...paymentActivities].sort((a, b) => 
      new Date(b.date || b.payment_date) - new Date(a.date || a.payment_date)
    );
    return combined;
  }, [transactions, playerPayments, players]);

  const createPaymentMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create the payment record
      const payment = await api.entities.PlayerPayment.create(data);
      
      // 2. Find player's unpaid charges (oldest first)
      const playerChargesOwed = playerCharges
        .filter(c => c.player_id === data.player_id && !c.voided)
        .sort((a, b) => new Date(a.charge_date) - new Date(b.charge_date));
      
      // Calculate existing allocations per charge
      const chargeAllocations = {};
      paymentAllocations.forEach(a => {
        chargeAllocations[a.charge_id] = (chargeAllocations[a.charge_id] || 0) + (a.amount || 0);
      });
      
      // 3. Allocate payment to charges
      let remainingAmount = data.amount;
      const allocationsToCreate = [];
      
      for (const charge of playerChargesOwed) {
        if (remainingAmount <= 0) break;
        
        const alreadyAllocated = chargeAllocations[charge.id] || 0;
        const chargeRemaining = charge.amount - alreadyAllocated;
        
        if (chargeRemaining > 0) {
          const allocateAmount = Math.min(remainingAmount, chargeRemaining);
          allocationsToCreate.push({
            payment_id: payment.id,
            charge_id: charge.id,
            amount: allocateAmount,
            allocation_date: data.payment_date,
            allocated_by: user?.email || 'system',
            notes: data.reference ? `Ref: ${data.reference}` : undefined
          });
          remainingAmount -= allocateAmount;
        }
      }
      
      // 4. Create allocation records
      if (allocationsToCreate.length > 0) {
        await api.entities.PaymentAllocation.bulkCreate(allocationsToCreate);
      }
      
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerPayments'] });
      queryClient.invalidateQueries({ queryKey: ['paymentAllocations'] });
      resetPaymentDialog();
      toast.success('Payment recorded and allocated');
    },
  });

  // Utility function to recalculate allocations when a payment amount changes
  const recalculateAllocations = async (paymentId, newAmount, playerId) => {
    // Get existing allocations for this payment
    const existingAllocations = paymentAllocations.filter(a => a.payment_id === paymentId);
    
    // Delete existing allocations
    for (const allocation of existingAllocations) {
      await api.entities.PaymentAllocation.delete(allocation.id);
    }
    
    // Re-allocate with new amount
    const playerChargesOwed = playerCharges
      .filter(c => c.player_id === playerId && !c.voided)
      .sort((a, b) => new Date(a.charge_date) - new Date(b.charge_date));
    
    // Calculate existing allocations per charge (excluding this payment's allocations)
    const chargeAllocations = {};
    paymentAllocations
      .filter(a => a.payment_id !== paymentId)
      .forEach(a => {
        chargeAllocations[a.charge_id] = (chargeAllocations[a.charge_id] || 0) + (a.amount || 0);
      });
    
    let remainingAmount = newAmount;
    const allocationsToCreate = [];
    
    for (const charge of playerChargesOwed) {
      if (remainingAmount <= 0) break;
      
      const alreadyAllocated = chargeAllocations[charge.id] || 0;
      const chargeRemaining = charge.amount - alreadyAllocated;
      
      if (chargeRemaining > 0) {
        const allocateAmount = Math.min(remainingAmount, chargeRemaining);
        allocationsToCreate.push({
          payment_id: paymentId,
          charge_id: charge.id,
          amount: allocateAmount,
          allocation_date: format(new Date(), 'yyyy-MM-dd'),
          allocated_by: user?.email || 'system',
          notes: 'Re-allocated after payment update'
        });
        remainingAmount -= allocateAmount;
      }
    }
    
    if (allocationsToCreate.length > 0) {
      await api.entities.PaymentAllocation.bulkCreate(allocationsToCreate);
    }
  };

  const checkForDuplicate = () => {
    const isSingle = paymentData.payment_type === 'single';
    const amount = isSingle && matchForSelectedDate 
      ? (chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee) 
      : parseFloat(paymentData.amount);
    
    if (!paymentData.player_id) {
      toast.error('Select a player');
      return;
    }
    if (isSingle && !matchForSelectedDate) {
      toast.error('Select a match date');
      return;
    }
    if (!isSingle && !paymentData.amount) {
      toast.error('Enter amount');
      return;
    }
    
    if (!paymentData.reference?.trim()) {
      toast.error('Payment reference is required');
      return;
    }
    
    // Check for existing payment with same reference
    if (paymentData.reference) {
      const existingByRef = playerPayments.find(p => 
        p.reference && p.reference.toLowerCase() === paymentData.reference.toLowerCase()
      );
      if (existingByRef) {
        const player = players.find(pl => pl.id === existingByRef.player_id);
        setDuplicateWarning({
          message: `A payment with reference "${paymentData.reference}" already exists (${player?.player_name || 'Unknown'} - £${existingByRef.amount}).`,
          existingPayment: existingByRef
        });
        return;
      }
    }
    
    // Check for existing payment with same player, amount, and date
    const existingPayment = playerPayments.find(p => 
      p.player_id === paymentData.player_id && 
      p.amount === parseFloat(paymentData.amount) && 
      p.payment_date === paymentData.payment_date
    );
    
    if (existingPayment) {
      const player = players.find(pl => pl.id === paymentData.player_id);
      setDuplicateWarning({
        message: `A payment of £${paymentData.amount} for ${player?.player_name || 'this player'} on ${format(new Date(paymentData.payment_date), 'dd MMM yyyy')} already exists.`,
        existingPayment
      });
    } else {
      setShowConfirmPayment(true);
    }
  };

  const handleAddPayment = () => {
    setDuplicateWarning(null);
    setShowConfirmPayment(false);
    const isBulk = paymentData.payment_type === 'bulk';
    const amount = isBulk 
      ? parseFloat(paymentData.amount) 
      : (chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee);
    createPaymentMutation.mutate({
                player_id: paymentData.player_id,
                amount: amount,
                payment_method: paymentData.payment_method,
                notes: isBulk ? `Bulk payment - ${paymentData.notes || 'Multiple matches'}` : paymentData.notes,
                payment_date: paymentData.payment_date,
                reference: paymentData.reference || matchForSelectedDate?.id || undefined
                });
  };

  const resetPaymentDialog = () => {
    setPaymentData({ 
      player_id: '', 
      amount: '', 
      payment_method: 'Cash', 
      notes: '',
      payment_type: 'single',
      match_date: '',
      match_id: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      reference: ''
    });
    setDuplicateWarning(null);
    setShowPaymentDialog(false);
  };

  const formatCurrency = (v) => `${CLUB_CONFIG.finance.currency}${v?.toLocaleString('en-GB', { minimumFractionDigits: 0 }) || 0}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  if (!user || !canViewFinance(user)) {
    console.log('❌ Finance Page - Access Denied. User:', user);
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p style={{ color: colors.textMuted }}>You don't have permission to access finance.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render different views based on activeView
  if (activeView === 'memberships') return <ViewWrapper title="Memberships" onBack={() => setActiveView('dashboard')}><MembershipManager /></ViewWrapper>;
  

  if (activeView === 'payments') return (
    <ViewWrapper 
      title="Manage Payments" 
      subtitle="Approve pending payments, record new transactions, and manage club expenses"
      onBack={() => setActiveView('dashboard')}
    >
      <PaymentManager 
                    onRecordPayment={() => setShowPaymentDialog(true)} 
                    showSettingsButton={false}
                    showClubPaymentsButton={true}
                    playerBalances={playerBalances}
                  />
      {/* Payment Dialog for payments view */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => { if (!open) resetPaymentDialog(); else setShowPaymentDialog(true); }}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="[&>button]:text-white [&>button]:opacity-70 [&>button:hover]:opacity-100 max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Player *</label>
                <Select value={paymentData.player_id} onValueChange={(v) => setPaymentData({ ...paymentData, player_id: v, match_id: '', match_date: '' })}>
                  <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(p => {
                      const bal = playerBalances[p.id]?.balance || 0;
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.player_name} {bal < 0 ? `(-£${Math.abs(bal)})` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Type</label>
                <Select value={paymentData.payment_type} onValueChange={(v) => setPaymentData({ ...paymentData, payment_type: v, match_id: '', match_date: '' })}>
                  <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="bulk">Bulk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Match Date - only for single */}
            {paymentData.payment_type === 'single' && (
              <>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Match Date</label>
                  <Select 
                    value={paymentData.match_date} 
                    onValueChange={(v) => setPaymentData({ ...paymentData, match_date: v })}
                    disabled={!paymentData.player_id}
                  >
                    <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                      <SelectValue placeholder={paymentData.player_id ? "Select date" : "Select player first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {playerMatchDates.length === 0 ? (
                        <SelectItem value="none" disabled>No matches</SelectItem>
                      ) : (
                        playerMatchDates.map(date => (
                          <SelectItem key={date} value={date}>
                            {format(new Date(date), 'dd MMM yyyy')}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {matchForSelectedDate && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Match</label>
                      <div 
                        className="px-3 py-2 rounded-md text-sm h-9 flex items-center"
                        style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                      >
                        {matchForSelectedDate.team1_name} vs {matchForSelectedDate.team2_name}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Fee</label>
                      <div 
                        className="px-3 py-2 rounded-md text-sm h-9 flex items-center font-semibold"
                        style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.textProfit }}
                      >
                        £{chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Amount *</label>
                {paymentData.payment_type === 'single' && matchForSelectedDate ? (
                  <div 
                    className="px-3 py-2 rounded-md text-sm h-9 flex items-center font-semibold"
                    style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  >
                    £{chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee}
                  </div>
                ) : (
                  <Input
                    type="number"
                    placeholder="£"
                    className="h-9"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                )}
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Date</label>
                <Input
                  type="date"
                  className="h-9"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Method</label>
                <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                  <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Reference *</label>
              <Input
                placeholder="Bank ref, receipt #..."
                className="h-9"
                value={paymentData.reference}
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Notes</label>
              <Input
                placeholder="Optional notes..."
                className="h-9"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              />
            </div>
            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.pendingLight, border: `1px solid ${colors.pending}` }}>
                <p className="text-sm font-medium mb-2" style={{ color: colors.pending }}>⚠️ Possible Duplicate</p>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{duplicateWarning.message}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDuplicateWarning(null)} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddPayment} style={{ backgroundColor: colors.pending, color: '#000' }}>
                    Add Anyway
                  </Button>
                </div>
              </div>
            )}

            {/* Confirm Payment */}
            {showConfirmPayment && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.profitLight, border: `1px solid ${colors.profit}` }}>
                <p className="text-sm font-medium mb-2" style={{ color: colors.profit }}>Confirm Payment</p>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  Record payment of £{paymentData.payment_type === 'single' && matchForSelectedDate 
                    ? (chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee) 
                    : paymentData.amount} for {players.find(p => p.id === paymentData.player_id)?.player_name || 'player'}?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowConfirmPayment(false)} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddPayment} disabled={createPaymentMutation.isPending} style={{ background: colors.gradientProfit }}>
                    {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            {!duplicateWarning && !showConfirmPayment && (
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={resetPaymentDialog} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                  Cancel
                </Button>
                <Button onClick={checkForDuplicate} disabled={createPaymentMutation.isPending} style={{ background: colors.gradientProfit }}>
                  {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Record Payment
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ViewWrapper>
  );
  if (activeView === 'reports') return <ViewWrapper title="Reports" onBack={() => setActiveView('dashboard')} showReportsCategoryDropdown><FinancialReports transactions={transactions} memberships={memberships} budgets={[]} /></ViewWrapper>;


  const filteredActivity = activityFilter === 'all' 
    ? allActivity 
    : activityFilter === 'playerPayment'
    ? allActivity.filter(t => t.isPayment)
    : activityFilter === 'sponsorship'
    ? allActivity.filter(t => t.category_name === 'Sponsorship')
    : allActivity.filter(t => t.type === (activityFilter === 'income' ? 'Income' : 'Expense'));
  const recentTransactions = filteredActivity.slice(0, activityLimit);
  const owingPlayers = Object.entries(playerBalances)
    .filter(([_, data]) => data.balance < 0)
    .sort((a, b) => a[1].balance - b[1].balance)
    .slice(0, 6);

  return (
    <div className="min-h-screen pt-16 lg:pt-0 pb-12" style={{ backgroundColor: colors.background }}>
      {/* Top Header Bar */}
      <div className="sticky top-16 lg:top-0 z-30 backdrop-blur-xl" style={{ backgroundColor: `${colors.background}ee`, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: colors.gradientProfit }}
              >
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Club Finance</h1>
            </div>

            {/* Dropdown on right */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-xl"
                  style={{ background: colors.gradientProfit }}
                >
                  <ChevronDown className="w-5 h-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <DropdownMenuItem onSelect={() => setActiveView('payments')} className="cursor-pointer" style={{ color: colors.textSecondary }}>
                  <CreditCard className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
                  Manage Payments
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveView('reports')} className="cursor-pointer" style={{ color: colors.textSecondary }}>
                  <Receipt className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
                  Reports
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveView('memberships')} className="cursor-pointer" style={{ color: colors.textSecondary }}>
                  <Users className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
                  Memberships
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer" style={{ color: colors.textSecondary }}>
                  <Link to={createPageUrl('BankAccounts')}>
                    <Building2 className="w-4 h-4 mr-2" style={{ color: colors.accent }} />
                    Bank Accounts
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

        {/* Hero Balance Card - Mercury Style */}
        <Card className="border-0 overflow-hidden mb-6" style={{ background: colors.gradientCard, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Main Balance */}
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
                  Total Club Balance
                </p>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight" style={{ color: colors.textPrimary }}>
                    {formatCurrency(stats.balance)}
                  </span>
                  {stats.incomeTrend !== 0 && (
                    <Badge className="text-xs font-mono px-2 py-1" style={{ 
                      backgroundColor: stats.incomeTrend >= 0 ? colors.profitLight : colors.lossLight,
                      color: stats.incomeTrend >= 0 ? colors.textProfit : colors.textLoss
                    }}>
                      {stats.incomeTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.incomeTrend).toFixed(1)}% vs last month
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: colors.textMuted }}>Expected Income</p>
                    <p className="text-lg font-bold font-mono" style={{ color: colors.textSecondary }}>+{formatCurrency(stats.totalExpectedIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: colors.textMuted }}>Received Income</p>
                    <p className="text-lg font-bold font-mono" style={{ color: colors.textProfit }}>+{formatCurrency(stats.totalReceivedIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: colors.textMuted }}>Total Expenses</p>
                    <p className="text-lg font-bold font-mono" style={{ color: colors.textLoss }}>-{formatCurrency(stats.totalExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: colors.textMuted }}>Outstanding Fees</p>
                    <p className="text-lg font-bold font-mono" style={{ color: colors.pending }}>{formatCurrency(totalOutstandingAllFees)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: colors.textMuted }}>Outstanding Sponsorships</p>
                    <p className="text-lg font-bold font-mono" style={{ color: colors.pending }}>{formatCurrency(stats.sponsorshipOutstanding || 0)}</p>
                  </div>
                </div>
              </div>
              </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.pendingLight }}>
                <Receipt className="w-4 h-4" style={{ color: colors.pending }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Pending Approvals</p>
                <p className="text-sm font-bold font-mono" style={{ color: colors.pending }}>{playerPayments.filter(p => !p.verified).length}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.infoLight }}>
                <CreditCard className="w-4 h-4" style={{ color: colors.info }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Unallocated</p>
                <p className="text-sm font-bold font-mono" style={{ color: colors.info }}>{formatCurrency(unallocatedAmount)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.infoLight }}>
                <Users className="w-4 h-4" style={{ color: colors.info }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Members</p>
                <p className="text-sm font-bold font-mono" style={{ color: colors.textPrimary }}>{stats.activeMemberships}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.pendingLight }}>
                <CreditCard className="w-4 h-4" style={{ color: colors.pending }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Unpaid</p>
                <p className="text-sm font-bold font-mono" style={{ color: colors.pending }}>{playersWithOutstanding} players</p>
              </div>
            </div>
          </div>
        </div>

        

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={(open) => { if (!open) resetPaymentDialog(); else setShowPaymentDialog(true); }}>
          <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="[&>button]:text-white [&>button]:opacity-70 [&>button:hover]:opacity-100 max-w-md">
                            <DialogHeader>
                              <DialogTitle style={{ color: colors.textPrimary }}>Record Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 pt-2">
                              {/* Row 1: Player & Type */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Player *</label>
                                  <Select value={paymentData.player_id} onValueChange={(v) => setPaymentData({ ...paymentData, player_id: v, match_id: '' })}>
                                    <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {players.map(p => {
                                        const bal = playerBalances[p.id]?.balance || 0;
                                        return (
                                          <SelectItem key={p.id} value={p.id}>
                                            {p.player_name} {bal < 0 ? `(-£${Math.abs(bal)})` : ''}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Type</label>
                                  <Select value={paymentData.payment_type} onValueChange={(v) => setPaymentData({ ...paymentData, payment_type: v, match_id: '' })}>
                                    <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="single">Single</SelectItem>
                                      <SelectItem value="bulk">Bulk</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Match Date - only for single */}
                                                  {paymentData.payment_type === 'single' && (
                                                    <>
                                                      <div>
                                                        <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Match Date</label>
                                                        <Select 
                                                          value={paymentData.match_date} 
                                                          onValueChange={(v) => setPaymentData({ ...paymentData, match_date: v })}
                                                          disabled={!paymentData.player_id}
                                                        >
                                                          <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                                                            <SelectValue placeholder={paymentData.player_id ? "Select date" : "Select player first"} />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            {playerMatchDates.length === 0 ? (
                                                              <SelectItem value="none" disabled>No matches</SelectItem>
                                                            ) : (
                                                              playerMatchDates.map(date => (
                                                                <SelectItem key={date} value={date}>
                                                                  {format(new Date(date), 'dd MMM yyyy')}
                                                                </SelectItem>
                                                              ))
                                                            )}
                                                          </SelectContent>
                                                        </Select>
                                                      </div>
                                                      {matchForSelectedDate && (
                                                        <div className="grid grid-cols-3 gap-2">
                                                          <div className="col-span-2">
                                                            <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Match</label>
                                                            <div 
                                                              className="px-3 py-2 rounded-md text-sm h-9 flex items-center"
                                                              style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                                                            >
                                                              {matchForSelectedDate.team1_name} vs {matchForSelectedDate.team2_name}
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Fee</label>
                                                            <div 
                                                              className="px-3 py-2 rounded-md text-sm h-9 flex items-center font-semibold"
                                                              style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.textProfit }}
                                                            >
                                                              £{chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </>
                                                  )}

                              {/* Row 2: Amount, Date, Method */}
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Amount *</label>
                                  {paymentData.payment_type === 'single' && matchForSelectedDate ? (
                                    <div 
                                      className="px-3 py-2 rounded-md text-sm h-9 flex items-center font-semibold"
                                      style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                                    >
                                      £{chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee}
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      placeholder="£"
                                      className="h-9"
                                      value={paymentData.amount}
                                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                      style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                                    />
                                  )}
                                </div>
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Date</label>
                                  <Input
                                    type="date"
                                    className="h-9"
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Method</label>
                                  <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                                    <SelectTrigger className="h-9" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Cash">Cash</SelectItem>
                                      <SelectItem value="Bank Transfer">Bank</SelectItem>
                                      <SelectItem value="Card">Card</SelectItem>
                                      <SelectItem value="Online">Online</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Reference */}
                              <div>
                                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Reference *</label>
                                <Input
                                  placeholder="Bank ref, receipt #..."
                                  className="h-9"
                                  value={paymentData.reference}
                                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                                />
                              </div>

                              {/* Notes */}
                              <div>
                                <label className="text-[10px] font-medium uppercase tracking-wider mb-1 block" style={{ color: colors.textMuted }}>Notes</label>
                                <Input
                                  placeholder="Optional notes..."
                                  className="h-9"
                                  value={paymentData.notes}
                                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                                />
                              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.pendingLight, border: `1px solid ${colors.pending}` }}>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.pending }}>⚠️ Possible Duplicate</p>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>{duplicateWarning.message}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDuplicateWarning(null)} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddPayment} style={{ backgroundColor: colors.pending, color: '#000' }}>
                      Add Anyway
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirm Payment */}
              {showConfirmPayment && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.profitLight, border: `1px solid ${colors.profit}` }}>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.profit }}>Confirm Payment</p>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                    Record payment of £{paymentData.payment_type === 'single' && matchForSelectedDate 
                      ? (chargeForSelectedMatch?.amount || CLUB_CONFIG.finance.defaultMatchFee) 
                      : paymentData.amount} for {players.find(p => p.id === paymentData.player_id)?.player_name || 'player'}?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowConfirmPayment(false)} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddPayment} disabled={createPaymentMutation.isPending} style={{ background: colors.gradientProfit }}>
                      {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirm
                    </Button>
                  </div>
                </div>
              )}

              {!duplicateWarning && !showConfirmPayment && (
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={resetPaymentDialog} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    Cancel
                  </Button>
                  <Button onClick={checkForDuplicate} disabled={createPaymentMutation.isPending} style={{ background: colors.gradientProfit }}>
                    {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Record Payment
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Transactions - Clean list */}
            <Card className="border-0 overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Recent Activity</h3>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textSecondary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="playerPayment">Player Payments</SelectItem>
                    <SelectItem value="sponsorship">Sponsorships</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto" style={{ borderColor: colors.border }}>
                {recentTransactions.length === 0 ? (
                  <p className="text-center py-12 text-sm" style={{ color: colors.textMuted }}>No transactions yet</p>
                ) : (
                  recentTransactions.map(t => (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: t.type === 'Income' ? colors.profitLight : colors.lossLight }}
                        >
                          {t.type === 'Income' ? 
                            <ArrowUpRight className="w-5 h-5" style={{ color: colors.profit }} /> :
                            <ArrowDownRight className="w-5 h-5" style={{ color: colors.loss }} />
                          }
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{t.description || t.category_name || 'Transaction'}</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>{format(new Date(t.date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p 
                          className="font-semibold"
                          style={{ color: t.type === 'Income' ? colors.textProfit : colors.textLoss }}
                        >
                          {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <p className="text-xs" style={{ color: colors.textMuted }}>{t.category_name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Outstanding & Summary */}
          <div className="space-y-4">
            {/* Outstanding Fees - Clean card */}
            <Card className="border-0 overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Outstanding Fees</h3>
                <span className="text-lg font-bold" style={{ color: colors.pending }}>{formatCurrency(totalOutstandingAllFees)}</span>
              </div>
              
              <div className="p-4">
                {/* Collection progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{ color: colors.textMuted }}>Collection Rate</span>
                    <span style={{ color: colors.textSecondary }}>
                      {totalAllCharges > 0 
                        ? Math.round((totalAllPayments / totalAllCharges) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${totalAllCharges > 0 
                          ? Math.min((totalAllPayments / totalAllCharges) * 100, 100) 
                          : 0}%`,
                        background: colors.gradientProfit 
                      }}
                    />
                  </div>
                </div>

                {owingPlayers.length > 0 ? (
                  <div className="space-y-2">
                    {owingPlayers.slice(0, 5).map(([id, data]) => (
                      <div 
                        key={id}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors"
                        style={{ backgroundColor: colors.surfaceHover }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: colors.gradientPrimary, color: 'white' }}
                          >
                            {data.name ? data.name.charAt(0) : '?'}
                          </div>
                          <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{data.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: colors.textLoss }}>
                          {formatCurrency(Math.abs(data.balance))}
                        </span>
                      </div>
                    ))}
                    {owingPlayers.length > 5 && (
                      <button 
                        onClick={() => setActiveView('payments')}
                        className="w-full text-center py-2 text-sm font-medium rounded-lg transition-colors"
                        style={{ color: colors.accent }}
                      >
                        View all {owingPlayers.length} players →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
                      <TrendingUp className="w-6 h-6" style={{ color: colors.profit }} />
                    </div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>All caught up!</p>
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>No outstanding balances</p>
                  </div>
                )}
              </div>
            </Card>


            </div>
                          </div>

                    {/* Settings Dialog */}
                    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                      <DialogContent className="max-w-md" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <DialogHeader>
                          <DialogTitle style={{ color: colors.textPrimary }}>Payment Settings</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
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
                          </div>
                          </div>
                          );
            }

// Wrapper component for sub-views with finance theme
function ViewWrapper({ title, subtitle, onBack, children, extraButton, showReportsCategoryDropdown }) {
  const colors = getFinanceTheme();
  const [reportsCategory, setReportsCategory] = React.useState('overview');

  // Pass down the category to children if it's the reports view
  const childrenWithProps = showReportsCategoryDropdown 
    ? React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { reportCategory: reportsCategory, setReportCategory: setReportsCategory })
          : child
      )
    : children;

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
          style={{ color: colors.accent }}
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{title}</h1>
          <div className="flex items-center gap-2">
            {showReportsCategoryDropdown && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <DropdownMenuItem onClick={() => setReportsCategory('overview')} style={{ color: colors.textSecondary }}>
                    Overview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportsCategory('income')} style={{ color: colors.textSecondary }}>
                    <TrendingUp className="w-4 h-4 mr-2" style={{ color: '#10b981' }} />
                    Income
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportsCategory('expense')} style={{ color: colors.textSecondary }}>
                    <TrendingDown className="w-4 h-4 mr-2" style={{ color: '#ef4444' }} />
                    Expenses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportsCategory('matchFee')} style={{ color: colors.textSecondary }}>
                    <Receipt className="w-4 h-4 mr-2" style={{ color: '#3b82f6' }} />
                    Match Fees
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportsCategory('registrationFee')} style={{ color: colors.textSecondary }}>
                    <Users className="w-4 h-4 mr-2" style={{ color: '#8b5cf6' }} />
                    Registration Fees
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {extraButton}
          </div>
        </div>
        {subtitle && <p className="text-sm mb-4" style={{ color: colors.textMuted }}>{subtitle}</p>}
        {childrenWithProps}
      </div>
    </div>
  );
}