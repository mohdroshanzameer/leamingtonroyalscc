import React from 'react';
import StatRing from './StatRing';

export default function QuickStats({ player }) {
  if (!player) return null;

  // Calculate derived stats
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

  return (
    <div className="px-4 mt-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-2xl p-4 sm:p-6"
          style={{ 
            background: 'linear-gradient(180deg, rgba(30,30,40,0.98) 0%, rgba(20,20,30,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          {/* Primary Stats - Rings */}
          <div className="flex items-center justify-around mb-6">
            <StatRing 
              value={player.matches_played || 0} 
              max={50} 
              label="Matches" 
              color="#60a5fa"
            />
            <StatRing 
              value={player.runs_scored || 0} 
              max={1000} 
              label="Runs" 
              color="#4ade80"
            />
            <StatRing 
              value={player.wickets_taken || 0} 
              max={50} 
              label="Wickets" 
              color="#f472b6"
            />
            <div className="hidden sm:block">
              <StatRing 
                value={player.catches || 0} 
                max={20} 
                label="Catches" 
                color="#fbbf24"
              />
            </div>
          </div>

          {/* Secondary Stats - Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-white">{battingAvg}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Bat Avg</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-white">{strikeRate}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Strike Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-white">{player.highest_score || 0}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">High Score</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-white">{bowlingAvg}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Bowl Avg</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-lg sm:text-xl font-bold text-white">{economy}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Economy</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-lg sm:text-xl font-bold text-white">{player.best_bowling || '-'}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Best Bowl</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}