import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

export default function Last5Overs({ balls, maxOvers, ballsPerOver = 6, powerplayOvers = 6 }) {
  // Calculate last 5 overs stats
  const legalBalls = balls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
  const currentOver = Math.floor(legalBalls.length / ballsPerOver);
  
  // Get balls from last 5 complete overs
  const last5OverStart = Math.max(0, currentOver - 5);
  const last5Balls = balls.filter(b => b.over_number > last5OverStart && b.over_number <= currentOver);
  
  const last5Runs = last5Balls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
  const last5Wickets = last5Balls.filter(b => b.is_wicket).length;
  const last5Legal = last5Balls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery).length;
  const last5RR = last5Legal > 0 ? ((last5Runs / last5Legal) * ballsPerOver).toFixed(2) : '0.00';
  
  // Calculate powerplay using prop
  const isPowerplay = currentOver < powerplayOvers;
  const powerplayBalls = balls.filter(b => b.over_number <= powerplayOvers);
  const powerplayRuns = powerplayBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
  const powerplayWickets = powerplayBalls.filter(b => b.is_wicket).length;

  return (
    <div className="px-4 flex gap-2">
      {/* Last 5 Overs */}
      <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
          <TrendingUp className="w-3 h-3" />
          <span>Last 5 Overs</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-white font-bold">{last5Runs}/{last5Wickets}</span>
          <span className="text-slate-500 text-xs">RR: {last5RR}</span>
        </div>
      </div>
      
      {/* Powerplay indicator */}
      {maxOvers >= 20 && (
        <div className={`flex-1 rounded-lg p-2 border ${
          isPowerplay 
            ? 'bg-amber-900/30 border-amber-600/50' 
            : 'bg-slate-800/50 border-slate-700'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] mb-1">
            <Activity className={`w-3 h-3 ${isPowerplay ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className={isPowerplay ? 'text-amber-300' : 'text-slate-400'}>
              {isPowerplay ? 'Powerplay ON' : 'Powerplay'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold">{powerplayRuns}/{powerplayWickets}</span>
            <span className="text-slate-500 text-xs">
              ({Math.min(currentOver, powerplayOvers)} ov)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}