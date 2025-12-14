import React, { useState, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Star, Loader2, Lock, Target, Zap, Shield, 
  Award, Calendar, CreditCard, CheckCircle, Clock, Trophy,
  TrendingUp, Medal, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '../utils';
import { CLUB_CONFIG } from '../components/ClubConfig';
import { format } from 'date-fns';

const colors = CLUB_CONFIG.theme.colors;

// Stats Section Component
function StatsSection({ title, icon: Icon, stats }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <Icon className="w-4 h-4" style={{ color: colors.accent }} />
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-2.5 rounded-lg text-center" style={{ backgroundColor: colors.surfaceHover }}>
            <div className={`font-bold ${stat.highlight ? 'text-xl' : 'text-lg'}`} 
                 style={{ color: stat.highlight ? colors.accent : colors.textPrimary }}>
              {stat.value}
            </div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: colors.textMuted }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Milestones Component
function MilestonesSection({ player }) {
  if (!player) return null;
  const milestones = [
    { id: 'first_50', label: 'First Fifty', icon: Star, color: '#f59e0b', achieved: player.fifties >= 1 || player.highest_score >= 50 },
    { id: 'first_100', label: 'First Century', icon: Trophy, color: '#fbbf24', achieved: player.hundreds >= 1 || player.highest_score >= 100 },
    { id: '500_runs', label: '500 Runs', icon: Target, color: '#3b82f6', achieved: player.runs_scored >= 500 },
    { id: '5_wickets', label: '5-Wicket Haul', icon: Zap, color: '#ef4444', achieved: player.five_wickets >= 1 },
    { id: '25_wickets', label: '25 Wickets', icon: Zap, color: '#f97316', achieved: player.wickets_taken >= 25 },
    { id: '10_matches', label: '10 Matches', icon: Medal, color: '#64748b', achieved: player.matches_played >= 10 },
    { id: '25_matches', label: '25 Matches', icon: Medal, color: '#94a3b8', achieved: player.matches_played >= 25 },
    { id: '10_catches', label: '10 Catches', icon: Award, color: '#06b6d4', achieved: player.catches >= 10 },
  ];

  const achieved = milestones.filter(m => m.achieved);
  const nextUp = milestones.filter(m => !m.achieved).slice(0, 3);

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <Trophy className="w-4 h-4" style={{ color: '#fbbf24' }} />
        Milestones
      </h3>

      {achieved.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {achieved.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: `${m.color}20`, border: `1px solid ${m.color}40` }}
            >
              <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              <span className="text-xs font-medium" style={{ color: m.color }}>{m.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm mb-3" style={{ color: colors.textMuted }}>No milestones achieved yet</p>
      )}

      {nextUp.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>Next Up</p>
          <div className="space-y-1.5">
            {nextUp.map((m) => {
              let progress = 0;
              let current = 0;
              let target = 0;
              
              if (m.id === 'first_50') { current = player.highest_score || 0; target = 50; }
              else if (m.id === 'first_100') { current = player.highest_score || 0; target = 100; }
              else if (m.id === '500_runs') { current = player.runs_scored || 0; target = 500; }
              else if (m.id === '25_wickets') { current = player.wickets_taken || 0; target = 25; }
              else if (m.id === '10_matches') { current = player.matches_played || 0; target = 10; }
              else if (m.id === '25_matches') { current = player.matches_played || 0; target = 25; }
              else if (m.id === '10_catches') { current = player.catches || 0; target = 10; }
              
              progress = Math.min(100, (current / target) * 100);

              return (
                <div key={m.id} className="flex items-center gap-2">
                  <m.icon className="w-3.5 h-3.5 opacity-40" style={{ color: colors.textMuted }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span style={{ color: colors.textMuted }}>{m.label}</span>
                      <span style={{ color: colors.textMuted }}>{current}/{target}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Recent Form Component
function RecentFormSection({ player }) {
  if (!player) return null;
  // Since we don't have match-by-match data, show a summary based on available stats
  const hasStats = (player.matches_played || 0) > 0;
  
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <Flame className="w-4 h-4" style={{ color: '#f97316' }} />
        Career Summary
      </h3>

      {hasStats ? (
        <div className="space-y-3">
          {/* Performance indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: colors.textMuted }}>Runs/Match</p>
              <p className="text-lg font-bold" style={{ color: colors.accent }}>
                {((player.runs_scored || 0) / (player.matches_played || 1)).toFixed(1)}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
              <p className="text-[10px] uppercase mb-1" style={{ color: colors.textMuted }}>Wickets/Match</p>
              <p className="text-lg font-bold" style={{ color: colors.accent }}>
                {((player.wickets_taken || 0) / (player.matches_played || 1)).toFixed(1)}
              </p>
            </div>
          </div>
          
          {/* Best performances */}
          <div className="flex gap-2">
            {player.highest_score > 0 && (
              <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <p className="text-xs font-bold text-blue-400">{player.highest_score}{player.highest_score >= 50 ? '*' : ''}</p>
                <p className="text-[9px]" style={{ color: colors.textMuted }}>Best Score</p>
              </div>
            )}
            {player.best_bowling && (
              <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <p className="text-xs font-bold text-red-400">{player.best_bowling}</p>
                <p className="text-[9px]" style={{ color: colors.textMuted }}>Best Bowling</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm" style={{ color: colors.textMuted }}>No match data available yet</p>
      )}
    </div>
  );
}

// Season Breakdown Component
function SeasonBreakdownSection({ player }) {
  if (!player) return null;
  // Show overall stats as "All Time" since we don't have season-by-season data
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
        All-Time Stats
      </h3>

      <div className="space-y-2">
        {/* Batting summary */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Batting</span>
            <span className="text-xs" style={{ color: colors.textMuted }}>{player.matches_played || 0} matches</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-sm font-bold" style={{ color: colors.accent }}>{player.runs_scored || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>Runs</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{player.highest_score || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>HS</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{player.fifties || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>50s</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{player.hundreds || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>100s</p>
            </div>
          </div>
        </div>

        {/* Bowling summary */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Bowling</span>
            <span className="text-xs" style={{ color: colors.textMuted }}>{player.overs_bowled || 0} overs</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-sm font-bold" style={{ color: colors.accent }}>{player.wickets_taken || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>Wkts</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{player.best_bowling || '-'}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>Best</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{player.maidens || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>Mdns</p>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{player.five_wickets || 0}</p>
              <p className="text-[9px]" style={{ color: colors.textMuted }}>5W</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api.auth.me()
      .then(u => { setUser(u); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  // Fetch player data
  const { data: player, isLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const allPlayers = await api.entities.TeamPlayer.list('player_name', 500);
      const found = allPlayers.find(p => p.id === playerId);
      if (!found) return null;
      const playerData = found.data || found;
      return { ...playerData, id: found.id };
    },
    enabled: !!playerId,
  });

  // Fetch charges
  const { data: playerCharges = [] } = useQuery({
    queryKey: ['player-charges', playerId],
    queryFn: async () => {
      const allCharges = await api.entities.PlayerCharge.list('-charge_date', 1000);
      return allCharges.filter(c => c.player_id === playerId && !c.voided);
    },
    enabled: !!playerId && !!player,
  });

  // Fetch payments
  const { data: playerPayments = [] } = useQuery({
    queryKey: ['player-payments', playerId],
    queryFn: async () => {
      const allPayments = await api.entities.PlayerPayment.list('-payment_date', 1000);
      return allPayments.filter(p => p.player_id === playerId);
    },
    enabled: !!playerId && !!player,
  });

  // Fetch membership
  const { data: membership } = useQuery({
    queryKey: ['player-membership', player?.email],
    queryFn: async () => {
      const allMemberships = await api.entities.Membership.list('-created_date', 200);
      return allMemberships.find(m => m.email === player?.email || m.member_name === player?.player_name);
    },
    enabled: !!player,
  });

  // Loading state
  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  // Player not found
  if (!player) {
    return (
      <div className="min-h-screen pt-24 px-4" style={{ backgroundColor: colors.background }}>
        <div className="max-w-md mx-auto text-center py-20">
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Player not found</h2>
          <Link to={createPageUrl('Squad')} className="text-sm" style={{ color: colors.accent }}>
            ← Back to Squad
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4" style={{ backgroundColor: colors.background }}>
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" 
               style={{ backgroundColor: `${colors.accent}20` }}>
            <Lock className="w-8 h-8" style={{ color: colors.accent }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Members Only</h2>
          <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
            Player profiles are only visible to club members.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl('Squad')}>
              <Button variant="outline" style={{ borderColor: colors.border, color: colors.textSecondary }}>
                Back to Squad
              </Button>
            </Link>
            <Button 
              onClick={() => api.auth.redirectToLogin()}
              style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const dismissals = (player.matches_played || 0) - (player.not_outs || 0);
  const battingAvg = dismissals > 0 ? ((player.runs_scored || 0) / dismissals).toFixed(1) : '-';
  const strikeRate = (player.balls_faced || 0) > 0 
    ? (((player.runs_scored || 0) / player.balls_faced) * 100).toFixed(1) 
    : '-';
  const bowlingAvg = (player.wickets_taken || 0) > 0 
    ? ((player.runs_conceded || 0) / player.wickets_taken).toFixed(1) 
    : '-';
  const economy = (player.overs_bowled || 0) > 0 
    ? ((player.runs_conceded || 0) / player.overs_bowled).toFixed(1) 
    : '-';

  // Payment calculations
  const registrationFee = membership?.fee_amount || 0;
  const registrationPaid = membership?.payment_status === 'Paid';
  const totalChargesAmount = playerCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaidAmount = playerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCharges = totalChargesAmount + (registrationPaid ? 0 : registrationFee);
  const totalPaid = totalPaidAmount + (registrationPaid ? registrationFee : 0);
  const balance = totalPaid - totalCharges;

  const roleColors = {
    'Batsman': '#3b82f6',
    'Bowler': '#ef4444',
    'All-Rounder': '#8b5cf6',
    'Wicket-Keeper': '#f59e0b',
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <div className="relative pt-16 lg:pt-0" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0 opacity-30" 
             style={{ background: `linear-gradient(135deg, ${roleColors[player.role] || colors.accent}40, transparent)` }} />
        
        <div className="relative max-w-2xl mx-auto px-4 py-6">
          {/* Back Button */}
          <Link 
            to={createPageUrl('Squad')} 
            className="inline-flex items-center gap-1.5 text-sm mb-6 px-3 py-1.5 rounded-full transition-colors"
            style={{ color: colors.textMuted, backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Squad
          </Link>
          
          {/* Player Header */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl"
                   style={{ backgroundColor: colors.surfaceHover }}>
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.player_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                       style={{ background: `linear-gradient(135deg, ${roleColors[player.role] || colors.accent}, ${colors.accent})` }}>
                    <span className="text-4xl font-bold text-white/90">
                      {(player.player_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {player.jersey_number && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                     style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}>
                  {player.jersey_number}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{player.player_name}</h1>
                {(player.is_captain || player.is_vice_captain) && (
                  <Badge className="bg-amber-500 text-white text-xs px-2">
                    <Star className="w-3 h-3 mr-0.5 fill-current" />
                    {player.is_captain ? 'C' : 'VC'}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                {player.team_name || 'Leamington Royals'}
              </p>
              
              <div className="flex flex-wrap gap-1.5">
                <Badge 
                  className="text-xs px-2.5 py-1" 
                  style={{ backgroundColor: roleColors[player.role] || colors.accent, color: 'white' }}
                >
                  {player.role}
                </Badge>
                {player.batting_style && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 border-white/20 text-white/80">
                    {player.batting_style}
                  </Badge>
                )}
                {player.bowling_style && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 border-white/20 text-white/80">
                    {player.bowling_style}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex justify-around mt-6 py-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{player.matches_played || 0}</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors.accent }}>{player.runs_scored || 0}</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Runs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors.accent }}>{player.wickets_taken || 0}</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Wickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{player.catches || 0}</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Catches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Content */}
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-4 space-y-4">
        {/* Batting Stats */}
        <StatsSection 
          title="Batting" 
          icon={Target}
          stats={[
            { label: 'Runs', value: player.runs_scored || 0, highlight: true },
            { label: 'High Score', value: player.highest_score || 0 },
            { label: 'Average', value: battingAvg },
            { label: 'Strike Rate', value: strikeRate },
            { label: '4s', value: player.fours || 0 },
            { label: '6s', value: player.sixes || 0 },
            { label: '50s', value: player.fifties || 0 },
            { label: '100s', value: player.hundreds || 0 },
            { label: 'Not Outs', value: player.not_outs || 0 },
          ]}
        />

        {/* Bowling Stats */}
        <StatsSection 
          title="Bowling" 
          icon={Zap}
          stats={[
            { label: 'Wickets', value: player.wickets_taken || 0, highlight: true },
            { label: 'Best', value: player.best_bowling || '-' },
            { label: 'Average', value: bowlingAvg },
            { label: 'Economy', value: economy },
            { label: 'Overs', value: player.overs_bowled || 0 },
            { label: 'Maidens', value: player.maidens || 0 },
          ]}
        />

        {/* Fielding Stats */}
        <StatsSection 
          title="Fielding" 
          icon={Shield}
          stats={[
            { label: 'Catches', value: player.catches || 0 },
            { label: 'Run Outs', value: player.run_outs || 0 },
            { label: 'Stumpings', value: player.stumpings || 0 },
          ]}
        />

        {/* Milestones */}
        <MilestonesSection player={player} />

        {/* Career Summary / Recent Form */}
        <RecentFormSection player={player} />

        {/* All-Time Stats / Season Breakdown */}
        <SeasonBreakdownSection player={player} />

        {/* Player Bio */}
        {player.bio && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Award className="w-4 h-4" style={{ color: colors.accent }} />
              About
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
              {player.bio}
            </p>
          </div>
        )}

        {/* Payments & Membership */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <CreditCard className="w-4 h-4" style={{ color: colors.accent }} />
            Payments
          </h3>

          {/* Membership Status */}
          {membership && (
            <div className={`p-3 rounded-xl mb-3 ${registrationPaid ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${registrationPaid ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    <CreditCard className={`w-4 h-4 ${registrationPaid ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{membership.membership_type} Membership</p>
                    <p className="text-xs" style={{ color: colors.textMuted }}>
                      {membership.start_date && format(new Date(membership.start_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{CLUB_CONFIG.finance.currency}{registrationFee}</p>
                  <span className={`inline-flex items-center gap-1 text-xs ${registrationPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {registrationPaid ? <><CheckCircle className="w-3 h-3" /> Paid</> : <><Clock className="w-3 h-3" /> Due</>}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
            <div className="text-center">
              <p className="text-xs" style={{ color: colors.textMuted }}>Charges</p>
              <p className="text-lg font-bold text-amber-400">{CLUB_CONFIG.finance.currency}{totalCharges}</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: colors.textMuted }}>Paid</p>
              <p className="text-lg font-bold text-emerald-400">{CLUB_CONFIG.finance.currency}{totalPaid}</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: colors.textMuted }}>{balance >= 0 ? 'Balance' : 'Owing'}</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {CLUB_CONFIG.finance.currency}{Math.abs(balance)}
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          {(playerCharges.length > 0 || playerPayments.length > 0) && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Recent Transactions</p>
              {playerCharges.slice(0, 3).map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/20">
                      <Trophy className="w-3 h-3 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                        {charge.description || charge.charge_type}
                      </p>
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>
                        {charge.charge_date && format(new Date(charge.charge_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-amber-400">
                    -{CLUB_CONFIG.finance.currency}{charge.amount || 0}
                  </p>
                </div>
              ))}
              {playerPayments.slice(0, 2).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/20">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                        {payment.notes || 'Payment'}
                      </p>
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>
                        {payment.payment_date && format(new Date(payment.payment_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">
                    +{CLUB_CONFIG.finance.currency}{payment.amount || 0}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!membership && playerCharges.length === 0 && playerPayments.length === 0 && (
            <p className="text-center text-sm py-4" style={{ color: colors.textMuted }}>No payment records</p>
          )}
        </div>

        {/* Player Info */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Calendar className="w-4 h-4" style={{ color: colors.accent }} />
            Player Info
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <p className="text-[10px] uppercase" style={{ color: colors.textMuted }}>Role</p>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{player.role || '-'}</p>
            </div>
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <p className="text-[10px] uppercase" style={{ color: colors.textMuted }}>Team</p>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{player.team_name || '-'}</p>
            </div>
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <p className="text-[10px] uppercase" style={{ color: colors.textMuted }}>Status</p>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{player.status || 'Active'}</p>
            </div>
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <p className="text-[10px] uppercase" style={{ color: colors.textMuted }}>Joined</p>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {player.date_joined ? format(new Date(player.date_joined), 'MMM yyyy') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}