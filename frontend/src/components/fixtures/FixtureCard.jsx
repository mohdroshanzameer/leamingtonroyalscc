import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { MapPin, Clock, Users, Check, HelpCircle, X } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function FixtureCard({ match, availability = [], showAvailability = false }) {
  const matchDate = match.match_date ? parseISO(match.match_date) : null;
  const isMatchToday = matchDate ? isToday(matchDate) : false;
  const isMatchTomorrow = matchDate ? isTomorrow(matchDate) : false;
  const isLive = match.status === 'live';

  const available = availability.filter(a => a.status === 'Available').length;
  const maybe = availability.filter(a => a.status === 'Maybe').length;
  const unavailable = availability.filter(a => a.status === 'Not Available').length;

  return (
    <Link
      to={createPageUrl(`MatchReport?id=${match.id}`)}
      className="block rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl"
      style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
    >
      {/* Status Bar */}
      <div 
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ 
          backgroundColor: isLive ? colors.danger : isMatchToday ? colors.success : isMatchTomorrow ? colors.warning : colors.accent,
        }}
      >
        <span className="text-xs font-bold text-black uppercase tracking-wider">
          {isLive ? '● LIVE' : isMatchToday ? 'Today' : isMatchTomorrow ? 'Tomorrow' : matchDate ? format(matchDate, 'EEE, dd MMM') : 'TBD'}
        </span>
        {matchDate && !isLive && (
          <span className="text-xs font-semibold text-black/70">
            {format(matchDate, 'h:mm a')}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="space-y-3 mb-3">
          {/* Team 1 */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0"
              style={{ backgroundColor: colors.accent, color: '#000' }}
            >
              {match.team1_name?.charAt(0) || '?'}
            </div>
            <span className="font-bold text-base" style={{ color: colors.textPrimary }}>
              {match.team1_name || 'TBD'}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-2 pl-12">
            <div className="h-px flex-1" style={{ backgroundColor: colors.border }} />
            <span className="text-[10px] font-bold px-2" style={{ color: colors.textMuted }}>VS</span>
            <div className="h-px flex-1" style={{ backgroundColor: colors.border }} />
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0"
              style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
            >
              {match.team2_name?.charAt(0) || '?'}
            </div>
            <span className="font-bold text-base" style={{ color: colors.textPrimary }}>
              {match.team2_name || 'TBD'}
            </span>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: colors.textMuted }}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{match.venue}</span>
          </div>
        )}

        {/* Availability Summary */}
        {showAvailability && availability.length > 0 && (
          <div 
            className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1" style={{ color: '#10b981' }}>
                <Check className="w-3.5 h-3.5" />
                <span className="font-semibold">{available}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">{maybe}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: '#ef4444' }}>
                <X className="w-3.5 h-3.5" />
                <span className="font-semibold">{unavailable}</span>
              </div>
            </div>
            <Users className="w-4 h-4" style={{ color: colors.textMuted }} />
          </div>
        )}
      </div>
    </Link>
  );
}