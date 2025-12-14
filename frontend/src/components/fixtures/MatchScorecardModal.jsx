import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Trophy, Calendar, MapPin, Clock, Target, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CLUB_CONFIG } from '../ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

export default function MatchScorecardModal({ open, onClose, match }) {
  // Fetch ball-by-ball data for this match
  const { data: balls = [], isLoading } = useQuery({
    queryKey: ['matchBalls', match?.match_id],
    queryFn: () => api.entities.BallByBall.filter({ match_id: match?.match_id }),
    enabled: !!match?.match_id && open,
  });

  // Fetch innings score data
  const { data: inningsScores = [] } = useQuery({
    queryKey: ['inningsScores', match?.match_id],
    queryFn: () => api.entities.InningsScore.filter({ match_id: match?.match_id }),
    enabled: !!match?.match_id && open,
  });

  const ballsPerOver = 6;

  // Process ball data into scorecard format
  const processInningsData = (inningsBalls, battingTeamName, bowlingTeamName) => {
    if (!inningsBalls || inningsBalls.length === 0) return null;

    const sortedBalls = [...inningsBalls].sort((a, b) => {
      if (a.over_number !== b.over_number) return a.over_number - b.over_number;
      return a.ball_number - b.ball_number;
    });

    // Build batsmen stats
    const batsmenMap = new Map();
    const dismissals = [];
    
    sortedBalls.forEach(ball => {
      if (!batsmenMap.has(ball.batsman)) {
        batsmenMap.set(ball.batsman, {
          name: ball.batsman,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissal: '',
          order: batsmenMap.size + 1
        });
      }
      
      const batsman = batsmenMap.get(ball.batsman);
      
      if (ball.extra_type !== 'wide') {
        batsman.balls++;
      }
      batsman.runs += ball.runs || 0;
      if (ball.is_four) batsman.fours++;
      if (ball.is_six) batsman.sixes++;
      
      if (ball.is_wicket) {
        const dismissedName = ball.dismissed_batsman || ball.batsman;
        if (batsmenMap.has(dismissedName)) {
          const dismissed = batsmenMap.get(dismissedName);
          dismissed.isOut = true;
          dismissed.dismissal = formatDismissal(ball);
        }
        
        const runsAtWicket = sortedBalls
          .filter((b, idx) => idx <= sortedBalls.indexOf(ball))
          .reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
        
        dismissals.push({
          wicket: dismissals.length + 1,
          score: runsAtWicket,
          batsman: dismissedName,
        });
      }
    });

    // Build bowlers stats
    const bowlersMap = new Map();
    sortedBalls.forEach(ball => {
      if (!bowlersMap.has(ball.bowler)) {
        bowlersMap.set(ball.bowler, {
          name: ball.bowler,
          balls: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
          order: bowlersMap.size + 1
        });
      }
      
      const bowler = bowlersMap.get(ball.bowler);
      
      if (!ball.extra_type || ball.extra_type === 'bye' || ball.extra_type === 'leg_bye' || ball.is_legal_delivery) {
        bowler.balls++;
      }
      
      if (ball.extra_type === 'wide') {
        bowler.runs += ball.extras || 1;
        bowler.wides++;
      } else if (ball.extra_type === 'no_ball') {
        bowler.runs += (ball.runs || 0) + (ball.extras || 1);
        bowler.noBalls++;
      } else if (ball.extra_type !== 'bye' && ball.extra_type !== 'leg_bye') {
        bowler.runs += ball.runs || 0;
      }
      
      if (ball.is_wicket && ball.wicket_type !== 'run_out') {
        bowler.wickets++;
      }
    });

    // Calculate extras
    const extras = {
      wides: sortedBalls.filter(b => b.extra_type === 'wide').reduce((sum, b) => sum + (b.extras || 1), 0),
      noBalls: sortedBalls.filter(b => b.extra_type === 'no_ball').reduce((sum, b) => sum + (b.extras || 1), 0),
      byes: sortedBalls.filter(b => b.extra_type === 'bye').reduce((sum, b) => sum + (b.extras || 0), 0),
      legByes: sortedBalls.filter(b => b.extra_type === 'leg_bye').reduce((sum, b) => sum + (b.extras || 0), 0),
    };
    extras.total = extras.wides + extras.noBalls + extras.byes + extras.legByes;

    const legalBalls = sortedBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
    const totalRuns = sortedBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const totalWickets = sortedBalls.filter(b => b.is_wicket).length;
    const overs = Math.floor(legalBalls.length / ballsPerOver);
    const ballsInOver = legalBalls.length % ballsPerOver;

    return {
      battingTeam: battingTeamName,
      bowlingTeam: bowlingTeamName,
      batsmen: Array.from(batsmenMap.values()).sort((a, b) => a.order - b.order),
      bowlers: Array.from(bowlersMap.values())
        .sort((a, b) => a.order - b.order)
        .map(b => ({
          ...b,
          overs: `${Math.floor(b.balls / ballsPerOver)}.${b.balls % ballsPerOver}`
        })),
      extras,
      total: {
        runs: totalRuns,
        wickets: totalWickets,
        overs: `${overs}.${ballsInOver}`
      },
      fallOfWickets: dismissals,
      runRate: legalBalls.length > 0 ? (totalRuns / (legalBalls.length / ballsPerOver)).toFixed(2) : '0.00'
    };
  };

  const formatDismissal = (ball) => {
    const type = ball.wicket_type;
    const fielder = ball.fielder;
    const bowler = ball.bowler;
    
    switch (type) {
      case 'bowled': return `b ${bowler}`;
      case 'caught': return `c ${fielder || '?'} b ${bowler}`;
      case 'caught_behind': return `c †${fielder || 'wk'} b ${bowler}`;
      case 'caught_and_bowled': return `c & b ${bowler}`;
      case 'lbw': return `lbw b ${bowler}`;
      case 'stumped': return `st †${fielder || 'wk'} b ${bowler}`;
      case 'run_out': return `run out (${fielder || '?'})`;
      case 'hit_wicket': return `hit wicket b ${bowler}`;
      default: return 'out';
    }
  };

  const innings1Balls = balls.filter(b => b.innings === 1);
  const innings2Balls = balls.filter(b => b.innings === 2);

  // Get innings score data if available
  const inn1Score = inningsScores.find(s => s.innings === 1);
  const inn2Score = inningsScores.find(s => s.innings === 2);
  
  const innings1Data = useMemo(() => 
    processInningsData(innings1Balls, match?.team1_name, match?.team2_name), 
    [innings1Balls, match]);
  
  const innings2Data = useMemo(() => 
    processInningsData(innings2Balls, match?.team2_name, match?.team1_name), 
    [innings2Balls, match]);

  const matchDate = match?.match_date ? parseISO(match.match_date) : null;
  const hasDetailedData = balls.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <DialogHeader className="p-4 pb-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <DialogTitle className="text-center" style={{ color: colors.textPrimary }}>
            <div className="text-lg font-bold">{match?.team1_name} vs {match?.team2_name}</div>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm font-normal" style={{ color: colors.textMuted }}>
              {matchDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(matchDate, 'dd MMM yyyy')}
                </span>
              )}
              {match?.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {match.venue}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : !hasDetailedData ? (
          // Show basic match info when no ball data available
          <div className="p-6 space-y-6">
            {/* Score Summary */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: colors.textPrimary }}>{match?.team1_name}</span>
                  <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {match?.team1_score || '-'}
                    {match?.team1_overs && <span className="text-sm font-normal ml-1" style={{ color: colors.textMuted }}>({match.team1_overs})</span>}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: colors.textPrimary }}>{match?.team2_name}</span>
                  <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {match?.team2_score || '-'}
                    {match?.team2_overs && <span className="text-sm font-normal ml-1" style={{ color: colors.textMuted }}>({match.team2_overs})</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Result */}
            {match?.result_summary && (
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: colors.accent + '20' }}>
                <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: colors.accent }} />
                <p className="font-semibold" style={{ color: colors.textPrimary }}>{match.result_summary}</p>
              </div>
            )}

            {/* Man of the Match */}
            {match?.man_of_match && (
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent + '30' }}>
                  <User className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Player of the Match</p>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>{match.man_of_match}</p>
                  {match.mom_performance && (
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{match.mom_performance}</p>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-sm" style={{ color: colors.textMuted }}>
              Detailed scorecard not available for this match
            </p>
          </div>
        ) : (
          // Show detailed scorecard
          <Tabs defaultValue="innings-1" className="w-full">
            <TabsList className="w-full rounded-none" style={{ backgroundColor: colors.surfaceHover }}>
              <TabsTrigger 
                value="innings-1" 
                className="flex-1 rounded-none data-[state=active]:text-white"
                style={{ '--active-bg': colors.accent }}
              >
                1st Innings
                {innings1Data && <span className="ml-2 text-xs opacity-80">{innings1Data.total.runs}/{innings1Data.total.wickets}</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="innings-2" 
                className="flex-1 rounded-none data-[state=active]:text-white"
                style={{ '--active-bg': colors.accent }}
              >
                2nd Innings
                {innings2Data && <span className="ml-2 text-xs opacity-80">{innings2Data.total.runs}/{innings2Data.total.wickets}</span>}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="innings-1" className="m-0">
              <InningsScorecard data={innings1Data} />
            </TabsContent>
            
            <TabsContent value="innings-2" className="m-0">
              <InningsScorecard data={innings2Data} />
            </TabsContent>
          </Tabs>
        )}

        {/* Match Result Footer */}
        {match?.result_summary && hasDetailedData && (
          <div className="p-4" style={{ backgroundColor: colors.accent + '20', borderTop: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-center gap-2 font-semibold" style={{ color: colors.accent }}>
              <Trophy className="w-5 h-5" />
              {match.result_summary}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InningsScorecard({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: colors.textMuted }}>
        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Innings not started yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[50vh]">
      <div className="p-4 space-y-4">
        {/* Innings Summary */}
        <div className="rounded-lg p-4" style={{ backgroundColor: colors.surfaceHover }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>{data.battingTeam}</h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>vs {data.bowlingTeam}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{data.total.runs}/{data.total.wickets}</div>
              <div className="text-sm" style={{ color: colors.textMuted }}>({data.total.overs} ov, RR: {data.runRate})</div>
            </div>
          </div>
        </div>

        {/* Batting Table */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide" style={{ color: colors.accent }}>
            🏏 Batting
          </h4>
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th className="text-left p-2.5" style={{ color: colors.textMuted }}>Batsman</th>
                  <th className="text-right p-2.5 w-12" style={{ color: colors.textMuted }}>R</th>
                  <th className="text-right p-2.5 w-12" style={{ color: colors.textMuted }}>B</th>
                  <th className="text-right p-2.5 w-10" style={{ color: colors.textMuted }}>4s</th>
                  <th className="text-right p-2.5 w-10" style={{ color: colors.textMuted }}>6s</th>
                  <th className="text-right p-2.5 w-14" style={{ color: colors.textMuted }}>SR</th>
                </tr>
              </thead>
              <tbody>
                {data.batsmen.map((bat, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="p-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium" style={{ color: bat.isOut ? colors.textMuted : colors.textPrimary }}>
                          {bat.name}
                          {!bat.isOut && <span className="ml-1" style={{ color: colors.accent }}>*</span>}
                        </span>
                        {bat.dismissal && (
                          <span className="text-[11px]" style={{ color: colors.textMuted }}>{bat.dismissal}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-2.5 font-bold" style={{ color: colors.textPrimary }}>{bat.runs}</td>
                    <td className="text-right p-2.5" style={{ color: colors.textMuted }}>{bat.balls}</td>
                    <td className="text-right p-2.5 text-green-500">{bat.fours}</td>
                    <td className="text-right p-2.5 text-purple-500">{bat.sixes}</td>
                    <td className="text-right p-2.5" style={{ color: colors.textMuted }}>
                      {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Extras Row */}
            <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: `1px solid ${colors.border}` }}>
              <span className="text-sm" style={{ color: colors.textMuted }}>Extras</span>
              <span className="text-sm" style={{ color: colors.textPrimary }}>
                <span className="font-semibold">{data.extras.total}</span>
                <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                  (W:{data.extras.wides}, NB:{data.extras.noBalls}, B:{data.extras.byes}, LB:{data.extras.legByes})
                </span>
              </span>
            </div>
            
            {/* Total Row */}
            <div className="flex items-center justify-between px-3 py-3" style={{ backgroundColor: colors.accent + '20', borderTop: `1px solid ${colors.border}` }}>
              <span className="font-bold" style={{ color: colors.textPrimary }}>TOTAL</span>
              <span className="font-bold" style={{ color: colors.textPrimary }}>
                {data.total.runs}/{data.total.wickets}
                <span className="font-normal ml-2" style={{ color: colors.textSecondary }}>({data.total.overs} ov)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bowling Table */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide" style={{ color: colors.accent }}>
            🎯 Bowling
          </h4>
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th className="text-left p-2.5" style={{ color: colors.textMuted }}>Bowler</th>
                  <th className="text-right p-2.5 w-12" style={{ color: colors.textMuted }}>O</th>
                  <th className="text-right p-2.5 w-10" style={{ color: colors.textMuted }}>M</th>
                  <th className="text-right p-2.5 w-12" style={{ color: colors.textMuted }}>R</th>
                  <th className="text-right p-2.5 w-10" style={{ color: colors.textMuted }}>W</th>
                  <th className="text-right p-2.5 w-14" style={{ color: colors.textMuted }}>Econ</th>
                </tr>
              </thead>
              <tbody>
                {data.bowlers.map((bowl, idx) => {
                  const economy = parseFloat(bowl.overs) > 0 ? (bowl.runs / parseFloat(bowl.overs)).toFixed(2) : '-';
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td className="p-2.5 font-medium" style={{ color: colors.textPrimary }}>{bowl.name}</td>
                      <td className="text-right p-2.5" style={{ color: colors.textSecondary }}>{bowl.overs}</td>
                      <td className="text-right p-2.5" style={{ color: colors.textMuted }}>{bowl.maidens}</td>
                      <td className="text-right p-2.5" style={{ color: colors.textSecondary }}>{bowl.runs}</td>
                      <td className="text-right p-2.5 font-bold" style={{ color: colors.accent }}>{bowl.wickets}</td>
                      <td className="text-right p-2.5" style={{ color: colors.textMuted }}>{economy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fall of Wickets */}
        {data.fallOfWickets.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide text-red-500">
              📉 Fall of Wickets
            </h4>
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.surfaceHover }}>
              <div className="flex flex-wrap gap-2">
                {data.fallOfWickets.map((fow, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs py-1 border-red-500/50 text-red-500"
                  >
                    <span className="font-bold mr-1">{fow.score}-{fow.wicket}</span>
                    <span className="opacity-70">({fow.batsman})</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}