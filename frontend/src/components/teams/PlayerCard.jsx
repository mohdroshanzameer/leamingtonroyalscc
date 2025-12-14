import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Star, Edit, Trash2, User, Phone, Mail } from 'lucide-react';

const roleColors = {
  'Batsman': 'bg-blue-100 text-blue-700',
  'Bowler': 'bg-green-100 text-green-700',
  'All-Rounder': 'bg-purple-100 text-purple-700',
  'Wicket-Keeper': 'bg-amber-100 text-amber-700',
};

const statusColors = {
  'Active': 'bg-emerald-100 text-emerald-700',
  'Injured': 'bg-red-100 text-red-700',
  'Unavailable': 'bg-yellow-100 text-yellow-700',
  'Inactive': 'bg-slate-100 text-slate-600',
};

export default function PlayerCard({ player, onEdit, onDelete, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
        <div className="flex items-center gap-3">
          {player.jersey_number && (
            <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {player.jersey_number}
            </div>
          )}
          {!player.jersey_number && player.photo_url ? (
            <img src={player.photo_url} alt={player.player_name} className="w-8 h-8 rounded-full object-cover" />
          ) : !player.jersey_number && (
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">{player.player_name}</span>
              {player.is_captain && <Crown className="w-4 h-4 text-amber-500" />}
              {player.is_vice_captain && <Star className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${roleColors[player.role]}`}>{player.role}</Badge>
              {player.status !== 'Active' && (
                <Badge className={`text-xs ${statusColors[player.status]}`}>{player.status}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(player)}>
            <Edit className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete?.(player)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Photo */}
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.player_name} className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              {player.jersey_number ? (
                <span className="text-xl font-bold text-slate-600">{player.jersey_number}</span>
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800">{player.player_name}</h4>
              {player.is_captain && <Crown className="w-4 h-4 text-amber-500" />}
              {player.is_vice_captain && <Star className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs ${roleColors[player.role]}`}>{player.role}</Badge>
              {player.jersey_number && <span className="text-xs text-slate-500">#{player.jersey_number}</span>}
            </div>
          </div>

          {/* Status */}
          <Badge className={`${statusColors[player.status]}`}>{player.status}</Badge>
        </div>

        {/* Details */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
          {player.batting_style && <div>🏏 {player.batting_style}</div>}
          {player.bowling_style && <div>🎯 {player.bowling_style}</div>}
          {player.email && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="w-3 h-3" /> {player.email}
            </div>
          )}
          {player.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {player.phone}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-slate-100">
        <button 
          onClick={() => onEdit?.(player)}
          className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete?.(player)}
          className="flex-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-slate-100"
        >
          Remove
        </button>
      </div>
    </div>
  );
}