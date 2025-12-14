import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';

export default function LiveOverlay() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('match');
  const layout = urlParams.get('layout') || 'full';
  const theme = urlParams.get('theme') || 'default';
  const sponsorLogo = urlParams.get('sponsor') || '';

  // Fetch match data
  const { data: match } = useQuery({
    queryKey: ['overlayMatch', matchId],
    queryFn: async () => {
      const matches = await api.entities.TournamentMatch.filter({ id: matchId });
      return matches[0];
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });

  // Fetch balls
  const { data: balls = [] } = useQuery({
    queryKey: ['overlayBalls', matchId],
    queryFn: () => api.entities.BallByBall.filter({ match_id: matchId }),
    enabled: !!matchId,
    refetchInterval: 2000,
  });

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['overlayTeams'],
    queryFn: () => api.entities.Team.list(),
  });

  // Calculate scores
  const innings1Balls = balls.filter(b => b.innings === 1).sort((a, b) => {
    if (a.over_number !== b.over_number) return a.over_number - b.over_number;
    return a.ball_number - b.ball_number;
  });
  
  const innings2Balls = balls.filter(b => b.innings === 2).sort((a, b) => {
    if (a.over_number !== b.over_number) return a.over_number - b.over_number;
    return a.ball_number - b.ball_number;
  });

  // Get balls per over from match settings (default 6)
  const ballsPerOver = match?.balls_per_over || 6;

  const calculateScore = (inningsBalls) => {
    const runs = inningsBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = inningsBalls.filter(b => b.is_wicket).length;
    const legalBalls = inningsBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
    const overs = Math.floor(legalBalls.length / ballsPerOver);
    const ballsInOver = legalBalls.length % ballsPerOver;
    return { runs, wickets, overs: `${overs}.${ballsInOver}`, legalBallCount: legalBalls.length };
  };

  const innings1Score = calculateScore(innings1Balls);
  const innings2Score = calculateScore(innings2Balls);

  // Current innings detection
  const currentInnings = innings2Balls.length > 0 ? 2 : 1;
  const currentScore = currentInnings === 1 ? innings1Score : innings2Score;
  const currentBalls = currentInnings === 1 ? innings1Balls : innings2Balls;

  // Get current batsmen and bowler
  const currentBatsmen = useMemo(() => {
    if (currentBalls.length === 0) return { striker: null, nonStriker: null };
    const lastBall = currentBalls[currentBalls.length - 1];
    return {
      striker: lastBall.batsman,
      nonStriker: lastBall.non_striker
    };
  }, [currentBalls]);

  const currentBowler = useMemo(() => {
    if (currentBalls.length === 0) return null;
    const lastBall = currentBalls[currentBalls.length - 1];
    return lastBall.bowler;
  }, [currentBalls]);

  // Get batsman stats
  const getBatsmanStats = (name) => {
    const batBalls = currentBalls.filter(b => b.batsman === name);
    const runs = batBalls.reduce((sum, b) => sum + (b.runs || 0), 0);
    const faced = batBalls.filter(b => b.extra_type !== 'wide').length;
    return { runs, balls: faced };
  };

  // Get bowler stats
  const getBowlerStats = (name) => {
    const bowlBalls = currentBalls.filter(b => b.bowler === name);
    const legal = bowlBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
    const overs = Math.floor(legal.length / ballsPerOver);
    const remainder = legal.length % ballsPerOver;
    const runs = bowlBalls.reduce((sum, b) => {
      let r = b.runs || 0;
      if (b.extra_type === 'wide' || b.extra_type === 'no_ball') r += b.extras || 0;
      return sum + r;
    }, 0);
    const wickets = bowlBalls.filter(b => b.is_wicket && b.wicket_type !== 'run_out').length;
    return { overs: `${overs}.${remainder}`, runs, wickets };
  };

  // Get current over balls
  const legalBalls = currentBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
  const currentOverNumber = Math.floor(legalBalls.length / ballsPerOver) + 1;
  const currentOverBalls = currentBalls.filter(b => b.over_number === currentOverNumber);

  // Team names - TournamentMatch uses team1_id/team2_id
  const homeTeam = teams.find(t => t.id === match?.team1_id);
  const awayTeam = teams.find(t => t.id === match?.team2_id);
  const homeTeamName = homeTeam?.short_name || homeTeam?.name || match?.team1_name || 'TEAM 1';
  const awayTeamName = awayTeam?.short_name || awayTeam?.name || match?.team2_name || 'TEAM 2';

  // Run rate
  const runRate = legalBalls.length > 0 ? (currentScore.runs / (legalBalls.length / ballsPerOver)).toFixed(2) : '0.00';
  
  // Target (2nd innings)
  const target = currentInnings === 2 ? innings1Score.runs + 1 : null;
  const runsNeeded = target ? target - currentScore.runs : null;

  if (!matchId) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-white">No match ID provided</p>
      </div>
    );
  }

  // Theme colors
  const themes = {
    default: {
      primary: 'from-emerald-700 to-teal-700',
      bg: 'from-slate-900/95 via-slate-800/95 to-slate-900/95'
    },
    blue: {
      primary: 'from-blue-700 to-indigo-700',
      bg: 'from-slate-900/95 via-blue-900/95 to-slate-900/95'
    },
    red: {
      primary: 'from-red-700 to-rose-700',
      bg: 'from-slate-900/95 via-red-900/95 to-slate-900/95'
    },
    gold: {
      primary: 'from-amber-600 to-orange-600',
      bg: 'from-slate-900/95 via-amber-900/95 to-slate-900/95'
    },
    purple: {
      primary: 'from-purple-700 to-violet-700',
      bg: 'from-slate-900/95 via-purple-900/95 to-slate-900/95'
    }
  };
  
  const currentTheme = themes[theme] || themes.default;

  // Track last ball for animations
  const prevBallCountRef = useRef(currentBalls.length);
  const [showBoundary, setShowBoundary] = useState(null);
  const [showWicket, setShowWicket] = useState(null);

  useEffect(() => {
    if (currentBalls.length > prevBallCountRef.current) {
      const lastBall = currentBalls[currentBalls.length - 1];
      
      if (lastBall.is_six) {
        setShowBoundary(6);
        setTimeout(() => setShowBoundary(null), 3000);
      } else if (lastBall.is_four) {
        setShowBoundary(4);
        setTimeout(() => setShowBoundary(null), 3000);
      } else if (lastBall.is_wicket) {
        setShowWicket(lastBall);
        setTimeout(() => setShowWicket(null), 3000);
      }
    }
    prevBallCountRef.current = currentBalls.length;
  }, [currentBalls]);

  // Boundary Animation Component
  const BoundaryOverlay = ({ type }) => (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="animate-bounce">
        <div 
          className={`text-[200px] font-black ${type === 6 ? 'text-purple-400' : 'text-green-400'}`}
          style={{ 
            textShadow: `0 0 60px ${type === 6 ? '#a855f7' : '#22c55e'}, 0 0 120px ${type === 6 ? '#a855f7' : '#22c55e'}`,
            animation: 'pulse 0.5s ease-in-out infinite'
          }}
        >
          {type}
        </div>
      </div>
      <div className="absolute text-6xl font-bold text-white tracking-widest" style={{ bottom: '30%' }}>
        {type === 6 ? 'MAXIMUM!' : 'FOUR!'}
      </div>
    </div>
  );

  // Wicket Animation Component  
  const WicketOverlay = ({ ball }) => (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="text-center">
        <div 
          className="text-[180px] font-black text-red-500"
          style={{ textShadow: '0 0 60px #ef4444, 0 0 120px #ef4444' }}
        >
          OUT!
        </div>
        <div className="text-4xl font-bold text-white mt-4">
          {ball.dismissed_batsman || ball.batsman}
        </div>
        <div className="text-2xl text-red-300 mt-2 capitalize">
          {ball.wicket_type?.replace('_', ' ')}
        </div>
      </div>
    </div>
  );

  // Track milestones for wagon wheel display
  const [showMilestoneWagonWheel, setShowMilestoneWagonWheel] = useState(null);
  const [showShotLine, setShowShotLine] = useState(null);
  const prevBatsmanScoresRef = useRef({});

  // Calculate batsman scores
  const getBatsmanTotalRuns = (name) => {
    return currentBalls
      .filter(b => b.batsman === name)
      .reduce((sum, b) => sum + (b.runs || 0), 0);
  };

  // Get all balls for a batsman (for wagon wheel)
  const getBatsmanBalls = (name) => {
    return currentBalls.filter(b => b.batsman === name && b.wagon_wheel_zone);
  };

  useEffect(() => {
    if (currentBalls.length > prevBallCountRef.current) {
      const lastBall = currentBalls[currentBalls.length - 1];
      const batsman = lastBall.batsman;
      const currentScore = getBatsmanTotalRuns(batsman);
      const prevScore = prevBatsmanScoresRef.current[batsman] || 0;

      // Check for milestone first (50, 75, 100, 125, etc.)
      const milestones = [50, 75, 100, 125, 150, 175, 200];
      const crossedMilestone = milestones.find(m => prevScore < m && currentScore >= m);
      
      if (crossedMilestone && (lastBall.is_four || lastBall.is_six)) {
        // Show full wagon wheel for milestone (takes priority)
        setShowMilestoneWagonWheel({
          batsman,
          score: currentScore,
          milestone: crossedMilestone,
          balls: getBatsmanBalls(batsman)
        });
        setTimeout(() => setShowMilestoneWagonWheel(null), 5000);
      } else if ((lastBall.is_four || lastBall.is_six) && lastBall.wagon_wheel_zone) {
        // Show shot line for every boundary with recorded direction
        setShowShotLine(lastBall);
        setTimeout(() => setShowShotLine(null), 2500);
      }

      // Update prev scores
      prevBatsmanScoresRef.current[batsman] = currentScore;
    }
    prevBallCountRef.current = currentBalls.length;
  }, [currentBalls]);

  // Shot Line Overlay Component (just shows direction line for 4/6)
  const ShotLineOverlay = ({ ball }) => {
    const zone = ball.wagon_wheel_zone;
    const runs = ball.runs || 0;
    
    const zoneAngles = {
      1: -22.5, 2: -67.5, 3: -112.5, 4: -157.5,
      5: 157.5, 6: 112.5, 7: 67.5, 8: 22.5,
    };
    
    const angle = zoneAngles[zone] || 0;
    const isSix = runs === 6;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
        <div className="relative" style={{ width: 300, height: 300 }}>
          <svg width="300" height="300">
            {/* Animated shot line from center outward */}
            <line
              x1="150"
              y1="150"
              x2={150 + 140 * Math.cos((angle - 90) * Math.PI / 180)}
              y2={150 + 140 * Math.sin((angle - 90) * Math.PI / 180)}
              stroke={isSix ? '#a855f7' : '#22c55e'}
              strokeWidth={8}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 20px ${isSix ? '#a855f7' : '#22c55e'})`,
                animation: 'shotLine 0.4s ease-out forwards'
              }}
            />
            
            {/* Ball at end */}
            <circle
              cx={150 + 140 * Math.cos((angle - 90) * Math.PI / 180)}
              cy={150 + 140 * Math.sin((angle - 90) * Math.PI / 180)}
              r="25"
              fill={isSix ? '#a855f7' : '#22c55e'}
              style={{ filter: `drop-shadow(0 0 25px ${isSix ? '#a855f7' : '#22c55e'})` }}
            />
            
            {/* Runs number */}
            <text
              x={150 + 140 * Math.cos((angle - 90) * Math.PI / 180)}
              y={150 + 140 * Math.sin((angle - 90) * Math.PI / 180) + 8}
              textAnchor="middle"
              fill="white"
              fontSize="28"
              fontWeight="bold"
            >
              {runs}
            </text>
            
            {/* Batsman dot */}
            <circle cx="150" cy="150" r="8" fill="white" />
          </svg>
        </div>
        
        <style>{`
          @keyframes shotLine {
            from { stroke-dasharray: 0, 500; opacity: 0; }
            to { stroke-dasharray: 500, 0; opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  // Milestone Wagon Wheel Overlay (full wheel with all shots)
  const MilestoneWagonWheelOverlay = ({ data }) => {
    const zoneAngles = {
      1: -22.5, 2: -67.5, 3: -112.5, 4: -157.5,
      5: 157.5, 6: 112.5, 7: 67.5, 8: 22.5,
    };
    
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 bg-black/50">
        <div className="text-center">
          {/* Milestone text */}
          <div className="text-6xl font-black text-amber-400 mb-4" style={{ textShadow: '0 0 30px #f59e0b' }}>
            {data.milestone}!
          </div>
          <div className="text-3xl font-bold text-white mb-6">
            {data.batsman} • {data.score} runs
          </div>
          
          {/* Wagon Wheel */}
          <div className="mx-auto" style={{ width: 400, height: 400 }}>
            <svg width="400" height="400">
              {/* Field */}
              <circle cx="200" cy="200" r="180" fill="rgba(34, 197, 94, 0.15)" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" />
              <circle cx="200" cy="200" r="100" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" strokeDasharray="5,5" />
              <rect x="195" y="160" width="10" height="80" fill="rgba(210, 180, 140, 0.5)" rx="2" />
              
              {/* All shot lines */}
              {data.balls.map((ball, idx) => {
                const zone = ball.wagon_wheel_zone;
                const angle = zoneAngles[zone] || 0;
                const isSix = ball.is_six;
                const isFour = ball.is_four;
                const length = isSix ? 180 : isFour ? 160 : 100;
                
                return (
                  <line
                    key={idx}
                    x1="200"
                    y1="200"
                    x2={200 + length * Math.cos((angle - 90) * Math.PI / 180)}
                    y2={200 + length * Math.sin((angle - 90) * Math.PI / 180)}
                    stroke={isSix ? '#a855f7' : isFour ? '#22c55e' : '#fbbf24'}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                );
              })}
              
              {/* Batsman */}
              <circle cx="200" cy="200" r="8" fill="white" />
            </svg>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-purple-500 rounded" />
              <span className="text-white">Sixes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded" />
              <span className="text-white">Fours</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Full Layout - Bottom scoreboard
  if (layout === 'full') {
    const strikerStats = currentBatsmen.striker ? getBatsmanStats(currentBatsmen.striker) : null;
    const nonStrikerStats = currentBatsmen.nonStriker ? getBatsmanStats(currentBatsmen.nonStriker) : null;
    const bowlerStats = currentBowler ? getBowlerStats(currentBowler) : null;

    return (
      <div className="min-h-screen bg-transparent flex flex-col justify-end p-4">
        {/* Boundary Animation */}
        {showBoundary && <BoundaryOverlay type={showBoundary} />}
        
        {/* Wicket Animation */}
        {showWicket && <WicketOverlay ball={showWicket} />}
        
        {/* Shot Line Overlay for 4s/6s */}
        {showShotLine && !showBoundary && <ShotLineOverlay ball={showShotLine} />}
        
        {/* Milestone Wagon Wheel Overlay */}
        {showMilestoneWagonWheel && <MilestoneWagonWheelOverlay data={showMilestoneWagonWheel} />}
        
        <div className={`bg-gradient-to-r ${currentTheme.bg} backdrop-blur rounded-t-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto w-full relative`}>
          {/* Sponsor Logo */}
          {sponsorLogo && (
            <div className="absolute top-2 right-4 z-10">
              <img src={sponsorLogo} alt="Sponsor" className="h-8 object-contain" />
            </div>
          )}
          {/* Score Bar */}
          <div className={`bg-gradient-to-r ${currentTheme.primary} px-6 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="text-2xl font-bold">{homeTeamName}</span>
                <span className="text-white/70 mx-2">vs</span>
                <span className="text-lg text-white/80">{awayTeamName}</span>
              </div>
            </div>
            <div className="text-right text-white">
              <div className="text-4xl font-bold tracking-tight">
                {currentScore.runs}/{currentScore.wickets}
              </div>
              <div className="text-emerald-200 text-sm">
                ({currentScore.overs} ov) • RR: {runRate}
                {target && <span className="ml-2 text-amber-300">Need {runsNeeded}</span>}
              </div>
            </div>
          </div>

          {/* Details Bar */}
          <div className="px-6 py-3 flex items-center justify-between text-white">
            {/* Batsmen */}
            <div className="flex gap-6">
              {currentBatsmen.striker && (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">*</span>
                  <span className="font-medium">{currentBatsmen.striker}</span>
                  <span className="text-slate-400">
                    {strikerStats?.runs}({strikerStats?.balls})
                  </span>
                </div>
              )}
              {currentBatsmen.nonStriker && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-300">{currentBatsmen.nonStriker}</span>
                  <span className="text-slate-500">
                    {nonStrikerStats?.runs}({nonStrikerStats?.balls})
                  </span>
                </div>
              )}
            </div>

            {/* Bowler */}
            {currentBowler && (
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🎯</span>
                <span className="font-medium">{currentBowler}</span>
                <span className="text-slate-400">
                  {bowlerStats?.wickets}-{bowlerStats?.runs} ({bowlerStats?.overs})
                </span>
              </div>
            )}

            {/* This Over */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">This Over:</span>
              <div className="flex gap-1">
                {currentOverBalls.map((ball, idx) => (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      ball.is_wicket ? 'bg-red-500 text-white' :
                      ball.is_six ? 'bg-purple-500 text-white' :
                      ball.is_four ? 'bg-green-500 text-white' :
                      ball.extra_type ? 'bg-amber-500 text-black' :
                      'bg-slate-600 text-white'
                    }`}
                  >
                    {ball.display_value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Minimal Layout - Corner score
  if (layout === 'minimal') {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <div className="inline-block bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur rounded-xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg">{homeTeamName}</span>
              <div className="text-white">
                <span className="text-2xl font-bold">{currentScore.runs}/{currentScore.wickets}</span>
                <span className="text-emerald-200 text-sm ml-2">({currentScore.overs})</span>
              </div>
            </div>
          </div>
          {target && (
            <div className="px-4 py-1 text-amber-300 text-sm bg-black/30">
              Need {runsNeeded} runs
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ticker Layout - Top bar
  if (layout === 'ticker') {
    return (
      <div className="bg-gradient-to-r from-slate-900/95 via-emerald-900/95 to-slate-900/95 backdrop-blur shadow-xl">
        <div className="max-w-full px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold">{homeTeamName}</span>
            <span className="text-white/50">vs</span>
            <span className="text-white/70">{awayTeamName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-2xl font-bold">
              {currentScore.runs}/{currentScore.wickets}
            </span>
            <span className="text-slate-400">({currentScore.overs} ov)</span>
            {target && (
              <span className="text-amber-300 ml-2">Need {runsNeeded}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">RR: {runRate}</span>
            <div className="flex gap-1">
              {currentOverBalls.slice(-3).map((ball, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    ball.is_wicket ? 'bg-red-500 text-white' :
                    ball.is_six ? 'bg-purple-500 text-white' :
                    ball.is_four ? 'bg-green-500 text-white' :
                    ball.extra_type ? 'bg-amber-500 text-black' :
                    'bg-slate-600 text-white'
                  }`}
                >
                  {ball.display_value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}