import React from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { OverByOverChart, RunRateComparisonChart, ManhattanChart } from './InningsGraphs';

const colors = CLUB_CONFIG.theme?.colors || {};

/**
 * Comprehensive Detailed Scorecard Component
 * Matches the PDF export exactly
 */
export default function DetailedScorecard({ 
  match, 
  innings1Data, 
  innings2Data, 
  innings1Balls, 
  innings2Balls,
  onDownloadPDF
}) {
  // Group balls by over
  const groupBallsByOver = (balls) => {
    const overs = {};
    (balls || []).forEach(ball => {
      const overNum = ball.over_number || 1;
      if (!overs[overNum]) overs[overNum] = [];
      overs[overNum].push(ball);
    });
    return overs;
  };

  const innings1Overs = groupBallsByOver(innings1Balls);
  const innings2Overs = groupBallsByOver(innings2Balls);

  // Calculate partnerships
  const calculatePartnerships = (balls) => {
    if (!balls || balls.length === 0) return [];
    
    const partnerships = [];
    let currentPartnership = { runs: 0, balls: 0, batsmen: new Set(), startScore: 0 };
    let totalRuns = 0;
    let wicketCount = 0;
    
    balls.forEach(ball => {
      const ballRuns = (ball.runs || 0) + (ball.extras || 0);
      totalRuns += ballRuns;
      
      if (ball.batsman_name) currentPartnership.batsmen.add(ball.batsman_name);
      if (ball.non_striker_name) currentPartnership.batsmen.add(ball.non_striker_name);
      
      currentPartnership.runs += ballRuns;
      if (ball.extra_type !== 'wide') currentPartnership.balls++;
      
      if (ball.is_wicket) {
        wicketCount++;
        partnerships.push({
          wicket: wicketCount,
          runs: currentPartnership.runs,
          balls: currentPartnership.balls,
          batsmen: Array.from(currentPartnership.batsmen).slice(-2),
          endScore: totalRuns
        });
        currentPartnership = { runs: 0, balls: 0, batsmen: new Set(), startScore: totalRuns };
      }
    });
    
    if (currentPartnership.runs > 0 || currentPartnership.balls > 0) {
      partnerships.push({
        wicket: wicketCount + 1,
        runs: currentPartnership.runs,
        balls: currentPartnership.balls,
        batsmen: Array.from(currentPartnership.batsmen).slice(-2),
        endScore: totalRuns,
        unbroken: true
      });
    }
    
    return partnerships;
  };

  // Calculate innings statistics
  const calculateInningsStats = (balls) => {
    if (!balls || balls.length === 0) return null;
    
    const totalBalls = balls.filter(b => b.extra_type !== 'wide' && b.extra_type !== 'no_ball').length;
    const dots = balls.filter(b => (b.runs || 0) === 0 && !b.extras && !b.is_wicket && b.extra_type !== 'wide' && b.extra_type !== 'no_ball').length;
    const ones = balls.filter(b => (b.runs || 0) === 1 && !b.extras).length;
    const twos = balls.filter(b => (b.runs || 0) === 2 && !b.extras).length;
    const threes = balls.filter(b => (b.runs || 0) === 3 && !b.extras).length;
    const fours = balls.filter(b => b.is_four || (b.runs || 0) === 4).length;
    const sixes = balls.filter(b => b.is_six || (b.runs || 0) === 6).length;
    const boundaryRuns = (fours * 4) + (sixes * 6);
    const totalRuns = balls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    
    return {
      totalBalls,
      dots,
      dotPercentage: totalBalls > 0 ? ((dots / totalBalls) * 100).toFixed(1) : '0.0',
      ones,
      twos,
      threes,
      fours,
      sixes,
      boundaryRuns,
      boundaryPercentage: totalRuns > 0 ? ((boundaryRuns / totalRuns) * 100).toFixed(1) : '0.0'
    };
  };

  // Calculate powerplay stats
  const calculatePowerplayStats = (balls) => {
    const ppBalls = (balls || []).filter(b => (b.over_number || 1) <= 6);
    const runs = ppBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = ppBalls.filter(b => b.is_wicket).length;
    const fours = ppBalls.filter(b => b.is_four || (b.runs || 0) === 4).length;
    const sixes = ppBalls.filter(b => b.is_six || (b.runs || 0) === 6).length;
    return { runs, wickets, fours, sixes };
  };

  // Calculate death stats
  const calculateDeathStats = (balls, totalOvers = 20) => {
    const deathStart = totalOvers <= 20 ? totalOvers - 4 : totalOvers - 10;
    const deathBalls = (balls || []).filter(b => (b.over_number || 1) > deathStart);
    const runs = deathBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = deathBalls.filter(b => b.is_wicket).length;
    return { runs, wickets };
  };

  // Calculate middle overs
  const calculateMiddleStats = (balls) => {
    const middleBalls = (balls || []).filter(b => (b.over_number || 1) > 6 && (b.over_number || 1) <= 15);
    const runs = middleBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = middleBalls.filter(b => b.is_wicket).length;
    return { runs, wickets };
  };

  // Get over summary
  const getOverSummary = (overBalls) => {
    const runs = overBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = overBalls.filter(b => b.is_wicket).length;
    const isMaiden = runs === 0 && overBalls.length >= 6;
    return { runs, wickets, isMaiden };
  };

  // Ball display component
  const BallDisplay = ({ ball }) => {
    let display = '';
    let bgColor = '';
    let textColor = '';
    
    const runs = ball.runs || 0;
    const extras = ball.extras || 0;
    
    if (ball.is_wicket) {
      display = 'W';
      bgColor = '#ef4444';
      textColor = '#fff';
    } else if (ball.extra_type === 'wide') {
      if (extras > 1) {
        display = `Wd+${extras - 1}`;
      } else {
        display = 'Wd';
      }
      bgColor = '#fbbf24';
      textColor = '#78350f';
    } else if (ball.extra_type === 'no_ball') {
      if (runs > 0) {
        display = `${runs}+Nb`;
      } else if (extras > 1) {
        display = `Nb+${extras - 1}b`;
      } else {
        display = 'Nb';
      }
      bgColor = '#f97316';
      textColor = '#fff';
    } else if (ball.extra_type === 'bye') {
      display = `${extras}b`;
      bgColor = '#6b7280';
      textColor = '#fff';
    } else if (ball.extra_type === 'leg_bye') {
      display = `${extras}lb`;
      bgColor = '#6b7280';
      textColor = '#fff';
    } else if (ball.extra_type === 'penalty') {
      display = `${extras}p`;
      bgColor = '#ef4444';
      textColor = '#fff';
    } else if (ball.is_six || runs === 6) {
      display = '6';
      bgColor = '#7c3aed';
      textColor = '#fff';
    } else if (ball.is_four || runs === 4) {
      display = '4';
      bgColor = '#22c55e';
      textColor = '#fff';
    } else if (runs === 0) {
      display = '•';
      bgColor = colors.border || '#374151';
      textColor = colors.textMuted || '#9ca3af';
    } else {
      display = String(runs);
      bgColor = '#3b82f6';
      textColor = '#fff';
    }
    
    const isLong = display.length > 2;
    
    return (
      <span 
        className={`inline-flex items-center justify-center ${isLong ? 'px-1 min-w-[32px] rounded-md' : 'w-6 rounded-full'} h-6 text-[10px] font-bold mx-0.5`}
        style={{ backgroundColor: bgColor, color: textColor }}
        title={ball.extra_type ? `${ball.extra_type}: ${extras}` : `${runs} runs`}
      >
        {display}
      </span>
    );
  };

  // Batting Card Component
  const BattingCard = ({ data, balls }) => {
    const stats = calculateInningsStats(balls);
    
    if (!data?.batsmen?.length) {
      return <p className="text-center py-4" style={{ color: colors.textMuted }}>No batting data available</p>;
    }
    
    return (
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th className="text-left p-2 font-medium" style={{ color: colors.textMuted }}>Batsman</th>
                <th className="text-center p-2 font-medium w-10" style={{ color: colors.textMuted }}>R</th>
                <th className="text-center p-2 font-medium w-10" style={{ color: colors.textMuted }}>B</th>
                <th className="text-center p-2 font-medium w-8" style={{ color: colors.textMuted }}>4s</th>
                <th className="text-center p-2 font-medium w-8" style={{ color: colors.textMuted }}>6s</th>
                <th className="text-center p-2 font-medium w-12" style={{ color: colors.textMuted }}>SR</th>
              </tr>
            </thead>
            <tbody>
              {data.batsmen.map((b, i) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
                const isFifty = b.runs >= 50 && b.runs < 100;
                const isCentury = b.runs >= 100;
                return (
                  <tr 
                    key={i} 
                    style={{ 
                      borderBottom: `1px solid ${colors.border}`,
                      backgroundColor: isCentury ? 'rgba(254, 243, 199, 0.2)' : isFifty ? 'rgba(254, 243, 199, 0.1)' : 'transparent'
                    }}
                  >
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className={`font-medium ${!b.isOut ? 'text-emerald-400' : ''}`} style={{ color: b.isOut ? colors.textPrimary : undefined }}>
                          {b.name}{!b.isOut && ' *'}
                          {isCentury && ' 💯'}
                          {isFifty && !isCentury && ' ⭐'}
                        </span>
                        {b.dismissal && <span className="text-xs" style={{ color: colors.textMuted }}>{b.dismissal}</span>}
                        {!b.isOut && <span className="text-xs text-emerald-500">not out</span>}
                      </div>
                    </td>
                    <td className="text-center p-2 font-bold" style={{ color: colors.textPrimary }}>{b.runs}</td>
                    <td className="text-center p-2" style={{ color: colors.textSecondary }}>{b.balls}</td>
                    <td className="text-center p-2 text-blue-400">{b.fours || 0}</td>
                    <td className="text-center p-2 text-purple-400">{b.sixes || 0}</td>
                    <td className="text-center p-2" style={{ color: colors.textSecondary }}>{sr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between text-sm px-2 py-2" style={{ backgroundColor: colors.surfaceHover, borderRadius: '4px' }}>
          <span style={{ color: colors.textMuted }}>Extras</span>
          <span style={{ color: colors.textPrimary }}>
            <span className="font-semibold">{data.extras?.total || 0}</span>
            <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
              (W:{data.extras?.wides || 0}, NB:{data.extras?.noBalls || 0}, B:{data.extras?.byes || 0}, LB:{data.extras?.legByes || 0}{data.extras?.penalty ? `, P:${data.extras.penalty}` : ''})
            </span>
          </span>
        </div>
        
        <div className="flex justify-between px-2 py-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px' }}>
          <span className="font-bold" style={{ color: colors.textPrimary }}>TOTAL</span>
          <span className="font-bold" style={{ color: colors.textPrimary }}>
            {data.totals?.runs || 0}/{data.totals?.wickets || 0}
            <span className="font-normal ml-2" style={{ color: colors.textSecondary }}>({data.totals?.overs || '0.0'} ov, RR: {data.totals?.runRate || '0.00'})</span>
          </span>
        </div>
        
        {stats && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span style={{ color: colors.textMuted }}>Boundaries: </span>
                <span style={{ color: colors.textPrimary }}>{stats.fours}×4s, {stats.sixes}×6s = {stats.boundaryRuns} runs ({stats.boundaryPercentage}%)</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>Dot Balls: </span>
                <span style={{ color: colors.textPrimary }}>{stats.dots} ({stats.dotPercentage}%)</span>
              </div>
              <div className="col-span-2">
                <span style={{ color: colors.textMuted }}>Run Distribution: </span>
                <span style={{ color: colors.textPrimary }}>0s: {stats.dots} | 1s: {stats.ones} | 2s: {stats.twos} | 3s: {stats.threes}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Bowling Card Component
  const BowlingCard = ({ data }) => {
    if (!data?.bowlers?.length) {
      return <p className="text-center py-4" style={{ color: colors.textMuted }}>No bowling data available</p>;
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              <th className="text-left p-2 font-medium" style={{ color: colors.textMuted }}>Bowler</th>
              <th className="text-center p-2 font-medium w-10" style={{ color: colors.textMuted }}>O</th>
              <th className="text-center p-2 font-medium w-8" style={{ color: colors.textMuted }}>M</th>
              <th className="text-center p-2 font-medium w-10" style={{ color: colors.textMuted }}>R</th>
              <th className="text-center p-2 font-medium w-8" style={{ color: colors.textMuted }}>W</th>
              <th className="text-center p-2 font-medium w-12" style={{ color: colors.textMuted }}>Econ</th>
              <th className="text-center p-2 font-medium w-10" style={{ color: colors.textMuted }}>Dots</th>
              <th className="text-center p-2 font-medium w-8" style={{ color: colors.textMuted }}>Wd</th>
              <th className="text-center p-2 font-medium w-8" style={{ color: colors.textMuted }}>Nb</th>
            </tr>
          </thead>
          <tbody>
            {data.bowlers.map((b, i) => {
              const hasFiveWickets = b.wickets >= 5;
              const hasFourWickets = b.wickets === 4;
              return (
                <tr 
                  key={i} 
                  style={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: hasFiveWickets ? 'rgba(220, 252, 231, 0.2)' : hasFourWickets ? 'rgba(219, 234, 254, 0.2)' : 'transparent'
                  }}
                >
                  <td className="p-2 font-medium" style={{ color: colors.textPrimary }}>
                    {b.name}
                    {hasFiveWickets && ' 🔥'}
                    {hasFourWickets && !hasFiveWickets && ' ⭐'}
                  </td>
                  <td className="text-center p-2" style={{ color: colors.textSecondary }}>{b.overs}</td>
                  <td className="text-center p-2" style={{ color: colors.textMuted }}>{b.maidens || 0}</td>
                  <td className="text-center p-2" style={{ color: colors.textSecondary }}>{b.runs}</td>
                  <td className="text-center p-2 font-bold text-blue-400">{b.wickets}</td>
                  <td className="text-center p-2" style={{ color: colors.textSecondary }}>{b.economy || '-'}</td>
                  <td className="text-center p-2" style={{ color: colors.textMuted }}>{b.dots || 0}</td>
                  <td className="text-center p-2 text-amber-500">{b.wides || 0}</td>
                  <td className="text-center p-2 text-orange-500">{b.noBalls || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Fall of Wickets Component
  const FallOfWickets = ({ data }) => {
    if (!data?.fallOfWickets?.length) return null;
    
    return (
      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <span className="font-semibold text-sm text-red-400">📉 Fall of Wickets:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.fallOfWickets.map((f, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              <strong>{f.score}-{f.wicket}</strong> ({f.batsman}, {f.overs})
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Partnerships Component
  const Partnerships = ({ balls }) => {
    const partnerships = calculatePartnerships(balls);
    if (partnerships.length === 0) return null;
    
    return (
      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
        <span className="font-semibold text-sm text-emerald-400">🤝 Partnerships:</span>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <th className="text-left p-1" style={{ color: colors.textMuted }}>Wkt</th>
                <th className="text-center p-1" style={{ color: colors.textMuted }}>Runs</th>
                <th className="text-center p-1" style={{ color: colors.textMuted }}>Balls</th>
                <th className="text-left p-1" style={{ color: colors.textMuted }}>Batsmen</th>
              </tr>
            </thead>
            <tbody>
              {partnerships.map((p, i) => (
                <tr key={i} style={{ backgroundColor: p.unbroken ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }}>
                  <td className="p-1" style={{ color: colors.textSecondary }}>{p.wicket}{p.unbroken ? '*' : ''}</td>
                  <td className="text-center p-1 font-bold text-emerald-400">{p.runs}</td>
                  <td className="text-center p-1" style={{ color: colors.textMuted }}>{p.balls}</td>
                  <td className="p-1" style={{ color: colors.textSecondary }}>{p.batsmen.join(' & ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Phase Analysis Component
  const PhaseAnalysis = ({ balls }) => {
    if (!balls?.length) return null;
    
    const pp = calculatePowerplayStats(balls);
    const middle = calculateMiddleStats(balls);
    const death = calculateDeathStats(balls, 20);
    
    return (
      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <span className="font-semibold text-sm text-blue-400">📊 Phase Analysis:</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="p-2 rounded text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
            <div className="text-xs" style={{ color: colors.textMuted }}>Powerplay (1-6)</div>
            <div className="font-bold text-lg" style={{ color: colors.textPrimary }}>{pp.runs}/{pp.wickets}</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>{pp.fours}×4s, {pp.sixes}×6s</div>
          </div>
          <div className="p-2 rounded text-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
            <div className="text-xs" style={{ color: colors.textMuted }}>Middle (7-15)</div>
            <div className="font-bold text-lg" style={{ color: colors.textPrimary }}>{middle.runs}/{middle.wickets}</div>
          </div>
          <div className="p-2 rounded text-center" style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)' }}>
            <div className="text-xs" style={{ color: colors.textMuted }}>Death (16-20)</div>
            <div className="font-bold text-lg" style={{ color: colors.textPrimary }}>{death.runs}/{death.wickets}</div>
          </div>
        </div>
      </div>
    );
  };

  // Over Breakdown Component
  const OverBreakdown = ({ overs, title }) => {
    if (!overs || Object.keys(overs).length === 0) {
      return <p className="text-center py-4" style={{ color: colors.textMuted }}>No ball data available</p>;
    }
    
    let runningTotal = 0;
    let runningWickets = 0;
    
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm" style={{ color: colors.accent }}>{title}</h4>
        
        <div className="flex flex-wrap gap-3 p-2 rounded text-xs" style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.border }}></span> <span style={{ color: colors.textPrimary }}>Dot</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-blue-500"></span> <span style={{ color: colors.textPrimary }}>Runs</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-green-500"></span> <span style={{ color: colors.textPrimary }}>Four</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-purple-500"></span> <span style={{ color: colors.textPrimary }}>Six</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-red-500"></span> <span style={{ color: colors.textPrimary }}>Wicket</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-yellow-500"></span> <span style={{ color: colors.textPrimary }}>Wide</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-orange-500"></span> <span style={{ color: colors.textPrimary }}>No Ball</span></span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-gray-500"></span> <span style={{ color: colors.textPrimary }}>Bye/LB</span></span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: colors.surfaceHover }}>
                <th className="text-center p-1.5 sm:p-2 w-8 sm:w-12" style={{ color: colors.textMuted }}>Over</th>
                <th className="text-left p-1.5 sm:p-2 w-20 sm:w-24" style={{ color: colors.textMuted }}>Bowler</th>
                <th className="text-left p-1.5 sm:p-2" style={{ color: colors.textMuted }}>Deliveries</th>
                <th className="text-center p-1.5 sm:p-2 w-8 sm:w-14" style={{ color: colors.textMuted }}>Runs</th>
                <th className="text-center p-1.5 sm:p-2 w-10 sm:w-16" style={{ color: colors.textMuted }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([overNum, overBalls]) => {
                const summary = getOverSummary(overBalls);
                runningTotal += summary.runs;
                runningWickets += summary.wickets;
                const bowler = overBalls[0]?.bowler_name || overBalls[0]?.bowler || 'Unknown';
                
                return (
                  <tr 
                    key={overNum} 
                    style={{ 
                      borderBottom: `1px solid ${colors.border}`,
                      backgroundColor: summary.isMaiden ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                    }}
                  >
                    <td className="text-center p-1.5 sm:p-2 font-bold text-xs sm:text-sm" style={{ color: colors.accent }}>{overNum}</td>
                    <td className="text-left p-1.5 sm:p-2 font-medium text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
                      <span className="block w-16 sm:w-auto truncate" title={bowler}>{bowler}</span>
                    </td>
                    <td className="text-left p-1.5 sm:p-2">
                      <div className="flex flex-wrap gap-0.5">
                        {overBalls.map((ball, i) => <BallDisplay key={i} ball={ball} />)}
                      </div>
                    </td>
                    <td className="text-center p-1.5 sm:p-2 font-bold text-xs sm:text-sm" style={{ color: colors.textPrimary }}>
                      {summary.runs}{summary.isMaiden && <span className="text-emerald-400 ml-1">(M)</span>}
                    </td>
                    <td className="text-center p-1.5 sm:p-2 font-bold text-xs sm:text-sm" style={{ color: colors.accent }}>{runningTotal}/{runningWickets}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Innings Section Component
  const InningsSection = ({ title, data, balls, oppositionBowlers }) => {
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${colors.surfaceHover} 0%, ${colors.surface} 100%)` }}>
          <span className="font-bold" style={{ color: colors.textPrimary }}>🏏 {title}</span>
          <span className="text-xl font-bold" style={{ color: colors.accent }}>
            {data?.totals?.runs || 0}/{data?.totals?.wickets || 0}
            <span className="text-sm font-normal ml-2" style={{ color: colors.textMuted }}>({data?.totals?.overs || '0.0'} ov)</span>
          </span>
        </div>
        
        <div className="p-4 space-y-4">
          <BattingCard data={data} balls={balls} />
          
          <div className="pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: colors.textSecondary }}>🎯 Bowling</h4>
            <BowlingCard data={{ bowlers: oppositionBowlers }} />
          </div>
          
          <FallOfWickets data={data} />
          <Partnerships balls={balls} />
          <PhaseAnalysis balls={balls} />
        </div>
      </div>
    );
  };

  const matchDate = match?.match_date ? format(new Date(match.match_date), 'EEEE, dd MMMM yyyy') : '';
  const matchTime = match?.match_date ? format(new Date(match.match_date), 'h:mm a') : '';

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: colors.accent }}>{CLUB_CONFIG.name}</h2>
          {onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              className="gap-1.5 shrink-0"
              size="sm"
              style={{ backgroundColor: colors.accent, color: '#000' }}
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            {match?.team1_name} <span style={{ color: colors.accent }}>vs</span> {match?.team2_name}
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {matchDate}{matchTime ? ` • ${matchTime}` : ''}{match?.venue ? ` • ${match.venue}` : ''}
          </p>
          {match?.toss_winner && (
            <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              🪙 Toss: {match.toss_winner} won and elected to {match.toss_decision}
            </p>
          )}
        </div>
      </div>
      
      <InningsSection 
        title={`${match?.team1_name || innings1Data?.battingTeam || 'Team 1'} - 1st Innings`}
        data={innings1Data}
        balls={innings1Balls}
        oppositionBowlers={innings2Data?.bowlers || []}
      />
      
      <InningsSection 
        title={`${match?.team2_name || innings2Data?.battingTeam || 'Team 2'} - 2nd Innings`}
        data={innings2Data}
        balls={innings2Balls}
        oppositionBowlers={innings1Data?.bowlers || []}
      />
      
      {match?.result_summary && (
        <div className="p-4 rounded-xl text-center font-bold" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff' }}>
          🏆 {match.result_summary}
        </div>
      )}
      
      {match?.man_of_match && (
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <span className="font-bold text-amber-500">🌟 Player of the Match:</span>
          <span className="ml-2" style={{ color: colors.textPrimary }}>{match.man_of_match}</span>
          {match.mom_performance && <span style={{ color: colors.textMuted }}> ({match.mom_performance})</span>}
        </div>
      )}
      
      {/* Match Analytics Graphs */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>📈 Match Analytics</h3>
        
        {/* Score Comparison Worm */}
        <RunRateComparisonChart 
          innings1Balls={innings1Balls}
          innings2Balls={innings2Balls}
          team1Name={match?.team1_name || 'Team 1'}
          team2Name={match?.team2_name || 'Team 2'}
        />
        
        {/* Manhattan Chart */}
        <ManhattanChart 
          innings1Balls={innings1Balls}
          innings2Balls={innings2Balls}
          team1Name={match?.team1_name || 'Team 1'}
          team2Name={match?.team2_name || 'Team 2'}
        />
        
        {/* Individual Innings Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OverByOverChart balls={innings1Balls} teamName={match?.team1_name || 'Team 1'} />
          <OverByOverChart balls={innings2Balls} teamName={match?.team2_name || 'Team 2'} />
        </div>
      </div>
      
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3" style={{ backgroundColor: colors.surfaceHover }}>
          <span className="font-bold" style={{ color: colors.textPrimary }}>📊 Ball-by-Ball Breakdown</span>
        </div>
        <div className="p-4 space-y-6">
          <OverBreakdown overs={innings1Overs} title={`1st Innings - ${match?.team1_name || 'Team 1'}`} />
          <OverBreakdown overs={innings2Overs} title={`2nd Innings - ${match?.team2_name || 'Team 2'}`} />
        </div>
      </div>
      
      <div className="text-center text-xs py-4" style={{ color: colors.textMuted }}>
        Generated by {CLUB_CONFIG.name} Cricket Management System • {format(new Date(), 'dd MMMM yyyy, HH:mm')}
      </div>
    </div>
  );
}