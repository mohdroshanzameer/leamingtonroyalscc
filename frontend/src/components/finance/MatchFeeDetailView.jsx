import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Receipt, CheckCircle, Clock, Users, BarChart3 } from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { getFinanceTheme, CLUB_CONFIG } from '../ClubConfig';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

const colors = getFinanceTheme();

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

export default function MatchFeeDetailView({ onBack, dateRange }) {
  const [selectedSeason, setSelectedSeason] = useState('active');
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [selectedSubCompetition, setSelectedSubCompetition] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState('all');
  const [viewMode, setViewMode] = useState('payments'); // 'payments', 'unpaid'

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-start_date'),
  });

  const activeSeason = seasons.find(s => s.status === 'Active' || s.is_current);

  const currentSeason = useMemo(() => {
    if (selectedSeason === 'active') return activeSeason;
    return seasons.find(s => s.id === selectedSeason);
  }, [selectedSeason, seasons, activeSeason]);

  const { data: playerPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['matchFeePayments'],
    queryFn: () => api.entities.PlayerPayment.list('-payment_date'),
  });

  const { data: playerCharges = [], isLoading: chargesLoading } = useQuery({
    queryKey: ['matchFeeCharges'],
    queryFn: () => api.entities.PlayerCharge.filter({ charge_type: 'match_fee' }, '-charge_date'),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['playersForMatchFee'],
    queryFn: () => api.entities.TeamPlayer.list('player_name'),
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ['matchesForFees'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date'),
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournamentsForFees'],
    queryFn: () => api.entities.Tournament.list('name'),
  });

  // Filter matches by selected season
  const seasonFilteredMatches = useMemo(() => {
    if (selectedSeason === 'all') return allMatches;
    if (currentSeason?.start_date && currentSeason?.end_date) {
      const seasonStart = parseISO(currentSeason.start_date);
      const seasonEnd = parseISO(currentSeason.end_date);
      return allMatches.filter(m => {
        if (!m.match_date) return false;
        const mDate = parseISO(m.match_date);
        return mDate >= seasonStart && mDate <= seasonEnd;
      });
    }
    return allMatches;
  }, [allMatches, currentSeason, selectedSeason]);

  // Get unique competitions from tournaments
  const competitions = useMemo(() => {
    const compMap = {};
    tournaments.forEach(t => {
      if (t.competition_id && t.competition_name) {
        compMap[t.competition_id] = t.competition_name;
      }
    });
    return Object.entries(compMap).map(([id, name]) => ({ id, name }));
  }, [tournaments]);

  // Get sub-competitions filtered by selected competition
  const subCompetitions = useMemo(() => {
    const subCompMap = {};
    tournaments.filter(t => selectedCompetition === 'all' || t.competition_id === selectedCompetition)
      .forEach(t => {
        if (t.sub_competition_id && t.sub_competition_name) {
          subCompMap[t.sub_competition_id] = t.sub_competition_name;
        }
      });
    return Object.entries(subCompMap).map(([id, name]) => ({ id, name }));
  }, [tournaments, selectedCompetition]);

  // Get unique match dates
  const matchDates = useMemo(() => {
    const dates = [...new Set(seasonFilteredMatches
      .filter(m => m.match_date)
      .map(m => format(parseISO(m.match_date), 'yyyy-MM-dd')))];
    return dates.sort((a, b) => b.localeCompare(a));
  }, [seasonFilteredMatches]);

  // Filter matches by all criteria
  const matches = useMemo(() => {
    let filtered = seasonFilteredMatches;
    
    if (selectedCompetition !== 'all') {
      const tournamentIds = tournaments.filter(t => t.competition_id === selectedCompetition).map(t => t.id);
      filtered = filtered.filter(m => tournamentIds.includes(m.tournament_id));
    }
    
    if (selectedSubCompetition !== 'all') {
      const tournamentIds = tournaments.filter(t => t.sub_competition_id === selectedSubCompetition).map(t => t.id);
      filtered = filtered.filter(m => tournamentIds.includes(m.tournament_id));
    }
    
    if (selectedDate !== 'all') {
      filtered = filtered.filter(m => m.match_date && format(parseISO(m.match_date), 'yyyy-MM-dd') === selectedDate);
    }
    
    return filtered;
  }, [seasonFilteredMatches, selectedCompetition, selectedSubCompetition, selectedDate, tournaments]);

  const { data: allocations = [] } = useQuery({
    queryKey: ['paymentAllocations'],
    queryFn: () => api.entities.PaymentAllocation.list(),
  });

  const isLoading = paymentsLoading || chargesLoading;

  // Get player name helper
  const getPlayerName = (playerId) => players.find(p => p.id === playerId)?.player_name || 'Unknown';
  const getPlayerEmail = (playerId) => players.find(p => p.id === playerId)?.email || '';
  const getPlayerPhone = (playerId) => players.find(p => p.id === playerId)?.phone || '';

  // Get match info from charge
  const getMatchInfo = (chargeId) => {
    const charge = playerCharges.find(c => c.id === chargeId);
    if (!charge?.reference_id) return null;
    const match = matches.find(m => m.id === charge.reference_id);
    if (!match) return null;
    return {
      teams: `${match.team1_name} vs ${match.team2_name}`,
      date: match.match_date ? format(parseISO(match.match_date), 'dd MMM yyyy') : '',
      venue: match.venue || ''
    };
  };

  // Filter payments and add match info
  const enrichedPayments = useMemo(() => {
    // Get all charge IDs that are match_fee type
    const matchFeeChargeIds = new Set(playerCharges.map(c => c.id));
    
    // Find payments allocated to match fee charges
    const matchFeePaymentIds = new Set();
    const paymentToChargeMap = {};
    
    allocations.forEach(a => {
      if (matchFeeChargeIds.has(a.charge_id)) {
        matchFeePaymentIds.add(a.payment_id);
        paymentToChargeMap[a.payment_id] = a.charge_id;
      }
    });

    // Filter and enrich payments
    return playerPayments
      .filter(p => {
        // Include if allocated to match fee OR if no specific allocation (legacy data)
        const isAllocated = matchFeePaymentIds.has(p.id);
        const hasNoAllocation = !allocations.some(a => a.payment_id === p.id);
        return isAllocated || hasNoAllocation;
      })
      .map(p => {
        const chargeId = paymentToChargeMap[p.id];
        const matchInfo = chargeId ? getMatchInfo(chargeId) : null;
        return {
          ...p,
          playerName: getPlayerName(p.player_id),
          playerEmail: getPlayerEmail(p.player_id),
          playerPhone: getPlayerPhone(p.player_id),
          matchInfo
        };
      })
      .filter(p => {
        // Filter by season
        if (selectedSeason !== 'all' && p.payment_date && currentSeason?.start_date && currentSeason?.end_date) {
          const pDate = parseISO(p.payment_date);
          const seasonStart = parseISO(currentSeason.start_date);
          const seasonEnd = parseISO(currentSeason.end_date);
          if (pDate < seasonStart || pDate > seasonEnd) return false;
        }

        // Filter by match
        if (selectedMatch !== 'all') {
          const chargeId = paymentToChargeMap[p.id];
          const charge = playerCharges.find(c => c.id === chargeId);
          if (!charge || charge.reference_id !== selectedMatch) return false;
        }

        return true;
      })
      ;
      }, [playerPayments, playerCharges, allocations, players, allMatches, currentSeason, selectedSeason, selectedMatch]);

  const totalCollected = enrichedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const verifiedCount = enrichedPayments.filter(p => p.verified).length;
  const pendingCount = enrichedPayments.filter(p => !p.verified).length;

  // Calculate player balances for unpaid view
  const playerBalances = useMemo(() => {
    const balances = {};
    
    // Filter charges by season
    const filteredCharges = playerCharges.filter(c => {
      if (c.voided) return false;
      if (selectedSeason === 'all') return true;
      if (!c.charge_date || !currentSeason?.start_date || !currentSeason?.end_date) return true;
      const cDate = parseISO(c.charge_date);
      const seasonStart = parseISO(currentSeason.start_date);
      const seasonEnd = parseISO(currentSeason.end_date);
      return cDate >= seasonStart && cDate <= seasonEnd;
    });

    // Add charges
    filteredCharges.forEach(c => {
      if (!balances[c.player_id]) {
        balances[c.player_id] = { 
          name: getPlayerName(c.player_id), 
          totalCharges: 0, 
          totalPaid: 0,
          charges: []
        };
      }
      balances[c.player_id].totalCharges += c.amount || 0;
      balances[c.player_id].charges.push(c);
    });

    // Calculate paid amounts from allocations
    const chargeIds = new Set(filteredCharges.map(c => c.id));
    allocations.forEach(a => {
      if (chargeIds.has(a.charge_id)) {
        const charge = filteredCharges.find(c => c.id === a.charge_id);
        if (charge && balances[charge.player_id]) {
          balances[charge.player_id].totalPaid += a.amount || 0;
        }
      }
    });

    return balances;
  }, [playerCharges, allocations, selectedSeason, currentSeason, players]);

  // Players with outstanding balance
  const unpaidPlayers = useMemo(() => {
    return Object.entries(playerBalances)
      .filter(([_, data]) => data.totalCharges > data.totalPaid)
      .map(([playerId, data]) => ({
        playerId,
        name: data.name,
        owed: data.totalCharges - data.totalPaid,
        totalCharges: data.totalCharges,
        totalPaid: data.totalPaid
      }))
      .sort((a, b) => b.owed - a.owed);
  }, [playerBalances]);

  // Group by player
  const byPlayer = useMemo(() => {
    const grouped = {};
    enrichedPayments.forEach(p => {
      if (!grouped[p.player_id]) {
        grouped[p.player_id] = { name: p.playerName, total: 0, count: 0 };
      }
      grouped[p.player_id].total += p.amount || 0;
      grouped[p.player_id].count += 1;
    });
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [enrichedPayments]);

  // Expected vs Received data
  const expectedVsReceived = useMemo(() => {
    // Filter charges by season if needed
    const filteredCharges = playerCharges.filter(c => {
      if (!c.voided && c.charge_type === 'match_fee') {
        if (selectedSeason === 'all') return true;
        if (!c.charge_date) return true;
        if (currentSeason?.start_date && currentSeason?.end_date) {
          const cDate = parseISO(c.charge_date);
          const seasonStart = parseISO(currentSeason.start_date);
          const seasonEnd = parseISO(currentSeason.end_date);
          return cDate >= seasonStart && cDate <= seasonEnd;
        }
        return true;
      }
      return false;
    });
    
    const expectedTotal = filteredCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
    const receivedTotal = totalCollected;
    const outstanding = Math.max(0, expectedTotal - receivedTotal);
    
    return {
      expected: expectedTotal,
      received: receivedTotal,
      outstanding,
      collectionRate: expectedTotal > 0 ? (receivedTotal / expectedTotal * 100) : 0
    };
  }, [playerCharges, totalCollected, selectedSeason, currentSeason]);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const key = format(monthStart, 'yyyy-MM');
      months[key] = { month: format(monthStart, 'MMM'), amount: 0 };
    }
    enrichedPayments.forEach(p => {
      if (!p.payment_date) return;
      const key = format(parseISO(p.payment_date), 'yyyy-MM');
      if (months[key]) months[key].amount += p.amount || 0;
    });
    return Object.values(months);
  }, [enrichedPayments]);

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
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Match Fee Details</h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>Player match fee payments</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedSeason} onValueChange={(v) => { setSelectedSeason(v); setSelectedMatch('all'); }}>
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
            <p className="text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>Collected</p>
            <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
              {CLUB_CONFIG.finance.currency}{totalCollected.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{enrichedPayments.length}</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Total Payments</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{verifiedCount}</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Verified</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{pendingCount}</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expected vs Received Chart */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Receipt className="w-4 h-4" style={{ color: '#3b82f6' }} /> Expected vs Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={160} height={160} className="flex-shrink-0">
                <RechartsPieChart>
                  <Pie 
                    data={[
                      { name: 'Received', value: expectedVsReceived.received, color: '#10b981' },
                      { name: 'Outstanding', value: expectedVsReceived.outstanding, color: '#ef4444' }
                    ].filter(d => d.value > 0)} 
                    cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                    <span style={{ color: colors.textSecondary }}>Expected</span>
                  </div>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>£{expectedVsReceived.expected.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
                    <span style={{ color: colors.textSecondary }}>Received</span>
                  </div>
                  <span className="font-medium" style={{ color: '#10b981' }}>£{expectedVsReceived.received.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    <span style={{ color: colors.textSecondary }}>Outstanding</span>
                  </div>
                  <span className="font-medium" style={{ color: '#ef4444' }}>£{expectedVsReceived.outstanding.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textMuted }}>Collection Rate</span>
                    <span className="font-bold" style={{ color: expectedVsReceived.collectionRate >= 80 ? '#10b981' : expectedVsReceived.collectionRate >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {expectedVsReceived.collectionRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#3b82f6' }} /> Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="month" stroke={colors.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={colors.textMuted} tickFormatter={v => `£${v}`} tick={{ fontSize: 11 }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Match Fees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Match Fee Data */}
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="pb-3">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Receipt className="w-4 h-4" style={{ color: '#3b82f6' }} />
              Match Fee Data
              <Badge className="ml-1" style={{ backgroundColor: colors.surfaceHover, color: colors.textSecondary }}>{enrichedPayments.length}</Badge>
            </CardTitle>
            {/* View Mode Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('payments')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'payments' ? colors.accent : colors.surfaceHover,
                  color: viewMode === 'payments' ? '#000' : colors.textSecondary
                }}
              >
                Payments
              </button>
              <button
                onClick={() => setViewMode('unpaid')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: viewMode === 'unpaid' ? '#f59e0b' : colors.surfaceHover,
                  color: viewMode === 'unpaid' ? '#000' : colors.textSecondary
                }}
              >
                Unpaid
                {unpaidPlayers.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ 
                    backgroundColor: viewMode === 'unpaid' ? 'rgba(0,0,0,0.2)' : '#f59e0b',
                    color: viewMode === 'unpaid' ? '#000' : '#fff'
                  }}>
                    {unpaidPlayers.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>Competition</label>
              <Select value={selectedCompetition} onValueChange={(v) => { setSelectedCompetition(v); setSelectedSubCompetition('all'); setSelectedMatch('all'); }}>
                <SelectTrigger className="w-full h-9 text-sm" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all" style={{ color: colors.textSecondary }}>All</SelectItem>
                  {competitions.map(c => (
                    <SelectItem key={c.id} value={c.id} style={{ color: colors.textSecondary }}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>Sub-Competition</label>
              <Select value={selectedSubCompetition} onValueChange={(v) => { setSelectedSubCompetition(v); setSelectedMatch('all'); }}>
                <SelectTrigger className="w-full h-9 text-sm" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all" style={{ color: colors.textSecondary }}>All</SelectItem>
                  {subCompetitions.map(c => (
                    <SelectItem key={c.id} value={c.id} style={{ color: colors.textSecondary }}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>Date</label>
              <Select value={selectedDate} onValueChange={(v) => { setSelectedDate(v); setSelectedMatch('all'); }}>
                <SelectTrigger className="w-full h-9 text-sm" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all" style={{ color: colors.textSecondary }}>All Dates</SelectItem>
                  {matchDates.map(d => (
                    <SelectItem key={d} value={d} style={{ color: colors.textSecondary }}>{format(parseISO(d), 'dd MMM yyyy')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: colors.textMuted }}>Match</label>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger className="w-full h-9 text-sm" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all" style={{ color: colors.textSecondary }}>All Matches</SelectItem>
                  {matches.map(m => (
                    <SelectItem key={m.id} value={m.id} style={{ color: colors.textSecondary }}>
                      {m.team1_name} vs {m.team2_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            {viewMode === 'payments' ? (
              // Payments View
              enrichedPayments.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: colors.textMuted }} />
                  <p className="text-sm" style={{ color: colors.textMuted }}>No match fee payments found</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {enrichedPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ 
                            background: p.verified 
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#000'
                          }}
                        >
                          {p.playerName?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: colors.textPrimary }}>{p.playerName}</p>
                          <p className="text-xs truncate" style={{ color: colors.textMuted }}>
                            {p.payment_date ? format(parseISO(p.payment_date), 'dd MMM yyyy') : '-'}
                            {p.payment_method && ` • ${p.payment_method}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold" style={{ color: p.verified ? '#10b981' : '#f59e0b' }}>
                          {CLUB_CONFIG.finance.currency}{(p.amount || 0).toLocaleString()}
                        </span>
                        {p.verified ? (
                          <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Unpaid Players View
              unpaidPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: '#10b981' }} />
                  <p className="text-sm" style={{ color: colors.textMuted }}>All players are up to date!</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {unpaidPlayers.map(p => (
                    <div key={p.playerId} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff'
                          }}
                        >
                          {p.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: colors.textPrimary }}>{p.name}</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            Charged: {CLUB_CONFIG.finance.currency}{p.totalCharges} • Paid: {CLUB_CONFIG.finance.currency}{p.totalPaid}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold" style={{ color: '#ef4444' }}>
                          -{CLUB_CONFIG.finance.currency}{p.owed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}