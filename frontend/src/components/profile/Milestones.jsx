import React from 'react';
import { Trophy, Star, Target, Zap, Award, Medal } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const colors = CLUB_CONFIG.theme.colors;

const milestoneDefinitions = [
  // Batting milestones
  { id: 'first_50', label: 'First Fifty', icon: Star, color: '#f59e0b', check: (p) => p.fifties >= 1 || p.highest_score >= 50 },
  { id: 'first_100', label: 'First Century', icon: Trophy, color: '#fbbf24', check: (p) => p.hundreds >= 1 || p.highest_score >= 100 },
  { id: '500_runs', label: '500 Runs', icon: Target, color: '#3b82f6', check: (p) => p.runs_scored >= 500 },
  { id: '1000_runs', label: '1000 Runs', icon: Target, color: '#8b5cf6', check: (p) => p.runs_scored >= 1000 },
  
  // Bowling milestones
  { id: '5_wickets', label: '5-Wicket Haul', icon: Zap, color: '#ef4444', check: (p) => p.five_wickets >= 1 },
  { id: '25_wickets', label: '25 Wickets', icon: Zap, color: '#f97316', check: (p) => p.wickets_taken >= 25 },
  { id: '50_wickets', label: '50 Wickets', icon: Zap, color: '#dc2626', check: (p) => p.wickets_taken >= 50 },
  
  // All-round milestones
  { id: '10_matches', label: '10 Matches', icon: Medal, color: '#64748b', check: (p) => p.matches_played >= 10 },
  { id: '25_matches', label: '25 Matches', icon: Medal, color: '#94a3b8', check: (p) => p.matches_played >= 25 },
  { id: '50_matches', label: '50 Matches', icon: Award, color: '#10b981', check: (p) => p.matches_played >= 50 },
  
  // Fielding
  { id: '10_catches', label: '10 Catches', icon: Award, color: '#06b6d4', check: (p) => p.catches >= 10 },
];

export default function Milestones({ player }) {
  if (!player) return null;

  const achieved = milestoneDefinitions.filter(m => m.check(player));
  const upcoming = milestoneDefinitions.filter(m => !m.check(player)).slice(0, 3);

  if (achieved.length === 0 && upcoming.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <Trophy className="w-4 h-4" style={{ color: '#fbbf24' }} />
        Milestones
      </h3>

      {/* Achieved Milestones */}
      {achieved.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {achieved.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: `${milestone.color}20`, border: `1px solid ${milestone.color}40` }}
            >
              <milestone.icon className="w-3.5 h-3.5" style={{ color: milestone.color }} />
              <span className="text-xs font-medium" style={{ color: milestone.color }}>{milestone.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Milestones */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>Next Milestones</p>
          <div className="space-y-1.5">
            {upcoming.map((milestone) => {
              // Calculate progress
              let progress = 0;
              let target = '';
              if (milestone.id === 'first_50') {
                progress = Math.min(100, ((player.highest_score || 0) / 50) * 100);
                target = `${player.highest_score || 0}/50`;
              } else if (milestone.id === 'first_100') {
                progress = Math.min(100, ((player.highest_score || 0) / 100) * 100);
                target = `${player.highest_score || 0}/100`;
              } else if (milestone.id === '500_runs') {
                progress = Math.min(100, ((player.runs_scored || 0) / 500) * 100);
                target = `${player.runs_scored || 0}/500`;
              } else if (milestone.id === '1000_runs') {
                progress = Math.min(100, ((player.runs_scored || 0) / 1000) * 100);
                target = `${player.runs_scored || 0}/1000`;
              } else if (milestone.id === '25_wickets') {
                progress = Math.min(100, ((player.wickets_taken || 0) / 25) * 100);
                target = `${player.wickets_taken || 0}/25`;
              } else if (milestone.id === '50_wickets') {
                progress = Math.min(100, ((player.wickets_taken || 0) / 50) * 100);
                target = `${player.wickets_taken || 0}/50`;
              } else if (milestone.id === '10_matches') {
                progress = Math.min(100, ((player.matches_played || 0) / 10) * 100);
                target = `${player.matches_played || 0}/10`;
              } else if (milestone.id === '25_matches') {
                progress = Math.min(100, ((player.matches_played || 0) / 25) * 100);
                target = `${player.matches_played || 0}/25`;
              } else if (milestone.id === '50_matches') {
                progress = Math.min(100, ((player.matches_played || 0) / 50) * 100);
                target = `${player.matches_played || 0}/50`;
              } else if (milestone.id === '10_catches') {
                progress = Math.min(100, ((player.catches || 0) / 10) * 100);
                target = `${player.catches || 0}/10`;
              }

              return (
                <div key={milestone.id} className="flex items-center gap-2">
                  <milestone.icon className="w-3.5 h-3.5 opacity-40" style={{ color: colors.textMuted }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span style={{ color: colors.textMuted }}>{milestone.label}</span>
                      <span style={{ color: colors.textMuted }}>{target}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: milestone.color }}
                      />
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