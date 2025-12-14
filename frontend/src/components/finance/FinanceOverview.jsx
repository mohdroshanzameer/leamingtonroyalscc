import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  CircleDollarSign, Receipt, Users, Calendar, PiggyBank
} from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format, startOfYear } from 'date-fns';
import { CLUB_CONFIG } from '../ClubConfig';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

export default function FinanceOverview({ transactions, memberships = [] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const yearStart = startOfYear(now);

    const completedTx = transactions.filter(t => t.status === 'Completed');
    
    const totalIncome = completedTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = completedTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const balance = totalIncome - totalExpenses;

    // This month
    const thisMonthTx = completedTx.filter(t => {
      const d = new Date(t.date);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    });
    const thisMonthIncome = thisMonthTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const thisMonthExpense = thisMonthTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0);

    // Last month
    const lastMonthTx = completedTx.filter(t => {
      const d = new Date(t.date);
      return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
    });
    const lastMonthIncome = lastMonthTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastMonthExpense = lastMonthTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate trends
    const incomeTrend = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
    const expenseTrend = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100) : 0;

    // Pending
    const pendingTx = transactions.filter(t => t.status === 'Pending');
    const pendingAmount = pendingTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Monthly data for chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthTx = completedTx.filter(t => {
        const d = new Date(t.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      });
      monthlyData.push({
        month: format(monthStart, 'MMM'),
        income: monthTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0),
        expenses: monthTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0),
      });
    }

    // Category breakdown
    const incomeByCategory = {};
    const expenseByCategory = {};
    completedTx.forEach(t => {
      if (t.type === 'Income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + (t.amount || 0);
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + (t.amount || 0);
      }
    });

    // Active memberships
    const activeMemberships = memberships.filter(m => m.status === 'Active').length;
    const pendingMemberships = memberships.filter(m => m.status === 'Pending').length;

    return {
      totalIncome, totalExpenses, balance,
      thisMonthIncome, thisMonthExpense,
      incomeTrend, expenseTrend,
      pendingAmount, pendingCount: pendingTx.length,
      monthlyData,
      incomeByCategory: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      activeMemberships,
      pendingMemberships,
      transactionCount: transactions.length
    };
  }, [transactions, memberships]);

  const COLORS = ['#27567D', '#5D82A2', '#EAD3B6', '#D0D7DB', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const formatCurrency = (value) => `${CLUB_CONFIG.finance.currency}${value?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}`;

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              {stats.incomeTrend !== 0 && (
                <div className={`flex items-center text-xs font-medium ${stats.incomeTrend >= 0 ? 'text-emerald-100' : 'text-red-200'}`}>
                  {stats.incomeTrend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stats.incomeTrend).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-emerald-100 text-sm mb-1">Total Income</p>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(stats.totalIncome)}</p>
            <p className="text-emerald-100 text-xs mt-2">This month: {formatCurrency(stats.thisMonthIncome)}</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingDown className="w-5 h-5" />
              </div>
              {stats.expenseTrend !== 0 && (
                <div className={`flex items-center text-xs font-medium ${stats.expenseTrend <= 0 ? 'text-emerald-200' : 'text-red-100'}`}>
                  {stats.expenseTrend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stats.expenseTrend).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-red-100 text-sm mb-1">Total Expenses</p>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
            <p className="text-red-100 text-xs mt-2">This month: {formatCurrency(stats.thisMonthExpense)}</p>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card className={`bg-gradient-to-br ${stats.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white border-0 shadow-lg`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-blue-100 text-sm mb-1">Net Balance</p>
            <p className="text-2xl lg:text-3xl font-bold">
              {stats.balance < 0 && '-'}{formatCurrency(Math.abs(stats.balance))}
            </p>
            <p className="text-blue-100 text-xs mt-2">{stats.transactionCount} transactions</p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <PiggyBank className="w-5 h-5" />
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{stats.pendingCount}</span>
            </div>
            <p className="text-amber-100 text-sm mb-1">Pending</p>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
            <p className="text-amber-100 text-xs mt-2">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">Cash Flow Overview</CardTitle>
            <p className="text-sm text-slate-500">Last 6 months income vs expenses</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(v) => `${CLUB_CONFIG.finance.currency}${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGradient)" name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGradient)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">Income Sources</CardTitle>
            <p className="text-sm text-slate-500">By category</p>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.incomeByCategory.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.incomeByCategory.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {stats.incomeByCategory.slice(0, 4).map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-slate-600 truncate max-w-[120px]">{cat.name}</span>
                  </div>
                  <span className="font-medium text-slate-800">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">Expense Breakdown</CardTitle>
            <p className="text-sm text-slate-500">Top spending categories</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.expenseByCategory.slice(0, 6)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(v) => `${CLUB_CONFIG.finance.currency}${v}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">Quick Stats</CardTitle>
            <p className="text-sm text-slate-500">Key metrics at a glance</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Active Members</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.activeMemberships}</p>
                {stats.pendingMemberships > 0 && (
                  <p className="text-xs text-amber-600 mt-1">+{stats.pendingMemberships} pending</p>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-600">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.transactionCount}</p>
                <p className="text-xs text-slate-500 mt-1">Total recorded</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-600">This Month</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(stats.thisMonthIncome)}</p>
                <p className="text-xs text-red-500 mt-1">-{formatCurrency(stats.thisMonthExpense)}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDollarSign className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-slate-600">Profit Margin</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.totalIncome > 0 ? ((stats.balance / stats.totalIncome) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Net / Income</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}