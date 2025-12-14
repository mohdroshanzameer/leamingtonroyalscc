import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Clock, ChevronRight } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';
import MatchAvailabilityList from './MatchAvailabilityList';

const theme = CLUB_CONFIG.theme || {};
const colors = theme.colors || {};

export default function MatchCard({ match, compact = false, availability = [], showAvailability = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const matchDate = match.match_date ? parseISO(match.match_date) : null;
  const isMatchToday = matchDate ? isToday(matchDate) : false;
  const isMatchTomorrow = matchDate ? isTomorrow(matchDate) : false;
  
  let displayStatus = match.status;
  if (match.status === 'scheduled') {
    if (isMatchToday) displayStatus = 'Today';
    else if (isMatchTomorrow) displayStatus = 'Tomorrow';
    else displayStatus = 'Upcoming';
  } else if (match.status === 'live') {
    displayStatus = 'LIVE';
  } else if (match.status === 'completed') {
    displayStatus = 'Result';
  }

  const statusColors = {
    'Today': 'bg-green-500 text-white',
    'Tomorrow': 'bg-amber-500 text-white',
    'Upcoming': 'bg-blue-500 text-white',
    'LIVE': 'bg-red-500 text-white animate-pulse',
    'Result': 'bg-slate-500 text-white',
    'Cancelled': 'bg-orange-500 text-white',
  };

  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  const stageLabels = {
    group: 'Group',
    league: 'League',
    quarterfinal: 'QF',
    semifinal: 'SF',
    third_place: '3rd',
    final: 'Final',
  };

  // Compact view for lists
  if (compact) {
    return (
      <Link 
        to={createPageUrl(`MatchReport?id=${match.id}`)}
        className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer block"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Status */}
        <div className="w-16 flex-shrink-0">
          <Badge className={`text-xs ${statusColors[displayStatus]}`}>
            {displayStatus}
          </Badge>
        </div>

        {/* Teams & Score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold truncate ${isCompleted && match.winner_name === match.team1_name ? 'text-emerald-600' : ''}`} 
                  style={{ color: isCompleted && match.winner_name === match.team1_name ? undefined : colors.textPrimary }}>
              {match.team1_name}
            </span>
            {isCompleted && match.team1_score && (
              <span className="font-bold" style={{ color: colors.textPrimary }}>{match.team1_score}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`font-semibold truncate ${isCompleted && match.winner_name === match.team2_name ? 'text-emerald-600' : ''}`}
                  style={{ color: isCompleted && match.winner_name === match.team2_name ? undefined : colors.textPrimary }}>
              {match.team2_name}
            </span>
            {isCompleted && match.team2_score && (
              <span className="font-bold" style={{ color: colors.textPrimary }}>{match.team2_score}</span>
            )}
          </div>
        </div>

        {/* Date/Result */}
        <div className="text-right flex-shrink-0">
          {matchDate && (
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {format(matchDate, 'dd MMM')}
            </div>
          )}
          <ChevronRight className="w-4 h-4 mt-1 ml-auto" style={{ color: colors.textMuted }} />
        </div>
      </Link>
    );
  }

  // Full card view
  return (
    <Link 
      to={createPageUrl(`MatchReport?id=${match.id}`)}
      className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg cursor-pointer block"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: colors.accent }}>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[displayStatus]}>
            {displayStatus}
          </Badge>
          {(isLive || isMatchToday) && (
            <span className="text-xs text-white/80">
              {matchDate && format(matchDate, 'h:mm a')}
            </span>
          )}
        </div>
        <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-xs">
          {stageLabels[match.stage] || match.stage} {match.group ? `• ${match.group}` : ''}
        </Badge>
      </div>

      {/* Match Content */}
      <div className="p-5">
        {/* Team 1 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted && match.winner_name === match.team1_name ? 'bg-emerald-100' : ''}`}
              style={{ backgroundColor: isCompleted && match.winner_name === match.team1_name ? undefined : colors.surfaceHover }}
            >
              <span 
                className="font-bold"
                style={{ color: isCompleted && match.winner_name === match.team1_name ? '#059669' : colors.textSecondary }}
              >
                {match.team1_name?.charAt(0) || '?'}
              </span>
            </div>
            <span 
              className={`font-semibold ${isCompleted && match.winner_name === match.team1_name ? 'text-emerald-600' : ''}`}
              style={{ color: isCompleted && match.winner_name === match.team1_name ? undefined : colors.textPrimary }}
            >
              {match.team1_name}
            </span>
          </div>
          {(isCompleted || isLive) && match.team1_score && (
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>{match.team1_score}</span>
              {match.team1_overs && (
                <span className="text-sm ml-1" style={{ color: colors.textMuted }}>({match.team1_overs})</span>
              )}
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted && match.winner_name === match.team2_name ? 'bg-emerald-100' : ''}`}
              style={{ backgroundColor: isCompleted && match.winner_name === match.team2_name ? undefined : colors.surfaceHover }}
            >
              <span 
                className="font-bold"
                style={{ color: isCompleted && match.winner_name === match.team2_name ? '#059669' : colors.textSecondary }}
              >
                {match.team2_name?.charAt(0) || '?'}
              </span>
            </div>
            <span 
              className={`font-semibold ${isCompleted && match.winner_name === match.team2_name ? 'text-emerald-600' : ''}`}
              style={{ color: isCompleted && match.winner_name === match.team2_name ? undefined : colors.textPrimary }}
            >
              {match.team2_name}
            </span>
          </div>
          {(isCompleted || isLive) && match.team2_score && (
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>{match.team2_score}</span>
              {match.team2_overs && (
                <span className="text-sm ml-1" style={{ color: colors.textMuted }}>({match.team2_overs})</span>
              )}
            </div>
          )}
        </div>

        {/* Result Summary */}
        {isCompleted && match.result_summary && (
          <div 
            className="text-center py-2 px-3 rounded-lg text-sm font-medium mb-4"
            style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}
          >
            {match.result_summary}
          </div>
        )}

        {/* Match Info Footer */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-3 border-t" style={{ borderColor: colors.border, color: colors.textMuted }}>
          {matchDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {isMatchToday ? 'Today' : isMatchTomorrow ? 'Tomorrow' : format(matchDate, 'EEE, dd MMM yyyy')}
            </div>
          )}
          {matchDate && !isCompleted && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(matchDate, 'h:mm a')}
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{match.venue}</span>
            </div>
          )}
        </div>

        {/* Man of the Match */}
        {isCompleted && match.man_of_match && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm" style={{ borderColor: colors.border }}>
            <Trophy className="w-4 h-4 text-amber-500" />
            <span style={{ color: colors.textMuted }}>Player of the Match:</span>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>{match.man_of_match}</span>
            {match.mom_performance && (
              <span className="text-xs" style={{ color: colors.textMuted }}>({match.mom_performance})</span>
            )}
          </div>
        )}

        {/* Availability Section - Only for upcoming matches */}
        {showAvailability && !isCompleted && !isLive && (
          <MatchAvailabilityList 
            availability={availability} 
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        )}
      </div>
    </Link>
  );
}