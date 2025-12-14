import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, ComposedChart, 
  RadialBarChart, RadialBar, Treemap, FunnelChart, Funnel, LabelList
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react';

const COLORS = ['#059669', '#dc2626', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

// Custom label for bar charts
const renderBarLabel = (props) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" textAnchor="middle" fontSize={10} fontWeight={500}>
      £{(value / 1000).toFixed(1)}k
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: £{entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinanceCharts({ transactions }) {
  // Monthly Income vs Expense - memoized
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = (transactions || []).filter(t => {
        const tDate = new Date(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd }) && t.status === 'Completed';
      });

      const income = monthTransactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      months.push({
        month: format(date, 'MMM'),
        income,
        expense,
        profit: income - expense
      });
    }
    return months;
  }, [transactions]);

  // Category breakdown - memoized
  const incomeByCategory = useMemo(() => {
    const categoryTotals = {};
    (transactions || [])
      .filter(t => t.type === 'Income' && t.status === 'Completed')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.amount || 0);
      });
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const categoryTotals = {};
    (transactions || [])
      .filter(t => t.type === 'Expense' && t.status === 'Completed')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.amount || 0);
      });
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Recurring vs One-time data
  const recurringData = useMemo(() => {
    const completed = (transactions || []).filter(t => t.status === 'Completed');
    const recurringIncome = completed.filter(t => t.type === 'Income' && t.is_recurring).reduce((s, t) => s + (t.amount || 0), 0);
    const oneTimeIncome = completed.filter(t => t.type === 'Income' && !t.is_recurring).reduce((s, t) => s + (t.amount || 0), 0);
    const recurringExpense = completed.filter(t => t.type === 'Expense' && t.is_recurring).reduce((s, t) => s + (t.amount || 0), 0);
    const oneTimeExpense = completed.filter(t => t.type === 'Expense' && !t.is_recurring).reduce((s, t) => s + (t.amount || 0), 0);
    return { recurringIncome, oneTimeIncome, recurringExpense, oneTimeExpense };
  }, [transactions]);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const methods = {};
    (transactions || []).filter(t => t.status === 'Completed').forEach(t => {
      const method = t.payment_method || 'Unknown';
      methods[method] = (methods[method] || 0) + (t.amount || 0);
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Top income/expense items
  const topItems = useMemo(() => {
    const completed = (transactions || []).filter(t => t.status === 'Completed');
    const topIncome = [...completed.filter(t => t.type === 'Income')].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const topExpense = [...completed.filter(t => t.type === 'Expense')].sort((a, b) => b.amount - a.amount).slice(0, 5);
    return { topIncome, topExpense };
  }, [transactions]);

  // Cumulative balance over time
  const cumulativeData = useMemo(() => {
    const sorted = [...(transactions || [])]
      .filter(t => t.status === 'Completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let balance = 0;
    const data = [];
    const monthlyBal = {};
    
    sorted.forEach(t => {
      const month = format(new Date(t.date), 'MMM yy');
      if (t.type === 'Income') balance += t.amount || 0;
      else balance -= t.amount || 0;
      monthlyBal[month] = balance;
    });
    
    Object.entries(monthlyBal).forEach(([month, bal]) => {
      data.push({ month, balance: bal });
    });
    
    return data.slice(-12);
  }, [transactions]);

  // Category data for treemap
  const treemapData = useMemo(() => {
    return expenseByCategory.map((item, idx) => ({
      name: item.name,
      size: item.value,
      fill: COLORS[idx % COLORS.length]
    }));
  }, [expenseByCategory]);

  // Waterfall data for cash flow
  const waterfallData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    
    // Starting balance
    data.push({ name: 'Start', value: 0, cumulative: 0, fill: '#64748b' });
    
    // Add income
    const totalIncome = (transactions || []).filter(t => t.type === 'Income' && t.status === 'Completed').reduce((s, t) => s + (t.amount || 0), 0);
    cumulative += totalIncome;
    data.push({ name: 'Income', value: totalIncome, cumulative, fill: '#059669' });
    
    // Add major expense categories
    const expenseCategories = ['Player Wages', 'Equipment', 'Ground Maintenance', 'Other Expenses'];
    const categoryTotals = {};
    (transactions || []).filter(t => t.type === 'Expense' && t.status === 'Completed').forEach(t => {
      const cat = expenseCategories.includes(t.category) ? t.category : 'Other Expenses';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });
    
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      cumulative -= val;
      data.push({ name: cat.split(' ')[0], value: -val, cumulative, fill: '#dc2626' });
    });
    
    // Final balance
    data.push({ name: 'Balance', value: cumulative, cumulative, fill: cumulative >= 0 ? '#059669' : '#dc2626', isTotal: true });
    
    return data;
  }, [transactions]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Monthly Trend - Enhanced */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                stroke="#64748b" 
                tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} 
                tick={{ fontSize: 11 }}
                width={50}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="income" content={renderBarLabel} />
              </Bar>
              <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="expense" content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Income by Category - Compact with data table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Income by Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {incomeByCategory.length > 0 ? (
            <div className="space-y-3">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-2 text-center py-2 bg-emerald-50 rounded-lg">
                <div>
                  <p className="text-xl font-bold text-emerald-700">£{(incomeByCategory.reduce((s, c) => s + c.value, 0) / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-emerald-600">Total Income</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700">{incomeByCategory.length}</p>
                  <p className="text-xs text-emerald-600">Categories</p>
                </div>
              </div>
              {/* Category breakdown list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {incomeByCategory.map((cat, idx) => {
                  const total = incomeByCategory.reduce((s, c) => s + c.value, 0);
                  const percent = total > 0 ? (cat.value / total * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate font-medium">{cat.name}</span>
                          <span className="font-bold text-emerald-700 ml-2">£{cat.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{percent}% of total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">No income data</div>
          )}
        </CardContent>
      </Card>

      {/* Expense by Category - Compact with data table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {expenseByCategory.length > 0 ? (
            <div className="space-y-3">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-2 text-center py-2 bg-red-50 rounded-lg">
                <div>
                  <p className="text-xl font-bold text-red-700">£{(expenseByCategory.reduce((s, c) => s + c.value, 0) / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-red-600">Total Expenses</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-700">{expenseByCategory.length}</p>
                  <p className="text-xs text-red-600">Categories</p>
                </div>
              </div>
              {/* Category breakdown list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {expenseByCategory.map((cat, idx) => {
                  const total = expenseByCategory.reduce((s, c) => s + c.value, 0);
                  const percent = total > 0 ? (cat.value / total * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate font-medium">{cat.name}</span>
                          <span className="font-bold text-red-700 ml-2">£{cat.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{percent}% of total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">No expense data</div>
          )}
        </CardContent>
      </Card>

      {/* Income vs Expense Comparison - Radial */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Income vs Expense Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalInc = incomeByCategory.reduce((s, c) => s + c.value, 0);
            const totalExp = expenseByCategory.reduce((s, c) => s + c.value, 0);
            const max = Math.max(totalInc, totalExp);
            const data = [
              { name: 'Income', value: totalInc, fill: '#059669', percent: max > 0 ? (totalInc / max * 100) : 0 },
              { name: 'Expenses', value: totalExp, fill: '#dc2626', percent: max > 0 ? (totalExp / max * 100) : 0 }
            ];
            const savings = totalInc - totalExp;
            const savingsRate = totalInc > 0 ? (savings / totalInc * 100).toFixed(1) : 0;
            return (
              <div className="space-y-4">
                <div className="text-center py-3 rounded-lg" style={{ backgroundColor: savings >= 0 ? '#ecfdf5' : '#fef2f2' }}>
                  <p className="text-2xl font-bold" style={{ color: savings >= 0 ? '#059669' : '#dc2626' }}>
                    {savings >= 0 ? '+' : ''}£{savings.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: savings >= 0 ? '#059669' : '#dc2626' }}>
                    {savings >= 0 ? 'Net Savings' : 'Net Loss'} ({savingsRate}%)
                  </p>
                </div>
                <div className="space-y-3">
                  {data.map(item => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold" style={{ color: item.fill }}>£{item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${item.percent}%`, backgroundColor: item.fill }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Monthly Trend Mini Sparklines */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Income trend */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-emerald-700">Income Trend</span>
                <span className="text-sm font-bold text-emerald-700">
                  £{(monthlyData.reduce((s, m) => s + m.income, 0) / 1000).toFixed(1)}k total
                </span>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeSparkline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="income" stroke="#059669" fill="url(#incomeSparkline)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Expense trend */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-700">Expense Trend</span>
                <span className="text-sm font-bold text-red-700">
                  £{(monthlyData.reduce((s, m) => s + m.expense, 0) / 1000).toFixed(1)}k total
                </span>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="expenseSparkline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="expense" stroke="#dc2626" fill="url(#expenseSparkline)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Profit trend */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-indigo-700">Profit Trend</span>
                <span className="text-sm font-bold text-indigo-700">
                  £{(monthlyData.reduce((s, m) => s + m.profit, 0) / 1000).toFixed(1)}k total
                </span>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="profitSparkline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="profit" stroke="#6366f1" fill="url(#profitSparkline)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit/Loss Trend - Enhanced with data labels */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Profit/Loss Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthlyData} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={50} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="profit" fill="url(#profitGradient)" stroke="none" />
              <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#fff', stroke: '#6366f1', strokeWidth: 2, r: 5 }} name="Net Profit/Loss">
                <LabelList dataKey="profit" position="top" formatter={(v) => `£${(v/1000).toFixed(1)}k`} fill="#6366f1" fontSize={10} fontWeight={600} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash Flow Waterfall Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={waterfallData} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={(value) => `£${Math.abs(value).toLocaleString()}`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(v) => `${v >= 0 ? '+' : ''}£${(v/1000).toFixed(1)}k`} fill="#64748b" fontSize={9} fontWeight={500} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recurring vs One-time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Recurring vs One-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-emerald-700 font-medium">Income</span>
                <span className="text-xs text-slate-500">£{(recurringData.recurringIncome + recurringData.oneTimeIncome).toLocaleString()}</span>
              </div>
              <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${recurringData.recurringIncome / (recurringData.recurringIncome + recurringData.oneTimeIncome) * 100 || 0}%` }}>
                  {recurringData.recurringIncome > 0 && `£${(recurringData.recurringIncome / 1000).toFixed(1)}k`}
                </div>
                <div className="bg-emerald-300 h-full flex items-center justify-center text-xs text-emerald-800 font-medium"
                  style={{ width: `${recurringData.oneTimeIncome / (recurringData.recurringIncome + recurringData.oneTimeIncome) * 100 || 0}%` }}>
                  {recurringData.oneTimeIncome > 0 && `£${(recurringData.oneTimeIncome / 1000).toFixed(1)}k`}
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-red-700 font-medium">Expenses</span>
                <span className="text-xs text-slate-500">£{(recurringData.recurringExpense + recurringData.oneTimeExpense).toLocaleString()}</span>
              </div>
              <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${recurringData.recurringExpense / (recurringData.recurringExpense + recurringData.oneTimeExpense) * 100 || 0}%` }}>
                  {recurringData.recurringExpense > 0 && `£${(recurringData.recurringExpense / 1000).toFixed(1)}k`}
                </div>
                <div className="bg-red-300 h-full flex items-center justify-center text-xs text-red-800 font-medium"
                  style={{ width: `${recurringData.oneTimeExpense / (recurringData.recurringExpense + recurringData.oneTimeExpense) * 100 || 0}%` }}>
                  {recurringData.oneTimeExpense > 0 && `£${(recurringData.oneTimeExpense / 1000).toFixed(1)}k`}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-xs pt-2">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /> Recurring</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-300" /> One-time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {paymentMethodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `£${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Cumulative Balance - Enhanced */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Cumulative Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumulativeData} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={50} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" stroke="#059669" fill="url(#balanceGradient)" strokeWidth={3} dot={{ fill: '#fff', stroke: '#059669', strokeWidth: 2, r: 4 }}>
                <LabelList dataKey="balance" position="top" formatter={(v) => `£${(v/1000).toFixed(1)}k`} fill="#059669" fontSize={9} fontWeight={500} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Income
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {topItems.topIncome.map((t, idx) => (
              <div key={t.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-medium text-sm">{t.description || t.category}</p>
                  <p className="text-xs text-slate-500">{t.received_from || t.category}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">+£{t.amount?.toLocaleString()}</Badge>
              </div>
            ))}
            {topItems.topIncome.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No income data</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" /> Top Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {topItems.topExpense.map((t, idx) => (
              <div key={t.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-medium text-sm">{t.description || t.category}</p>
                  <p className="text-xs text-slate-500">{t.paid_to || t.category}</p>
                </div>
                <Badge className="bg-red-100 text-red-800">-£{t.amount?.toLocaleString()}</Badge>
              </div>
            ))}
            {topItems.topExpense.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No expense data</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}