import React from 'react';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, CloudRain } from 'lucide-react';

export default function ScoreDisplay({ 
  totalRuns, 
  totalWickets, 
  overs,
  balls,
  maxOvers,
  runRate,
  requiredRunRate,
  target,
  isSecondInnings,
  partnership,
  lastWicket,
  isDLSAffected,
  dlsParScore,
  dlsTarget,
  onDLSClick
}) {
  const actualTarget = dlsTarget || target;
  const runsNeeded = actualTarget ? actualTarget - totalRuns : null;
  const ballsRemaining = maxOvers ? (maxOvers * 6) - (Math.floor(overs) * 6 + balls) : null;
  const dlsPosition = dlsParScore ? totalRuns - dlsParScore : null;
  
  return (
    <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl mx-4 overflow-hidden shadow-xl">
      {/* Main Score */}
      <div className="px-6 pt-5 pb-4 text-center relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-8 -translate-y-8" />
        
        <div className="relative">
          <div className="text-6xl font-bold text-white tracking-tight">
            {totalRuns}<span className="text-white/60">/</span>{totalWickets}
          </div>
          <div className="text-emerald-100 text-xl mt-1">
            ({overs}.{balls} overs)
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="bg-black/20 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-emerald-200 text-xs uppercase tracking-wide">CRR</div>
              <div className="text-white font-bold">{runRate?.toFixed(2) || '0.00'}</div>
            </div>
            {isSecondInnings && requiredRunRate && (
              <div className="text-center">
                <div className="text-emerald-200 text-xs uppercase tracking-wide">RRR</div>
                <div className="text-amber-300 font-bold">{requiredRunRate.toFixed(2)}</div>
              </div>
            )}
          </div>
          
          {isSecondInnings && actualTarget && (
            <div className="text-right">
              <div className="text-emerald-200 text-xs uppercase tracking-wide">
                {isDLSAffected ? 'DLS Target' : 'Need'}
              </div>
              <div className="text-white font-bold">
                {runsNeeded} off {ballsRemaining}
              </div>
            </div>
          )}
          
          {!isSecondInnings && partnership && (
            <div className="text-right">
              <div className="text-emerald-200 text-xs uppercase tracking-wide">Partnership</div>
              <div className="text-white font-bold">{partnership.runs}({partnership.balls})</div>
            </div>
          )}
        </div>
      </div>
      
      {/* DLS Indicator */}
      {isDLSAffected && isSecondInnings && (
        <div 
          onClick={onDLSClick}
          className={`px-4 py-2 text-center cursor-pointer ${
            dlsPosition > 0 ? 'bg-emerald-900/40' : dlsPosition < 0 ? 'bg-red-900/40' : 'bg-blue-900/40'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CloudRain className="w-3.5 h-3.5 text-blue-300" />
            <span className={`text-xs font-medium ${
              dlsPosition > 0 ? 'text-emerald-300' : dlsPosition < 0 ? 'text-red-300' : 'text-blue-300'
            }`}>
              DLS: {dlsPosition > 0 ? '+' : ''}{dlsPosition} {dlsPosition > 0 ? 'ahead' : dlsPosition < 0 ? 'behind' : 'on par'}
              <span className="text-white/60 ml-2">(Par: {dlsParScore})</span>
            </span>
          </div>
        </div>
      )}

      {/* Last Wicket */}
      {lastWicket && (
        <div className="bg-red-900/40 px-4 py-2 text-center">
          <span className="text-red-200 text-xs">
            Last Wkt: {lastWicket.batsman} {lastWicket.runs}({lastWicket.balls}) at {lastWicket.score}/{lastWicket.wicket}
          </span>
        </div>
      )}
    </div>
  );
}