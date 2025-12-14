import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, RefreshCw, Receipt } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { CLUB_CONFIG } from '../ClubConfig';

export default function FinanceSummaryCards({ transactions }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

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
    const incomeTrend = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(0) : 0;
    const expenseTrend = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(0) : 0;

    // Recurring breakdown
    const recurringIncome = completedTx.filter(t => t.type === 'Income' && t.is_recurring).reduce((sum, t) => sum + (t.amount || 0), 0);
    const recurringExpense = completedTx.filter(t => t.type === 'Expense' && t.is_recurring).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Pending
    const pendingTx = transactions.filter(t => t.status === 'Pending');
    const pendingAmount = pendingTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalIncome, totalExpenses, balance,
      thisMonthIncome, thisMonthExpense,
      incomeTrend, expenseTrend,
      recurringIncome, recurringExpense,
      pendingAmount, pendingCount: pendingTx.length,
      transactionCount: transactions.length
    };
  }, [transactions]);

  const cards = [
    {
      title: 'Total Income',
      value: stats.totalIncome,
      icon: TrendingUp,
      color: 'emerald',
      trend: `${stats.incomeTrend >= 0 ? '+' : ''}${stats.incomeTrend}%`,
      trendUp: stats.incomeTrend >= 0,
      subtext: `${CLUB_CONFIG.finance.currency}${stats.recurringIncome.toLocaleString()} recurring`
    },
    {
      title: 'Total Expenses',
      value: stats.totalExpenses,
      icon: TrendingDown,
      color: 'red',
      trend: `${stats.expenseTrend >= 0 ? '+' : ''}${stats.expenseTrend}%`,
      trendUp: stats.expenseTrend <= 0,
      subtext: `${CLUB_CONFIG.finance.currency}${stats.recurringExpense.toLocaleString()} recurring`
    },
    {
      title: 'Current Balance',
      value: stats.balance,
      icon: Wallet,
      color: stats.balance >= 0 ? 'blue' : 'orange',
      isBalance: true,
      subtext: `${stats.transactionCount} total transactions`
    },
    {
      title: 'Pending',
      value: stats.pendingAmount,
      icon: PiggyBank,
      color: 'amber',
      count: stats.pendingCount
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.color}-500/10 rounded-full -translate-y-8 translate-x-8`} />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${
                  card.isBalance 
                    ? card.value >= 0 ? 'text-emerald-700' : 'text-red-600'
                    : 'text-slate-900'
                }`}>
                  {CLUB_CONFIG.finance.currency}{Math.abs(card.value).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  {card.isBalance && card.value < 0 && ' (Deficit)'}
                </p>
                {card.trend && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.trend} vs last month
                  </div>
                )}
                {card.subtext && (
                  <p className="text-xs text-slate-500 mt-1">{card.subtext}</p>
                )}
                {card.count !== undefined && (
                  <p className="text-xs text-slate-500 mt-2">{card.count} pending transactions</p>
                )}
              </div>
              <div className={`p-3 rounded-xl bg-${card.color}-100`}>
                <card.icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}