import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { getFinanceTheme, CLUB_CONFIG } from '../ClubConfig';
import { 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const colors = getFinanceTheme();
const CHART_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fb923c', '#f97316', '#ea580c', '#dc2626', '#b91c1c'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
          <span style={{ color: colors.textSecondary }}>{entry.name}:</span>
          <span className="font-bold" style={{ color: colors.textPrimary }}>£{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExpenseDetailView({ onBack, dateRange }) {
  const [selectedSeason, setSelectedSeason] = useState('active');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['expenseTransactions'],
    queryFn: () => api.entities.Transaction.filter({ type: 'Expense', status: 'Completed' }, '-date'),
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-start_date'),
  });

  const activeSeason = seasons.find(s => s.status === 'Active' || s.is_current);

  const currentSeason = useMemo(() => {
    if (selectedSeason === 'active') return activeSeason;
    return seasons.find(s => s.id === selectedSeason);
  }, [selectedSeason, seasons, activeSeason]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Filter by season
    if (selectedSeason !== 'all' && currentSeason?.start_date && currentSeason?.end_date) {
      const seasonStart = parseISO(currentSeason.start_date);
      const seasonEnd = parseISO(currentSeason.end_date);
      filtered = filtered.filter(t => {
        if (!t.date) return false;
        const tDate = parseISO(t.date);
        return tDate >= seasonStart && tDate <= seasonEnd;
      });
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => (t.category_name || 'Other') === selectedCategory);
    }
    
    return filtered;
  }, [transactions, currentSeason, selectedSeason, selectedCategory]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category_name || 'Other'))];
    return cats.sort();
  }, [transactions]);

  const totalExpense = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const byCategory = useMemo(() => {
    const cats = {};
    filteredTransactions.forEach(t => {
      const cat = t.category_name || 'Other';
      cats[cat] = (cats[cat] || 0) + (t.amount || 0);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  const pieData = useMemo(() => byCategory.map(([name, value]) => ({ name, value })), [byCategory]);

  const monthlyData = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const key = format(monthStart, 'yyyy-MM');
      months[key] = { month: format(monthStart, 'MMM'), amount: 0 };
    }
    filteredTransactions.forEach(t => {
      if (!t.date) return;
      const key = format(parseISO(t.date), 'yyyy-MM');
      if (months[key]) months[key].amount += t.amount || 0;
    });
    return Object.values(months);
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Expense Details</h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>All club expense transactions</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[140px] h-9" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <SelectItem value="all" style={{ color: colors.textSecondary }}>All Time</SelectItem>
              {activeSeason && (
                <SelectItem value="active" style={{ color: colors.textPrimary }}>
                  <span className="flex items-center gap-2">
                    {activeSeason.name}
                    <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>Active</Badge>
                  </span>
                </SelectItem>
              )}
              {seasons.filter(s => s.id !== activeSeason?.id).map(s => (
                <SelectItem key={s.id} value={s.id} style={{ color: colors.textSecondary }}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>Total</p>
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              {CLUB_CONFIG.finance.currency}{totalExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expense by Category Pie Chart */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <PieChart className="w-4 h-4" style={{ color: '#ef4444' }} /> Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: colors.textMuted }}>No data available</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160} className="flex-shrink-0">
                  <RechartsPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex-1 w-full space-y-2">
                  {pieData.slice(0, 5).map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate" style={{ color: colors.textSecondary }}>{item.name}</span>
                      </div>
                      <span className="font-medium flex-shrink-0" style={{ color: colors.textPrimary }}>£{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend Bar Chart */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#ef4444' }} /> Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="month" stroke={colors.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={colors.textMuted} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {byCategory.slice(0, 4).map(([cat, amount], i) => (
          <Card key={cat} style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <p className="text-xs truncate" style={{ color: colors.textMuted }}>{cat}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: '#ef4444' }}>
                {CLUB_CONFIG.finance.currency}{amount.toLocaleString()}
              </p>
              <p className="text-[10px]" style={{ color: colors.textMuted }}>
                {totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions List */}
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
              Transactions ({filteredTransactions.length})
            </CardTitle>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textSecondary }}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <SelectItem value="all" style={{ color: colors.textSecondary }}>All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} style={{ color: colors.textSecondary }}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-[500px] overflow-y-auto" style={{ borderColor: colors.border }}>
            {filteredTransactions.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: colors.textMuted }}>No expense transactions found</p>
            ) : (
              filteredTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                      {t.description || t.category_name || 'Expense'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        {t.date ? format(parseISO(t.date), 'dd MMM yyyy') : '-'}
                      </span>
                      {t.paid_to && (
                        <>
                          <span className="text-xs" style={{ color: colors.textMuted }}>•</span>
                          <span className="text-xs" style={{ color: colors.textMuted }}>Paid to: {t.paid_to}</span>
                        </>
                      )}
                      {t.payment_method && (
                        <>
                          <span className="text-xs" style={{ color: colors.textMuted }}>•</span>
                          <span className="text-xs" style={{ color: colors.textMuted }}>{t.payment_method}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold" style={{ color: '#ef4444' }}>
                      -{CLUB_CONFIG.finance.currency}{(t.amount || 0).toLocaleString()}
                    </p>
                    <Badge className="text-[10px]" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                      {t.category_name || 'Other'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}