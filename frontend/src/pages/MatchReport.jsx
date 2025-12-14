import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Trophy, Clock, Users, Target, Loader2, Check, HelpCircle, X, AlertTriangle, Share2, Download, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import MatchAvailabilityList from '@/components/fixtures/MatchAvailabilityList';
import { toast } from 'sonner';
import { Toaster } from "@/components/ui/sonner";
import { 
  normalizeBalls, 
  processBattingStats, 
  processBowlingStats, 
  processFallOfWickets, 
  calculateExtras, 
  calculateInningsTotals 
} from '@/components/scoring/BallDataProcessor';
import { generateBallByBallPDF } from '@/components/scoring/BallByBallPDFExport';
import DetailedScorecard from '@/components/scoring/DetailedScorecard';

const theme = CLUB_CONFIG.theme || {};
const colors = theme.colors || {};

export default function MatchReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('id');
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const matches = await api.entities.TournamentMatch.filter({ id: matchId });
      return matches[0];
    },
    enabled: !!matchId,
  });

  const { data: rawBallByBall = [] } = useQuery({
    queryKey: ['matchBalls', matchId],
    queryFn: async () => {
      console.log('Fetching balls for match_id:', matchId);
      const result = await api.entities.BallByBall.filter({ match_id: matchId }, 'over_number');
      console.log('BallByBall filter result:', result?.length, result);
      return result;
    },
    enabled: !!matchId,
  });

  // Normalize ball data using shared processor
  const ballByBall = useMemo(() => {
    const normalized = normalizeBalls(rawBallByBall);
    console.log('MatchReport - Raw balls:', rawBallByBall?.length, 'Normalized:', normalized?.length);
    console.log('MatchReport - Sample ball:', normalized?.[0]);
    return normalized;
  }, [rawBallByBall]);

  const { data: inningsScores = [] } = useQuery({
    queryKey: ['inningsScores', matchId],
    queryFn: () => api.entities.InningsScore.filter({ match_id: matchId }),
    enabled: !!matchId,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['matchAvailability', matchId],
    queryFn: () => api.entities.MatchAvailability.filter({ match_id: matchId }),
    enabled: !!matchId && !!user,
  });

  // Process ball data into innings using shared processor - must be before early returns
  // First filter by innings from normalized balls, then pass to stat processors
  const innings1Balls = useMemo(() => {
    const normalized = ballByBall.filter(b => Math.floor(b.innings) === 1);
    return normalized.sort((a, b) => {
      if (a.over_number !== b.over_number) return a.over_number - b.over_number;
      return a.ball_number - b.ball_number;
    });
  }, [ballByBall]);
  
  const innings2Balls = useMemo(() => {
    const normalized = ballByBall.filter(b => Math.floor(b.innings) === 2);
    return normalized.sort((a, b) => {
      if (a.over_number !== b.over_number) return a.over_number - b.over_number;
      return a.ball_number - b.ball_number;
    });
  }, [ballByBall]);

  // Process stats using shared processor - must be before early returns
  const innings1Batting = useMemo(() => processBattingStats(innings1Balls), [innings1Balls]);
  const innings2Batting = useMemo(() => processBattingStats(innings2Balls), [innings2Balls]);
  const innings1Bowling = useMemo(() => processBowlingStats(innings1Balls), [innings1Balls]);
  const innings2Bowling = useMemo(() => processBowlingStats(innings2Balls), [innings2Balls]);
  const innings1FOW = useMemo(() => processFallOfWickets(innings1Balls), [innings1Balls]);
  const innings2FOW = useMemo(() => processFallOfWickets(innings2Balls), [innings2Balls]);
  const innings1Extras = useMemo(() => calculateExtras(innings1Balls), [innings1Balls]);
  const innings2Extras = useMemo(() => calculateExtras(innings2Balls), [innings2Balls]);
  const innings1Totals = useMemo(() => calculateInningsTotals(innings1Balls), [innings1Balls]);
  const innings2Totals = useMemo(() => calculateInningsTotals(innings2Balls), [innings2Balls]);

  // Download PDF handler
  const handleDownloadPDF = () => {
    generateBallByBallPDF({
      match,
      balls: ballByBall,
      innings1Data: {
        battingTeam: innings1Team,
        batsmen: innings1Batting,
        bowlers: innings1Bowling,
        extras: innings1Extras,
        fallOfWickets: innings1FOW,
        totals: innings1Totals
      },
      innings2Data: {
        battingTeam: innings2Team,
        batsmen: innings2Batting,
        bowlers: innings2Bowling,
        extras: innings2Extras,
        fallOfWickets: innings2FOW,
        totals: innings2Totals
      },
      innings1Balls,
      innings2Balls
    });
    toast.success('Scorecard ready for download');
  };

  if (matchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen pt-24 px-4" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>Match not found</h1>
          <Link to={createPageUrl('Fixtures')} className="text-sm" style={{ color: colors.accent }}>
            ← Back to Fixtures
          </Link>
        </div>
      </div>
    );
  }

  const matchDate = match.match_date ? parseISO(match.match_date) : null;
  const isCompleted = match.status === 'completed';

  // Get batting team names
  const innings1Team = innings1Balls[0]?.batting_team || match.team1_name;
  const innings2Team = innings2Balls[0]?.batting_team || match.team2_name;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="pt-20 pb-8" style={{ backgroundColor: colors.secondary }}>
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            to={createPageUrl('Fixtures')} 
            className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"
            style={{ color: colors.textMuted }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fixtures
          </Link>

          {/* Match Header Card */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            {/* Status Bar */}
            <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: colors.accent }}>
              <Badge className={isCompleted ? 'bg-slate-600 text-white' : 'bg-green-500 text-white'}>
                {isCompleted ? 'Completed' : match.status}
              </Badge>
              <span className="text-xs text-white/80">
                {match.stage && `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}`}
                {match.group && ` • Group ${match.group}`}
              </span>
            </div>

            {/* Teams & Scores */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                       style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
                    {match.team1_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${match.winner_name === match.team1_name ? 'text-emerald-500' : ''}`}
                        style={{ color: match.winner_name === match.team1_name ? undefined : colors.textPrimary }}>
                      {match.team1_name}
                    </h3>
                  </div>
                </div>
                {match.team1_score && (
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{match.team1_score}</span>
                    {match.team1_overs && <span className="text-sm ml-1" style={{ color: colors.textMuted }}>({match.team1_overs})</span>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                       style={{ backgroundColor: colors.border, color: colors.textSecondary }}>
                    {match.team2_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${match.winner_name === match.team2_name ? 'text-emerald-500' : ''}`}
                        style={{ color: match.winner_name === match.team2_name ? undefined : colors.textPrimary }}>
                      {match.team2_name}
                    </h3>
                  </div>
                </div>
                {match.team2_score && (
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{match.team2_score}</span>
                    {match.team2_overs && <span className="text-sm ml-1" style={{ color: colors.textMuted }}>({match.team2_overs})</span>}
                  </div>
                )}
              </div>

              {/* Result */}
              {isCompleted && match.result_summary && (
                <div className="mt-4 p-3 rounded-lg text-center font-medium"
                     style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}>
                  {match.result_summary}
                </div>
              )}

              {/* Match Info */}
              <div className="mt-4 pt-4 flex flex-wrap gap-4 text-sm border-t" style={{ borderColor: colors.border, color: colors.textMuted }}>
                {matchDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(matchDate, 'EEEE, dd MMMM yyyy')}
                  </div>
                )}
                {matchDate && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {format(matchDate, 'h:mm a')}
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {match.venue}
                  </div>
                )}
              </div>

              {/* Toss & MOM */}
              <div className="mt-3 flex flex-wrap gap-4 text-sm" style={{ color: colors.textMuted }}>
                {match.toss_winner && (
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    Toss: {match.toss_winner} chose to {match.toss_decision}
                  </div>
                )}
                {match.man_of_match && (
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    MOM: {match.man_of_match}
                    {match.mom_performance && <span className="opacity-70">({match.mom_performance})</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Availability Section - only show for non-completed matches */}
      {user && !isCompleted && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <MatchAvailabilityList availability={availability} />
        </div>
      )}

      {/* Scorecard Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {ballByBall.length > 0 ? (
          <>
            <Tabs defaultValue="summary" className="w-full">
              {/* View Toggle */}
              <div className="mb-4">
                <TabsList style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                  <TabsTrigger value="summary" className="data-[state=active]:text-black">Summary</TabsTrigger>
                  <TabsTrigger value="detailed" className="data-[state=active]:text-black">Detailed</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="summary">
                <Tabs defaultValue="innings1" className="w-full">
                  <TabsList className="w-full mb-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                    <TabsTrigger 
                      value="innings1" 
                      className="flex-1 data-[state=active]:text-black" 
                      style={{ '--tw-bg-opacity': 1 }}
                    >
                      {innings1Team} - {match.team1_score || '0/0'}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="innings2" 
                      className="flex-1 data-[state=active]:text-black"
                      style={{ '--tw-bg-opacity': 1 }}
                    >
                      {innings2Team} - {match.team2_score || '0/0'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="innings1">
                    <InningsCard 
                      battingTeam={innings1Team}
                      bowlingTeam={innings2Team}
                      batsmen={innings1Batting}
                      bowlers={innings2Bowling}
                      extras={innings1Extras}
                      score={match.team1_score}
                      overs={match.team1_overs}
                      fallOfWickets={innings1FOW}
                      inningsScore={inningsScores.find(i => i.innings === 1)}
                      totals={innings1Totals}
                    />
                  </TabsContent>

                  <TabsContent value="innings2">
                    <InningsCard 
                      battingTeam={innings2Team}
                      bowlingTeam={innings1Team}
                      batsmen={innings2Batting}
                      bowlers={innings1Bowling}
                      extras={innings2Extras}
                      score={match.team2_score}
                      overs={match.team2_overs}
                      fallOfWickets={innings2FOW}
                      inningsScore={inningsScores.find(i => i.innings === 2)}
                      totals={innings2Totals}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="detailed">
                <DetailedScorecard 
                  match={match}
                  innings1Data={{
                    battingTeam: innings1Team,
                    batsmen: innings1Batting,
                    bowlers: innings1Bowling,
                    extras: innings1Extras,
                    fallOfWickets: innings1FOW,
                    totals: innings1Totals
                  }}
                  innings2Data={{
                    battingTeam: innings2Team,
                    batsmen: innings2Batting,
                    bowlers: innings2Bowling,
                    extras: innings2Extras,
                    fallOfWickets: innings2FOW,
                    totals: innings2Totals
                  }}
                  innings1Balls={innings1Balls}
                  innings2Balls={innings2Balls}
                  onDownloadPDF={handleDownloadPDF}
                />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
            <p style={{ color: colors.textSecondary }}>Detailed scorecard not available for this match</p>
            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Ball-by-ball data will appear here once scoring begins</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InningsCard({ battingTeam, bowlingTeam, batsmen, bowlers, extras, score, overs, fallOfWickets = [], inningsScore, totals }) {
  // Use calculated totals if available, otherwise parse from score string
  const totalRuns = totals?.runs ?? (parseInt(score?.split('/')[0]) || 0);
  const runRate = totals?.runRate || '0.00';
  
  return (
    <div className="space-y-4">
      {/* Innings Summary Header */}
      <div 
        className="rounded-xl p-4"
        style={{ 
          background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceHover} 100%)`,
          border: `1px solid ${colors.border}` 
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{battingTeam}</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>vs {bowlingTeam}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{score || '0/0'}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {overs && `(${overs} ov)`} • RR: {runRate}
            </div>
          </div>
        </div>
      </div>

      {/* Batting */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: colors.surfaceHover }}>
          <span className="text-emerald-400">🏏</span>
          <span className="font-semibold text-sm uppercase tracking-wide" style={{ color: colors.textSecondary }}>Batting</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th className="text-left p-3 font-medium" style={{ color: colors.textMuted }}>Batter</th>
                <th className="text-center p-3 font-medium w-12" style={{ color: colors.textMuted }}>R</th>
                <th className="text-center p-3 font-medium w-12" style={{ color: colors.textMuted }}>B</th>
                <th className="text-center p-3 font-medium w-10" style={{ color: colors.textMuted }}>4s</th>
                <th className="text-center p-3 font-medium w-10" style={{ color: colors.textMuted }}>6s</th>
                <th className="text-center p-3 font-medium w-14" style={{ color: colors.textMuted }}>SR</th>
              </tr>
            </thead>
            <tbody>
              {batsmen.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center" style={{ color: colors.textMuted }}>
                  No batting data available
                </td>
              </tr>
              ) : (
              batsmen.map((b, i) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                const isHighScore = batsmen.length > 0 && b.runs === Math.max(...batsmen.map(bat => bat.runs)) && b.runs > 0;
                const isOut = b.isOut || b.out;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isOut ? '' : 'text-emerald-400'}`} style={{ color: isOut ? colors.textPrimary : undefined }}>
                          {b.name}
                          {!isOut && <span className="ml-1">*</span>}
                          {isHighScore && <Trophy className="w-3 h-3 inline ml-1 text-amber-400" />}
                        </span>
                        {isOut && b.dismissal && (
                          <span className="text-xs" style={{ color: colors.textMuted }}>{b.dismissal}</span>
                        )}
                        {!isOut && (
                          <span className="text-xs text-emerald-500">not out</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3 font-bold" style={{ color: colors.textPrimary }}>{b.runs}</td>
                    <td className="text-center p-3" style={{ color: colors.textSecondary }}>{b.balls}</td>
                    <td className="text-center p-3 text-green-400">{b.fours || 0}</td>
                    <td className="text-center p-3 text-purple-400">{b.sixes || 0}</td>
                    <td className="text-center p-3" style={{ color: colors.textSecondary }}>{sr}</td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
        {/* Extras */}
        <div className="px-4 py-2 flex justify-between text-sm" style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.surface }}>
          <span style={{ color: colors.textMuted }}>Extras</span>
          <span style={{ color: colors.textPrimary }}>
            <span className="font-semibold">{extras.total}</span>
            <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
              (W:{extras.wides || 0}, NB:{extras.noBalls || 0}, B:{extras.byes || 0}, LB:{extras.legByes || 0})
            </span>
          </span>
        </div>
        {/* Total */}
        <div className="px-4 py-3 flex justify-between" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderTop: `1px solid rgba(16, 185, 129, 0.3)` }}>
          <span className="font-bold" style={{ color: colors.textPrimary }}>TOTAL</span>
          <span className="font-bold" style={{ color: colors.textPrimary }}>
            {score || '0/0'}
            {overs && <span className="font-normal ml-2" style={{ color: colors.textSecondary }}>({overs} ov)</span>}
          </span>
        </div>
      </div>

      {/* Bowling */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: colors.surfaceHover }}>
          <span className="text-blue-400">🎯</span>
          <span className="font-semibold text-sm uppercase tracking-wide" style={{ color: colors.textSecondary }}>Bowling</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th className="text-left p-3 font-medium" style={{ color: colors.textMuted }}>Bowler</th>
                <th className="text-center p-3 font-medium w-12" style={{ color: colors.textMuted }}>O</th>
                <th className="text-center p-3 font-medium w-10" style={{ color: colors.textMuted }}>M</th>
                <th className="text-center p-3 font-medium w-12" style={{ color: colors.textMuted }}>R</th>
                <th className="text-center p-3 font-medium w-10" style={{ color: colors.textMuted }}>W</th>
                <th className="text-center p-3 font-medium w-14" style={{ color: colors.textMuted }}>Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center" style={{ color: colors.textMuted }}>
                    No bowling data available
                  </td>
                </tr>
              ) : (
                bowlers.map((b, i) => {
                  const isBestBowler = bowlers.length > 0 && b.wickets === Math.max(...bowlers.map(bow => bow.wickets)) && b.wickets > 0;
                  const economy = b.economy || (b.legalBalls > 0 ? ((b.runs / b.legalBalls) * 6).toFixed(2) : '0.00');
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium" style={{ color: colors.textPrimary }}>
                        {b.name}
                        {isBestBowler && <Trophy className="w-3 h-3 inline ml-1 text-amber-400" />}
                      </td>
                      <td className="text-center p-3" style={{ color: colors.textSecondary }}>{b.overs}</td>
                      <td className="text-center p-3" style={{ color: colors.textMuted }}>{b.maidens || 0}</td>
                      <td className="text-center p-3" style={{ color: colors.textSecondary }}>{b.runs}</td>
                      <td className="text-center p-3 font-bold text-blue-400">{b.wickets}</td>
                      <td className="text-center p-3" style={{ color: colors.textSecondary }}>{economy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {fallOfWickets && fallOfWickets.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: colors.surfaceHover }}>
            <span className="text-red-400">📉</span>
            <span className="font-semibold text-sm uppercase tracking-wide" style={{ color: colors.textSecondary }}>Fall of Wickets</span>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {fallOfWickets.map((fow, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="border-red-600/50 text-red-400 text-xs py-1"
              >
                <span className="font-bold mr-1">{fow.score}-{fow.wicket}</span>
                <span className="opacity-70">({fow.batsman}, {fow.overs})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}