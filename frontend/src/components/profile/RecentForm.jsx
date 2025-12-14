import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

export default function RecentForm({ matches = [] }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
          Recent Form
        </h3>
        <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No recent match data</p>
      </div>
    );
  }

  // Calculate form trend
  const recentRuns = matches.slice(0, 5).reduce((sum, m) => sum + (m.runs || 0), 0);
  const olderRuns = matches.slice(5, 10).reduce((sum, m) => sum + (m.runs || 0), 0);
  const trend = matches.length >= 5 ? (recentRuns > olderRuns ? 'up' : recentRuns < olderRuns ? 'down' : 'stable') : 'stable';

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
          Recent Form
        </h3>
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
          trend === 'down' ? 'bg-red-500/20 text-red-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend === 'stable' && <Minus className="w-3 h-3" />}
          {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
        </div>
      </div>

      {/* Last 5 Matches */}
      <div className="flex gap-2">
        {matches.slice(0, 5).map((match, idx) => (
          <div 
            key={idx}
            className="flex-1 rounded-xl p-2 text-center"
            style={{ backgroundColor: colors.surfaceHover }}
          >
            <p className="text-lg font-bold" style={{ color: match.runs >= 30 ? '#10b981' : match.runs >= 15 ? colors.accent : colors.textMuted }}>
              {match.runs ?? '-'}
              {match.notOut && <span className="text-xs">*</span>}
            </p>
            <p className="text-[9px] uppercase" style={{ color: colors.textMuted }}>
              {match.wickets !== undefined && match.wickets > 0 && (
                <span className="text-red-400">{match.wickets}w</span>
              )}
              {match.wickets === undefined || match.wickets === 0 ? 'runs' : ''}
            </p>
            <p className="text-[8px] mt-1" style={{ color: colors.textMuted }}>
              {match.date ? format(new Date(match.date), 'dd/MM') : `M${idx + 1}`}
            </p>
          </div>
        ))}
      </div>

      {/* Form Summary */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: colors.surfaceHover }}>
          <p className="text-sm font-bold" style={{ color: colors.accent }}>
            {matches.slice(0, 5).reduce((sum, m) => sum + (m.runs || 0), 0)}
          </p>
          <p className="text-[9px] uppercase" style={{ color: colors.textMuted }}>Last 5 Runs</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: colors.surfaceHover }}>
          <p className="text-sm font-bold" style={{ color: colors.accent }}>
            {(matches.slice(0, 5).reduce((sum, m) => sum + (m.runs || 0), 0) / Math.min(5, matches.length)).toFixed(1)}
          </p>
          <p className="text-[9px] uppercase" style={{ color: colors.textMuted }}>Avg (L5)</p>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: colors.surfaceHover }}>
          <p className="text-sm font-bold text-red-400">
            {matches.slice(0, 5).reduce((sum, m) => sum + (m.wickets || 0), 0)}
          </p>
          <p className="text-[9px] uppercase" style={{ color: colors.textMuted }}>Last 5 Wkts</p>
        </div>
      </div>
    </div>
  );
}