import React, { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, PieChart, BarChart3, Printer, Users, AlertCircle, CheckCircle, Clock, Target
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import ReportCategorySelector from './ReportCategorySelector';
import IncomeDetailView from './IncomeDetailView';
import ExpenseDetailView from './ExpenseDetailView';
import MatchFeeDetailView from './MatchFeeDetailView';
import RegistrationFeeDetailView from './RegistrationFeeDetailView';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { toast } from 'sonner';
import { CLUB_CONFIG, getFinanceTheme } from '../ClubConfig';

const colors = getFinanceTheme();

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <p className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: colors.textSecondary }}>{entry.name}:</span>
          <span className="font-bold" style={{ color: colors.textPrimary }}>£{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function FinancialReports({ transactions = [], memberships = [], reportCategory, setReportCategory }) {
  const [period, setPeriod] = useState('thisYear');
  // Use props if provided (from ViewWrapper dropdown), otherwise internal state
  const [internalCategory, setInternalCategory] = useState(null);
  const selectedCategory = reportCategory !== undefined ? reportCategory : internalCategory;
  const setSelectedCategory = setReportCategory || setInternalCategory;
  const reportRef = useRef(null);

  // Fetch player data
  const { data: playerCharges = [] } = useQuery({
    queryKey: ['playerChargesReport'],
    queryFn: () => api.entities.PlayerCharge.list('-charge_date'),
  });

  const { data: playerPayments = [] } = useQuery({
    queryKey: ['playerPaymentsReport'],
    queryFn: () => api.entities.PlayerPayment.list('-payment_date'),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['playersReport'],
    queryFn: () => api.entities.TeamPlayer.list('player_name'),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matchesReport'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date'),
  });

  // Date range calculation
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'thisMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last3Months': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last6Months': return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'thisYear': return { start: startOfYear(now), end: endOfYear(now) };
      default: return { start: new Date('2020-01-01'), end: now };
    }
  }, [period]);

  // Filter transactions by period
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, dateRange) && t.status === 'Completed';
    });
  }, [transactions, dateRange]);

  // Calculate player balances (owes/credit)
  const playerBalances = useMemo(() => {
    const balances = {};
    players.forEach(p => {
      balances[p.id] = { id: p.id, name: p.player_name, charges: 0, payments: 0, balance: 0 };
    });
    
    playerCharges.filter(c => !c.voided).forEach(c => {
      if (balances[c.player_id]) {
        balances[c.player_id].charges += c.amount || 0;
      }
    });
    
    playerPayments.forEach(p => {
      if (balances[p.player_id]) {
        balances[p.player_id].payments += p.amount || 0;
      }
    });
    
    Object.values(balances).forEach(b => {
      b.balance = b.payments - b.charges; // Negative = owes, Positive = credit
    });
    
    return balances;
  }, [playerCharges, playerPayments, players]);

  // Players who owe money (sorted by amount)
  const playersOwing = useMemo(() => {
    return Object.values(playerBalances)
      .filter(p => p.balance < 0)
      .sort((a, b) => a.balance - b.balance); // Most owing first
  }, [playerBalances]);

  // Players with credit
  const playersWithCredit = useMemo(() => {
    return Object.values(playerBalances)
      .filter(p => p.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [playerBalances]);

  // Pending payments (unverified)
  const pendingPayments = useMemo(() => {
    return playerPayments.filter(p => !p.verified).map(p => ({
      ...p,
      playerName: players.find(pl => pl.id === p.player_id)?.player_name || 'Unknown'
    }));
  }, [playerPayments, players]);

  // Key metrics
  const metrics = useMemo(() => {
    const txIncome = filteredTx.filter(t => t.type === 'Income').reduce((s, t) => s + (t.amount || 0), 0);
    const txExpenses = filteredTx.filter(t => t.type === 'Expense').reduce((s, t) => s + (t.amount || 0), 0);
    
    // Include player payments in income
    const periodPayments = playerPayments.filter(p => {
      if (!p.payment_date) return false;
      return isWithinInterval(parseISO(p.payment_date), dateRange);
    });
    const playerPaymentTotal = periodPayments.reduce((s, p) => s + (p.amount || 0), 0);
    
    const totalIncome = txIncome + playerPaymentTotal;
    const totalExpenses = txExpenses;
    const net = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (net / totalIncome * 100) : 0;
    
    // Collection stats
    const totalOwed = playersOwing.reduce((s, p) => s + Math.abs(p.balance), 0);
    const totalCollected = playerPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalCharged = playerCharges.filter(c => !c.voided).reduce((s, c) => s + (c.amount || 0), 0);
    const collectionRate = totalCharged > 0 ? (totalCollected / totalCharged * 100) : 0;
    
    return { 
      totalIncome, totalExpenses, net, margin, 
      totalOwed, totalCollected, collectionRate,
      playersOwingCount: playersOwing.length,
      pendingCount: pendingPayments.length
    };
  }, [filteredTx, playerPayments, playerCharges, playersOwing, pendingPayments, dateRange]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const key = format(monthStart, 'yyyy-MM');
      months[key] = { month: format(monthStart, 'MMM'), income: 0, expenses: 0 };
    }
    
    // Add transaction income/expenses
    filteredTx.forEach(t => {
      const key = format(parseISO(t.date), 'yyyy-MM');
      if (months[key]) {
        if (t.type === 'Income') months[key].income += t.amount || 0;
        else months[key].expenses += t.amount || 0;
      }
    });
    
    // Add player payments to income
    playerPayments.forEach(p => {
      if (!p.payment_date) return;
      const key = format(parseISO(p.payment_date), 'yyyy-MM');
      if (months[key]) {
        months[key].income += p.amount || 0;
      }
    });
    
    return Object.values(months);
  }, [filteredTx, playerPayments]);

  // Income by category
  const incomeByCategory = useMemo(() => {
    const cats = {};
    
    // Transaction income
    filteredTx.filter(t => t.type === 'Income').forEach(t => {
      const cat = t.category_name || 'Other';
      cats[cat] = (cats[cat] || 0) + (t.amount || 0);
    });
    
    // Player payments as Match Fees
    const periodPayments = playerPayments.filter(p => {
      if (!p.payment_date) return false;
      return isWithinInterval(parseISO(p.payment_date), dateRange);
    });
    const matchFeeTotal = periodPayments.reduce((s, p) => s + (p.amount || 0), 0);
    if (matchFeeTotal > 0) {
      cats['Match Fees'] = (cats['Match Fees'] || 0) + matchFeeTotal;
    }
    
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTx, playerPayments, dateRange]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const cats = {};
    filteredTx.filter(t => t.type === 'Expense').forEach(t => {
      const cat = t.category_name || 'Other';
      cats[cat] = (cats[cat] || 0) + (t.amount || 0);
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  // Export functions
  const exportCSV = () => {
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Club transactions (expenses/income)
    const txRows = filteredTx.map(t => [
      escapeCSV(t.date),
      escapeCSV(t.type),
      escapeCSV(t.category_name || 'Other'),
      escapeCSV(t.description || ''),
      escapeCSV(t.amount),
      escapeCSV(t.payment_method || ''),
      escapeCSV(t.paid_to || t.received_from || ''),
      escapeCSV(t.reference || ''),
      escapeCSV(t.status || ''),
      escapeCSV(t.created_by || ''),
      '', '', '', '' // Empty player-specific columns
    ].join(','));
    
    // Player payments within period - with full details
    const periodPayments = playerPayments.filter(p => {
      if (!p.payment_date) return false;
      return isWithinInterval(parseISO(p.payment_date), dateRange);
    });
    
    const paymentRows = periodPayments.map(p => {
      const player = players.find(pl => pl.id === p.player_id);
      const playerName = player?.player_name || 'Unknown';
      const playerEmail = player?.email || '';
      const playerPhone = player?.phone || '';
      
      // Find related charge to get match info
      const relatedCharge = playerCharges.find(c => c.player_id === p.player_id && c.reference_id);
      const match = relatedCharge ? matches.find(m => m.id === relatedCharge.reference_id) : null;
      const matchInfo = match ? `${match.team1_name} vs ${match.team2_name} (${match.match_date ? format(parseISO(match.match_date), 'dd MMM yyyy') : 'No date'})` : '';
      
      return [
        escapeCSV(p.payment_date),
        'Income',
        'Match Fee',
        escapeCSV(`Player Payment - ${playerName}`),
        escapeCSV(p.amount),
        escapeCSV(p.payment_method || ''),
        escapeCSV(playerName),
        escapeCSV(p.reference || ''),
        escapeCSV(p.verified ? 'Verified' : 'Pending'),
        escapeCSV(p.recorded_by || p.created_by || ''),
        escapeCSV(playerEmail),
        escapeCSV(playerPhone),
        escapeCSV(matchInfo),
        escapeCSV(p.notes || '')
      ].join(',');
    });
    
    const allRows = [...txRows, ...paymentRows].sort((a, b) => {
      const dateA = a.split(',')[0];
      const dateB = b.split(',')[0];
      return dateB.localeCompare(dateA);
    });
    
    const headers = 'Date,Type,Category,Description,Amount,Payment Method,Paid To/Player,Reference,Status,Recorded By,Player Email,Player Phone,Match Details,Notes';
    const csv = [headers, ...allRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complete_finance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Complete report exported with all details');
  };

  const exportPDF = () => {
    window.print();
  };

  // If a category is selected (not 'overview'), show the detail view
  if (selectedCategory && selectedCategory !== 'overview') {
    if (selectedCategory === 'income') {
      return <IncomeDetailView onBack={() => setSelectedCategory('overview')} dateRange={dateRange} />;
    }
    if (selectedCategory === 'expense') {
      return <ExpenseDetailView onBack={() => setSelectedCategory('overview')} dateRange={dateRange} />;
    }
    if (selectedCategory === 'matchFee') {
      return <MatchFeeDetailView onBack={() => setSelectedCategory('overview')} dateRange={dateRange} />;
    }
    if (selectedCategory === 'registrationFee') {
      return <RegistrationFeeDetailView onBack={() => setSelectedCategory('overview')} dateRange={dateRange} />;
    }
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header with Period Filter & Category Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
        </p>
        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="last6Months">Last 6 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCSV} style={{ borderColor: colors.border, color: colors.textSecondary }}>
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={exportPDF} style={{ borderColor: colors.border, color: colors.textSecondary }}>
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Income</p>
                <p className="text-lg font-bold" style={{ color: '#10b981' }}>£{metrics.totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ef444420' }}>
                <TrendingDown className="w-5 h-5" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Expenses</p>
                <p className="text-lg font-bold" style={{ color: '#ef4444' }}>£{metrics.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: metrics.net >= 0 ? '#10b98120' : '#ef444420' }}>
                <Wallet className="w-5 h-5" style={{ color: metrics.net >= 0 ? '#10b981' : '#ef4444' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Net</p>
                <p className="text-lg font-bold" style={{ color: metrics.net >= 0 ? '#10b981' : '#ef4444' }}>
                  {metrics.net >= 0 ? '+' : ''}£{metrics.net.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                <AlertCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Outstanding</p>
                <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>£{metrics.totalOwed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b82f620' }}>
                <Target className="w-5 h-5" style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Collection</p>
                <p className="text-lg font-bold" style={{ color: '#3b82f6' }}>{metrics.collectionRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <BarChart3 className="w-4 h-4" style={{ color: colors.accent }} /> Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="month" stroke={colors.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={colors.textMuted} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collection Rate Gauge */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Target className="w-4 h-4" style={{ color: colors.accent }} /> Match Fee Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* Progress Circle */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke={colors.border} strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#10b981" strokeWidth="10"
                    strokeDasharray={`${metrics.collectionRate * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{metrics.collectionRate.toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Collected</span>
                  <span className="font-bold" style={{ color: '#10b981' }}>£{metrics.totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Outstanding</span>
                  <span className="font-bold" style={{ color: '#f59e0b' }}>£{metrics.totalOwed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Players Owing</span>
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{metrics.playersOwingCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Pending Approval</span>
                  <Badge style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>{metrics.pendingCount}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdowns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between" style={{ color: colors.textPrimary }}>
              <span className="flex items-center gap-2"><PieChart className="w-4 h-4" style={{ color: '#10b981' }} /> Income Sources</span>
              <Badge style={{ backgroundColor: '#10b98120', color: '#10b981' }}>£{metrics.totalIncome.toLocaleString()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: colors.textMuted }}>No income in this period</p>
            ) : (
              <div className="space-y-3">
                {incomeByCategory.slice(0, 6).map((c, i) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ color: colors.textSecondary }}>{c.name}</span>
                      </div>
                      <span className="font-medium" style={{ color: colors.textPrimary }}>£{c.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${(c.value / metrics.totalIncome) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between" style={{ color: colors.textPrimary }}>
              <span className="flex items-center gap-2"><PieChart className="w-4 h-4" style={{ color: '#ef4444' }} /> Expense Categories</span>
              <Badge style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>£{metrics.totalExpenses.toLocaleString()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: colors.textMuted }}>No expenses in this period</p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.slice(0, 6).map((c, i) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2'][i % 6] }} />
                        <span style={{ color: colors.textSecondary }}>{c.name}</span>
                      </div>
                      <span className="font-medium" style={{ color: colors.textPrimary }}>£{c.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${(c.value / metrics.totalExpenses) * 100}%`, backgroundColor: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2'][i % 6] }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Players Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Players Owing */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between" style={{ color: colors.textPrimary }}>
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" style={{ color: '#f59e0b' }} /> Players Owing</span>
              <Badge style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>{playersOwing.length} players</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playersOwing.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: '#10b981' }} />
                <p className="font-medium" style={{ color: colors.textPrimary }}>All caught up!</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>No outstanding balances</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {playersOwing.slice(0, 10).map(p => (
                  <div 
                    key={p.id} 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: colors.surfaceHover }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                      >
                        {p.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{p.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: '#ef4444' }}>-£{Math.abs(p.balance).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between" style={{ color: colors.textPrimary }}>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: '#3b82f6' }} /> Pending Approval</span>
              <Badge style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>{pendingPayments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: '#10b981' }} />
                <p className="font-medium" style={{ color: colors.textPrimary }}>All verified!</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>No pending payments</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingPayments.slice(0, 10).map(p => (
                  <div 
                    key={p.id} 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: colors.surfaceHover }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
                      >
                        {p.playerName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <span className="font-medium text-sm block" style={{ color: colors.textPrimary }}>{p.playerName}</span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>
                          {p.payment_date ? format(parseISO(p.payment_date), 'dd MMM') : 'No date'}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold" style={{ color: '#10b981' }}>£{(p.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Players with Credit */}
      {playersWithCredit.length > 0 && (
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between" style={{ color: colors.textPrimary }}>
              <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} /> Players with Credit</span>
              <Badge style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                £{playersWithCredit.reduce((s, p) => s + p.balance, 0).toLocaleString()} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {playersWithCredit.slice(0, 8).map(p => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.surfaceHover }}
                >
                  <span className="font-medium text-sm truncate" style={{ color: colors.textPrimary }}>{p.name}</span>
                  <span className="font-bold text-sm" style={{ color: '#10b981' }}>+£{p.balance}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FinancialReports;