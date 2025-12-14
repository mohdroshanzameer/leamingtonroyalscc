import React from 'react';
import { Star, Crown, Edit2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ProfileHeader({ user, player, membership, onEdit }) {
  const roleColors = {
    'Batsman': { bg: 'from-cyan-900 via-slate-900 to-slate-950', accent: '#06b6d4', icon: '🏏' },
    'Bowler': { bg: 'from-rose-900 via-slate-900 to-slate-950', accent: '#f43f5e', icon: '🎯' },
    'All-Rounder': { bg: 'from-violet-900 via-slate-900 to-slate-950', accent: '#8b5cf6', icon: '⚡' },
    'Wicket-Keeper': { bg: 'from-amber-900 via-slate-900 to-slate-950', accent: '#f59e0b', icon: '🧤' },
  };

  const roleStyle = roleColors[player?.role] || { bg: 'from-slate-800 via-slate-900 to-slate-950', accent: '#64748b', icon: '🏏' };

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${roleStyle.bg}`} />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${roleStyle.accent} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Content */}
      <div className="relative px-4 pt-16 pb-5">
        <div className="max-w-4xl mx-auto">
          {/* Top row: Avatar + Name + Edit */}
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-14 h-14 rounded-xl overflow-hidden border-2"
                style={{ 
                  borderColor: `${roleStyle.accent}50`,
                  boxShadow: `0 4px 16px ${roleStyle.accent}25`
                }}
              >
                {player?.photo_url ? (
                  <img src={player.photo_url} alt={player.player_name} className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${roleStyle.accent}40, ${roleStyle.accent}20)` }}
                  >
                    <span className="text-xl font-bold text-white">
                      {(player?.player_name || user?.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Jersey number badge */}
              {player?.jersey_number && (
                <div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md text-white font-bold text-xs flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: roleStyle.accent }}
                >
                  {player.jersey_number}
                </div>
              )}
            </div>

            {/* Name & icons */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-white truncate">
                  {player?.player_name || user?.full_name || 'Player'}
                </h1>
                {player?.is_captain && (
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                {player?.is_vice_captain && (
                  <Star className="w-4 h-4 text-purple-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: roleStyle.accent }}>
                <span>{roleStyle.icon}</span>
                <span className="font-medium">{player?.role || 'Player'}</span>
                {player?.team_name && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-white/50 truncate">{player.team_name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Edit Button */}
            {onEdit && (
              <Button
                size="sm"
                onClick={onEdit}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs h-8 px-2.5"
              >
                <Edit2 className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {membership && (
              <span 
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ 
                  backgroundColor: membership.status === 'Active' ? '#10b98120' : '#f59e0b20',
                  color: membership.status === 'Active' ? '#10b981' : '#f59e0b'
                }}
              >
                {membership.membership_type}
              </span>
            )}
            {player?.batting_style && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                {player.batting_style}
              </span>
            )}
            {player?.bowling_style && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                {player.bowling_style}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}