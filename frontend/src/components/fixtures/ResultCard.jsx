import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, parseISO } from 'date-fns';
import { Trophy, Star } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function ResultCard({ match }) {
  const matchDate = match.match_date ? parseISO(match.match_date) : null;
  const team1Won = match.winner_name === match.team1_name;
  const team2Won = match.winner_name === match.team2_name;

  return (
    <Link
      to={createPageUrl(`MatchReport?id=${match.id}`)}
      className="block rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl"
      style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
    >
      {/* Date Header */}
      <div 
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: colors.surfaceHover }}
      >
        <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
          {matchDate ? format(matchDate, 'dd MMM yyyy') : 'Date TBD'}
        </span>
        <span 
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ backgroundColor: colors.success + '20', color: colors.success }}
        >
          Completed
        </span>
      </div>

      {/* Scores */}
      <div className="p-4 space-y-2">
        {/* Team 1 */}
        <div 
          className={`flex items-center justify-between p-2 rounded-lg ${team1Won ? 'ring-1' : ''}`}
          style={{ 
            backgroundColor: team1Won ? 'rgba(16,185,129,0.1)' : 'transparent',
            ringColor: team1Won ? colors.success : 'transparent',
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {team1Won && <Trophy className="w-4 h-4 shrink-0" style={{ color: colors.success }} />}
            <span 
              className={`text-sm truncate ${team1Won ? 'font-bold' : 'font-medium'}`}
              style={{ color: team1Won ? colors.success : colors.textPrimary }}
            >
              {match.team1_name}
            </span>
          </div>
          <div className="text-right shrink-0 ml-2">
            <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
              {match.team1_score || '-'}
            </span>
            {match.team1_overs && (
              <span className="text-xs ml-1" style={{ color: colors.textMuted }}>
                ({match.team1_overs})
              </span>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div 
          className={`flex items-center justify-between p-2 rounded-lg ${team2Won ? 'ring-1' : ''}`}
          style={{ 
            backgroundColor: team2Won ? 'rgba(16,185,129,0.1)' : 'transparent',
            ringColor: team2Won ? colors.success : 'transparent',
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {team2Won && <Trophy className="w-4 h-4 shrink-0" style={{ color: colors.success }} />}
            <span 
              className={`text-sm truncate ${team2Won ? 'font-bold' : 'font-medium'}`}
              style={{ color: team2Won ? colors.success : colors.textPrimary }}
            >
              {match.team2_name}
            </span>
          </div>
          <div className="text-right shrink-0 ml-2">
            <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
              {match.team2_score || '-'}
            </span>
            {match.team2_overs && (
              <span className="text-xs ml-1" style={{ color: colors.textMuted }}>
                ({match.team2_overs})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Result & MOM */}
      <div 
        className="px-4 pb-3 space-y-2"
      >
        {match.result_summary && (
          <p className="text-xs font-medium text-center" style={{ color: colors.textSecondary }}>
            {match.result_summary}
          </p>
        )}
        {match.man_of_match && (
          <div 
            className="flex items-center justify-center gap-1.5 text-xs pt-2 border-t"
            style={{ borderColor: colors.border }}
          >
            <Star className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            <span style={{ color: colors.textMuted }}>MOM:</span>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>{match.man_of_match}</span>
          </div>
        )}
      </div>
    </Link>
  );
}