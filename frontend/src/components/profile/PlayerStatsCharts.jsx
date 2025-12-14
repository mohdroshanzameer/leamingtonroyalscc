import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Target, Zap, TrendingUp, Calendar, Flame, Award } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = {
  blue: '#3b82f6',
  red: '#ef4444',
  amber: '#f59e0b',
  emerald: '#10b981',
  purple: '#8b5cf6',
  cyan: '#00d4ff',
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
        <p className="text-white font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || entry.stroke || entry.fill }}>
            {entry.name}: {typeof entry.value === 'number' ? (Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(1)) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PlayerStatsCharts({ player, selectedSeason, selectedCompetition }) {
  if (!player) return null;

  // Fetch all competitions to handle parent-child relationships
  const { data: allCompetitions = [] } = useQuery({
    queryKey: ['all-competitions'],
    queryFn: () => api.entities.Competition.list(),
  });

  // Fetch tournaments for selected season and competition
  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments-filtered', selectedSeason?.id, selectedCompetition?.id],
    queryFn: async () => {
      const all = await api.entities.Tournament.list();
      
      // Filter by season first
      let filtered = all;
      if (selectedSeason) {
        filtered = filtered.filter(t => t.season_id === selectedSeason.id);
      }
      
      // If a competition is selected, filter by competition and its sub-competitions
      if (selectedCompetition) {
        const validCompetitionIds = [selectedCompetition.id];
        // Add all sub-competitions (where parent_id matches selected competition)
        const subComps = allCompetitions.filter(c => c.parent_id === selectedCompetition.id);
        validCompetitionIds.push(...subComps.map(c => c.id));
        
        filtered = filtered.filter(t => 
          validCompetitionIds.includes(t.competition_id) || validCompetitionIds.includes(t.sub_competition_id)
        );
      }
      
      return filtered;
    },
    enabled: !!selectedSeason && allCompetitions.length > 0,
  });

  const tournamentIds = tournaments.map(t => t.id);

  // Fetch tournament player stats for filtered tournaments
  const { data: tournamentPlayerStats = [] } = useQuery({
    queryKey: ['tournament-player-stats', player.id, tournamentIds],
    queryFn: async () => {
      if (tournamentIds.length === 0) return [];
      const all = await api.entities.TournamentPlayer.list();
      return all.filter(tp => tp.player_id === player.id && tournamentIds.includes(tp.tournament_id));
    },
    enabled: !!player.id && tournamentIds.length > 0,
  });

  // Aggregate stats from tournament player records
  const aggregatedStats = React.useMemo(() => {
    if (tournamentPlayerStats.length === 0) {
      // Return zero stats when no data for selected filters
      return {
        ...player,
        matches_played: 0,
        runs_scored: 0,
        balls_faced: 0,
        highest_score: 0,
        not_outs: 0,
        fours: 0,
        sixes: 0,
        fifties: 0,
        hundreds: 0,
        wickets_taken: 0,
        overs_bowled: 0,
        runs_conceded: 0,
        best_bowling: '-',
        maidens: 0,
        four_wickets: 0,
        five_wickets: 0,
        dot_balls: 0,
        catches: 0,
        stumpings: 0,
        run_outs: 0,
      };
    }
    
    return {
      ...player,
      matches_played: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.matches_played || 0), 0),
      runs_scored: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.runs_scored || 0), 0),
      balls_faced: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.balls_faced || 0), 0),
      highest_score: Math.max(...tournamentPlayerStats.map(tp => tp.highest_score || 0)),
      not_outs: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.not_outs || 0), 0),
      fours: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.fours || 0), 0),
      sixes: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.sixes || 0), 0),
      fifties: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.fifties || 0), 0),
      hundreds: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.hundreds || 0), 0),
      wickets_taken: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.wickets_taken || 0), 0),
      overs_bowled: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.overs_bowled || 0), 0),
      runs_conceded: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.runs_conceded || 0), 0),
      best_bowling: tournamentPlayerStats[0]?.best_bowling || '-',
      maidens: 0,
      four_wickets: 0,
      five_wickets: 0,
      dot_balls: 0,
      catches: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.catches || 0), 0),
      stumpings: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.stumpings || 0), 0),
      run_outs: tournamentPlayerStats.reduce((sum, tp) => sum + (tp.run_outs || 0), 0),
    };
  }, [tournamentPlayerStats, player]);

  // Fetch matches for selected tournaments
  const { data: matches = [] } = useQuery({
    queryKey: ['tournament-matches', tournamentIds],
    queryFn: async () => {
      if (tournamentIds.length === 0) return [];
      const all = await api.entities.TournamentMatch.list('-match_date', 100);
      return all.filter(m => tournamentIds.includes(m.tournament_id));
    },
    enabled: tournamentIds.length > 0,
  });

  const matchIds = matches.map(m => m.id);

  // Fetch ball-by-ball data for matches in selected tournaments
  const { data: ballData = [] } = useQuery({
    queryKey: ['player-balls-filtered', player.id, matchIds],
    queryFn: async () => {
      if (matchIds.length === 0) return [];
      const allBalls = await api.entities.BallByBall.list('-created_date', 500);
      return allBalls.filter(b => 
        (b.batsman_id === player.id || b.bowler_id === player.id) && 
        matchIds.includes(b.match_id)
      );
    },
    enabled: !!player.id && matchIds.length > 0,
  });

  // Process match-by-match batting performance
  const matchPerformances = React.useMemo(() => {
    const matchMap = new Map();
    
    ballData.forEach(ball => {
      if (ball.batsman_id === player.id) {
        const key = ball.match_id;
        if (!matchMap.has(key)) {
          matchMap.set(key, { matchId: key, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, runsConceded: 0, oversBowled: 0 });
        }
        const perf = matchMap.get(key);
        perf.runs += ball.runs || 0;
        perf.balls += 1;
        if (ball.is_four) perf.fours += 1;
        if (ball.is_six) perf.sixes += 1;
      }
      if (ball.bowler_id === player.id) {
        const key = ball.match_id;
        if (!matchMap.has(key)) {
          matchMap.set(key, { matchId: key, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, runsConceded: 0, oversBowled: 0 });
        }
        const perf = matchMap.get(key);
        perf.runsConceded += (ball.runs || 0) + (ball.extras || 0);
        perf.oversBowled += 1/6;
        if (ball.is_wicket && ball.bowler_id === player.id) perf.wickets += 1;
      }
    });

    // Convert to array and add match info
    return Array.from(matchMap.values())
      .map(perf => {
        const match = matches.find(m => m.id === perf.matchId);
        return {
          ...perf,
          date: match?.match_date ? format(new Date(match.match_date), 'dd MMM') : 'Match',
          opponent: match ? (match.team1_name?.substring(0,8) || 'Opp') : 'Match',
          sr: perf.balls > 0 ? ((perf.runs / perf.balls) * 100).toFixed(0) : 0,
          eco: perf.oversBowled > 0 ? (perf.runsConceded / perf.oversBowled).toFixed(1) : 0,
        };
      })
      .slice(-10)
      .reverse();
  }, [ballData, matches, player.id]);

  // Calculate recent form (last 5 matches)
  const recentForm = matchPerformances.slice(0, 5);
  const avgRecentRuns = recentForm.length > 0 ? recentForm.reduce((sum, m) => sum + m.runs, 0) / recentForm.length : 0;
  const avgRecentSR = recentForm.length > 0 ? recentForm.reduce((sum, m) => sum + parseFloat(m.sr || 0), 0) / recentForm.length : 0;

  // Form indicator
  const getFormIcon = (runs) => {
    if (runs >= 50) return { icon: '🔥', color: COLORS.amber };
    if (runs >= 30) return { icon: '✓', color: COLORS.emerald };
    if (runs >= 15) return { icon: '•', color: COLORS.blue };
    return { icon: '○', color: '#64748b' };
  };

  // Use aggregated stats for display
  const displayStats = aggregatedStats;

  // Calculate derived stats for ICC-style display
  const dismissals = (displayStats.matches_played || 0) - (displayStats.not_outs || 0);
  const battingAvg = dismissals > 0 ? ((displayStats.runs_scored || 0) / dismissals).toFixed(1) : '-';
  const strikeRate = (displayStats.balls_faced || 0) > 0 
    ? (((displayStats.runs_scored || 0) / displayStats.balls_faced) * 100).toFixed(1) 
    : '-';
  const bowlingAvg = (displayStats.wickets_taken || 0) > 0 
    ? ((displayStats.runs_conceded || 0) / displayStats.wickets_taken).toFixed(1) 
    : '-';
  const economy = (displayStats.overs_bowled || 0) > 0 
    ? ((displayStats.runs_conceded || 0) / displayStats.overs_bowled).toFixed(1) 
    : '-';

  // Runs distribution for pie chart
  const runsDistribution = [
    { name: 'Singles/2s/3s', value: Math.max(0, (displayStats.runs_scored || 0) - ((displayStats.fours || 0) * 4) - ((displayStats.sixes || 0) * 6)), color: '#64748b' },
    { name: 'Fours', value: (displayStats.fours || 0) * 4, color: COLORS.emerald },
    { name: 'Sixes', value: (displayStats.sixes || 0) * 6, color: COLORS.amber },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Hero Stats Row - ICC Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
            <Target className="w-full h-full text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">{displayStats.runs_scored || 0}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Runs</p>
          <p className="text-xs text-blue-300 mt-1">HS: {displayStats.highest_score || 0}</p>
        </div>
        <div 
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
            <Zap className="w-full h-full text-red-400" />
          </div>
          <p className="text-3xl font-black text-red-400">{displayStats.wickets_taken || 0}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Wickets</p>
          <p className="text-xs text-red-300 mt-1">BB: {displayStats.best_bowling || '-'}</p>
        </div>
        <div 
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <p className="text-3xl font-black text-emerald-400">{strikeRate !== '-' ? strikeRate : '-'}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Strike Rate</p>
          <p className="text-xs text-emerald-300 mt-1">Avg: {battingAvg}</p>
        </div>
        <div 
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.05) 100%)', border: '1px solid rgba(251,191,36,0.3)' }}
        >
          <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
            <Award className="w-full h-full text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{displayStats.matches_played || 0}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Matches</p>
          <p className="text-xs text-amber-300 mt-1">NO: {displayStats.not_outs || 0}</p>
        </div>
      </div>

      {/* Batting Analysis with Pie Chart */}
      {runsDistribution.length > 0 && (
        <div 
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" /> SCORING BREAKDOWN
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={runsDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {runsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {runsDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Key metrics */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <p className="text-lg font-bold text-emerald-400">{displayStats.fours || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">Fours</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(251,191,36,0.1)' }}>
              <p className="text-lg font-bold text-amber-400">{displayStats.sixes || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">Sixes</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <p className="text-lg font-bold text-blue-400">{displayStats.fifties || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">50s</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
              <p className="text-lg font-bold text-purple-400">{displayStats.hundreds || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">100s</p>
            </div>
          </div>
        </div>
      )}

      {/* Bowling Stats - ICC Style */}
      {(displayStats.wickets_taken > 0 || displayStats.overs_bowled > 0) && (
        <div 
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-400" /> BOWLING ANALYSIS
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-black text-red-400">{displayStats.wickets_taken || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Wickets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-purple-400">{displayStats.overs_bowled || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Overs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-amber-400">{economy}</p>
              <p className="text-[10px] text-slate-500 uppercase">Economy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">{bowlingAvg}</p>
              <p className="text-[10px] text-slate-500 uppercase">Average</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}>
              <p className="text-lg font-bold text-purple-400">{displayStats.maidens || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">Maidens</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(251,191,36,0.1)' }}>
              <p className="text-lg font-bold text-amber-400">{displayStats.four_wickets || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">4-fers</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <p className="text-lg font-bold text-red-400">{displayStats.five_wickets || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">5-fers</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,212,255,0.1)' }}>
              <p className="text-lg font-bold text-cyan-400">{displayStats.dot_balls || 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">Dots</p>
            </div>
          </div>
        </div>
      )}

      {/* Fielding Stats */}
      {((displayStats.catches || 0) + (displayStats.run_outs || 0) + (displayStats.stumpings || 0)) > 0 && (
        <div 
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> FIELDING
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p className="text-2xl font-black text-amber-400">{displayStats.catches || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Catches</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <p className="text-2xl font-black text-cyan-400">{displayStats.run_outs || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Run Outs</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p className="text-2xl font-black text-purple-400">{displayStats.stumpings || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">Stumpings</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Form Summary */}
      <div 
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" /> RECENT FORM
        </h3>
        
        {recentForm.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No recent match data available</p>
        ) : (
          <>
            {/* Form indicators */}
            <div className="flex justify-center gap-3 mb-4">
              {recentForm.map((match, idx) => {
                const form = getFormIcon(match.runs);
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${form.color}20`, border: `2px solid ${form.color}` }}
                    >
                      {form.icon}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">{match.runs}</span>
                  </div>
                );
              })}
            </div>

            {/* Average stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <p className="text-2xl font-bold text-blue-400">{avgRecentRuns.toFixed(0)}</p>
                <p className="text-[10px] text-slate-500 uppercase">Avg Runs (Last 5)</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <p className="text-2xl font-bold text-emerald-400">{avgRecentSR.toFixed(0)}</p>
                <p className="text-[10px] text-slate-500 uppercase">Avg SR (Last 5)</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Match-by-Match Performance Chart */}
      {matchPerformances.length > 0 && (
        <div 
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" /> BATTING PERFORMANCE
          </h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matchPerformances} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="runs" name="Runs" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Match details list */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {matchPerformances.map((match, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-400">{match.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-white">{match.runs}</span>
                  <span className="text-xs text-slate-500">({match.balls}b)</span>
                  <span className="text-xs text-emerald-400">SR {match.sr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bowling Performance */}
      {matchPerformances.some(m => m.wickets > 0 || m.oversBowled > 0) && (
        <div 
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-400" /> BOWLING PERFORMANCE
          </h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matchPerformances.filter(m => m.oversBowled > 0)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="wickets" name="Wickets" fill={COLORS.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}