import React from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

export default function SeasonBreakdown({ seasons = [] }) {
  const [expanded, setExpanded] = React.useState(null);

  if (!seasons || seasons.length === 0) {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Calendar className="w-4 h-4" style={{ color: colors.accent }} />
          Season Breakdown
        </h3>
        <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No season data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <Calendar className="w-4 h-4" style={{ color: colors.accent }} />
        Season Breakdown
      </h3>

      <div className="space-y-2">
        {seasons.map((season, idx) => (
          <div 
            key={season.name || idx}
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: colors.surfaceHover }}
          >
            {/* Season Header */}
            <button
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                >
                  {season.name?.slice(-2) || `S${idx + 1}`}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {season.name || `Season ${idx + 1}`}
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    {season.matches || 0} matches • {season.tournament || 'All Competitions'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: colors.accent }}>{season.runs || 0}</p>
                  <p className="text-[9px] uppercase" style={{ color: colors.textMuted }}>runs</p>
                </div>
                {expanded === idx ? (
                  <ChevronUp className="w-4 h-4" style={{ color: colors.textMuted }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: colors.textMuted }} />
                )}
              </div>
            </button>

            {/* Expanded Stats */}
            {expanded === idx && (
              <div className="px-3 pb-3">
                <div className="grid grid-cols-4 gap-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <p className="text-sm font-bold text-blue-400">{season.runs || 0}</p>
                    <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Runs</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <p className="text-sm font-bold text-red-400">{season.wickets || 0}</p>
                    <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Wickets</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{season.highScore || 0}</p>
                    <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>High</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                      {season.matches > 0 ? (season.runs / season.matches).toFixed(1) : '-'}
                    </p>
                    <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Avg</p>
                  </div>
                </div>
                {season.bestBowling && (
                  <p className="text-xs mt-2 text-center" style={{ color: colors.textMuted }}>
                    Best Bowling: <span className="text-red-400 font-medium">{season.bestBowling}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}