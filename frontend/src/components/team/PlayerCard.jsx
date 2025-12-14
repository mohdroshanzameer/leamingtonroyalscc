import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Star } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const colors = CLUB_CONFIG.theme.colors;

export default function PlayerCard({ player, onClick, hideStats = false }) {
  const roleColors = {
    'Batsman': 'bg-blue-500 text-white',
    'Bowler': 'bg-red-500 text-white',
    'All-Rounder': 'bg-purple-500 text-white',
    'Wicket-Keeper': 'bg-amber-500 text-white',
  };

  const roleBgColors = {
    'Batsman': 'from-blue-600 to-blue-500',
    'Bowler': 'from-red-600 to-red-500',
    'All-Rounder': 'from-purple-600 to-purple-500',
    'Wicket-Keeper': 'from-amber-600 to-amber-500',
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      {/* Top bar with role color */}
      <div className={`h-1.5 bg-gradient-to-r ${roleBgColors[player.role] || 'from-slate-500 to-slate-400'}`} />
      
      {/* Content */}
      <div className="p-4">
        {/* Header with photo and name */}
        <div className="flex items-start gap-3 mb-3">
          {/* Photo/Initial */}
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.player_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold" style={{ color: colors.textMuted }}>
                {(player.player_name || player.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Name & Role */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm truncate" style={{ color: colors.textPrimary }}>
                {player.player_name || player.name}
              </h3>
              {(player.is_captain || player.is_vice_captain) && (
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs px-2 py-0 ${roleColors[player.role] || 'bg-slate-500 text-white'}`}>
                {player.role === 'All-Rounder' ? 'AR' : player.role === 'Wicket-Keeper' ? 'WK' : player.role?.slice(0, 3)}
              </Badge>
              {player.jersey_number && (
                <span className="text-xs font-medium" style={{ color: colors.textMuted }}>#{player.jersey_number}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row - Hidden for non-members */}
        {!hideStats && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: colors.border }}>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: colors.accent }}>{player.matches_played || 0}</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>Mat</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: colors.accent }}>{player.runs_scored || 0}</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>Runs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: colors.accent }}>{player.wickets_taken || 0}</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>Wkts</div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}