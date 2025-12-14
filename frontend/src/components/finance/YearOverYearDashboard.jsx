import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { getFinanceTheme, CLUB_CONFIG } from '../ClubConfig';

const colors = getFinanceTheme();

// Helper to get year from date
const getYear = (date) => {
  if (!date) return null;
  return new Date(date).getFullYear();
};

export default function YearOverYearDashboard({ transactions = [], playerPayments = [] }) {
  const [compareYear, setCompareYear] = useState('previous');

  // Get all years from data
  const years = useMemo(() => {
    const yearsSet = new Set();
    transactions.forEach(t => {
      if (t.date) yearsSet.add(getYear(t.date));
    });
    playerPayments.forEach(p => {
      if (p.payment_date) yearsSet.add(getYear(p.payment_date));
    });
    return Array.from(yearsSet).filter(y => y).sort((a, b) => b - a);
  }, [transactions, playerPayments]);

  const currentYear = new Date().getFullYear();
  const previousYear = years.find(y => y !== currentYear) || null;

  // Calculate stats per year
  const yearStats = useMemo(() => {
    const stats = {};
    
    years.forEach(y => {
      stats[y] = { income: 0, expenses: 0, net: 0, txCount: 0 };
    });

    transactions.filter(t => t.status === 'Completed').forEach(t => {
      if (!t.date) return;
      const y = getYear(t.date);
      if (!stats[y]) stats[y] = { income: 0, expenses: 0, net: 0, txCount: 0 };
      
      if (t.type === 'Income') {
        stats[y].income += t.amount || 0;
      } else {
        stats[y].expenses += t.amount || 0;
      }
      stats[y].txCount++;
    });

    playerPayments.forEach(p => {
      if (!p.payment_date) return;
      const y = getYear(p.payment_date);
      if (!stats[y]) stats[y] = { income: 0, expenses: 0, net: 0, txCount: 0 };
      stats[y].income += p.amount || 0;
      stats[y].txCount++;
    });

    // Calculate net
    Object.keys(stats).forEach(y => {
      stats[y].net = stats[y].income - stats[y].expenses;
    });

    return stats;
  }, [transactions, playerPayments, years]);

  // Current vs comparison year
  const currentStats = yearStats[currentYear] || { income: 0, expenses: 0, net: 0, txCount: 0 };
  const compareYearKey = compareYear === 'previous' ? previousYear : parseInt(compareYear);
  const compareStats = compareYearKey ? (yearStats[compareYearKey] || { income: 0, expenses: 0, net: 0, txCount: 0 }) : null;

  // Calculate changes
  const calcChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous * 100);
  };

  const incomeChange = compareStats ? calcChange(currentStats.income, compareStats.income) : null;
  const expenseChange = compareStats ? calcChange(currentStats.expenses, compareStats.expenses) : null;
  const netChange = compareStats ? calcChange(currentStats.net, compareStats.net) : null;

  // Chart data - monthly comparison
  const monthlyComparison = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month, idx) => ({
      month,
      current: 0,
      previous: 0,
    }));

    const addToMonth = (date, amount, isCurrent) => {
      const d = new Date(date);
      const monthIdx = d.getMonth();
      if (isCurrent) {
        data[monthIdx].current += amount;
      } else {
        data[monthIdx].previous += amount;
      }
    };

    transactions.filter(t => t.status === 'Completed' && t.type === 'Income').forEach(t => {
      if (!t.date) return;
      const y = getYear(t.date);
      if (y === currentYear) addToMonth(t.date, t.amount || 0, true);
      else if (y === compareYearKey) addToMonth(t.date, t.amount || 0, false);
    });

    playerPayments.forEach(p => {
      if (!p.payment_date) return;
      const y = getYear(p.payment_date);
      if (y === currentYear) addToMonth(p.payment_date, p.amount || 0, true);
      else if (y === compareYearKey) addToMonth(p.payment_date, p.amount || 0, false);
    });

    return data;
  }, [transactions, playerPayments, currentYear, compareYearKey]);

  // Year-over-year bar chart data
  const yoyBarData = useMemo(() => {
    return years.slice(0, 5).reverse().map(y => ({
      year: y.toString(),
      income: yearStats[y]?.income || 0,
      expenses: yearStats[y]?.expenses || 0,
      net: yearStats[y]?.net || 0,
    }));
  }, [years, yearStats]);

  const formatCurrency = (v) => `${CLUB_CONFIG.finance.currency}${v?.toLocaleString('en-GB', { minimumFractionDigits: 0 }) || 0}`;

  const ChangeIndicator = ({ value, inverted = false }) => {
    if (value === null) return <span className="text-xs" style={{ color: colors.textMuted }}>N/A</span>;
    const isPositive = inverted ? value < 0 : value > 0;
    const isNeutral = Math.abs(value) < 0.1;
    
    if (isNeutral) return <Minus className="w-4 h-4" style={{ color: colors.textMuted }} />;
    
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4" style={{ color: colors.profit }} />
        ) : (
          <TrendingDown className="w-4 h-4" style={{ color: colors.loss }} />
        )}
        <span className="text-xs font-medium" style={{ color: isPositive ? colors.profit : colors.loss }}>
          {Math.abs(value).toFixed(1)}%
        </span>
      </div>
    );
  };

  if (years.length === 0) {
    return (
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
          <p style={{ color: colors.textMuted }}>No financial data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Year-over-Year Analysis</h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Current: {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: colors.textMuted }}>Compare with:</span>
          <Select value={compareYear} onValueChange={setCompareYear}>
            <SelectTrigger className="w-36" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous Year</SelectItem>
              {years.filter(y => y !== currentYear).map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>Total Income</p>
                <p className="text-2xl font-bold font-mono" style={{ color: colors.textProfit }}>
                  {formatCurrency(currentStats.income)}
                </p>
                {compareStats && (
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    vs {formatCurrency(compareStats.income)} ({compareYearKey})
                  </p>
                )}
              </div>
              <ChangeIndicator value={incomeChange} />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>Total Expenses</p>
                <p className="text-2xl font-bold font-mono" style={{ color: colors.textLoss }}>
                  {formatCurrency(currentStats.expenses)}
                </p>
                {compareStats && (
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    vs {formatCurrency(compareStats.expenses)} ({compareYearKey})
                  </p>
                )}
              </div>
              <ChangeIndicator value={expenseChange} inverted />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>Net Position</p>
                <p className="text-2xl font-bold font-mono" style={{ color: currentStats.net >= 0 ? colors.textProfit : colors.textLoss }}>
                  {formatCurrency(currentStats.net)}
                </p>
                {compareStats && (
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    vs {formatCurrency(compareStats.net)} ({compareYearKey})
                  </p>
                )}
              </div>
              <ChangeIndicator value={netChange} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Comparison Line Chart */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: colors.textPrimary }}>Monthly Income Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="month" stroke={colors.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={colors.textMuted} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                  labelStyle={{ color: colors.textPrimary }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Legend />
                <Line type="monotone" dataKey="current" name={currentYear.toString()} stroke={colors.profit} strokeWidth={2} dot={{ r: 3 }} />
                {compareYearKey && (
                  <Line type="monotone" dataKey="previous" name={compareYearKey.toString()} stroke={colors.textMuted} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Year-over-Year Bar Chart */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ color: colors.textPrimary }}>Yearly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yoyBarData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="year" stroke={colors.textMuted} tick={{ fontSize: 10 }} />
                <YAxis stroke={colors.textMuted} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                  labelStyle={{ color: colors.textPrimary }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill={colors.profit} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={colors.loss} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Year Summary Table */}
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ color: colors.textPrimary }}>Year Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th className="text-left py-3 px-3 text-xs font-medium" style={{ color: colors.textMuted }}>Year</th>
                  <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: colors.textMuted }}>Income</th>
                  <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: colors.textMuted }}>Expenses</th>
                  <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: colors.textMuted }}>Net</th>
                  <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: colors.textMuted }}>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {years.map(y => {
                  const stats = yearStats[y];
                  const isCurrent = y === currentYear;
                  return (
                    <tr key={y} style={{ borderBottom: `1px solid ${colors.border}` }} className="hover:bg-white/5">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: colors.textPrimary }}>{y}</span>
                          {isCurrent && (
                            <Badge className="text-[10px]" style={{ backgroundColor: colors.profitLight, color: colors.profit }}>Current</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: colors.textProfit }}>{formatCurrency(stats.income)}</td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: colors.textLoss }}>{formatCurrency(stats.expenses)}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color: stats.net >= 0 ? colors.textProfit : colors.textLoss }}>
                        {formatCurrency(stats.net)}
                      </td>
                      <td className="py-3 px-3 text-right" style={{ color: colors.textSecondary }}>{stats.txCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}