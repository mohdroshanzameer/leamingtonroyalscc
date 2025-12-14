import React, { useState } from 'react';
import { Users, Check, X, HelpCircle } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

// Get initials from name
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Get short display name (first name + surname initial)
const getShortName = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const surnameInitial = parts[parts.length - 1][0]?.toUpperCase();
  return `${firstName} ${surnameInitial}`;
};

// Player chip with status color
const PlayerChip = ({ name, status }) => {
  const statusColors = {
    'Available': { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: '#10b981' },
    'Maybe': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '#f59e0b' },
    'Not Available': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '#ef4444' },
  };
  const style = statusColors[status] || { bg: colors.surfaceHover, color: colors.textPrimary, border: colors.border };
  
  return (
    <div 
      className="px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
      style={{ 
        backgroundColor: style.bg, 
        color: style.color,
        borderColor: style.border
      }}
      title={name}
    >
      {getShortName(name)}
    </div>
  );
};

export default function MatchAvailabilityList({ availability = [] }) {
  const [activeFilter, setActiveFilter] = useState(null);
  
  const available = availability.filter(a => a.status === 'Available');
  const notAvailable = availability.filter(a => a.status === 'Not Available');
  const maybe = availability.filter(a => a.status === 'Maybe');

  const totalResponses = availability.length;

  if (totalResponses === 0) {
    return (
      <div 
        className="mt-3 pt-3 border-t text-xs flex items-center gap-2"
        style={{ borderColor: colors.border, color: colors.textMuted }}
      >
        <Users className="w-3.5 h-3.5" />
        No availability responses yet
      </div>
    );
  }

  const handleFilterClick = (e, filter) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  // Get players to display based on filter
  const getDisplayPlayers = () => {
    if (activeFilter === 'Available') return available;
    if (activeFilter === 'Maybe') return maybe;
    if (activeFilter === 'Not Available') return notAvailable;
    return null; // Show grouped view
  };

  const displayPlayers = getDisplayPlayers();

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {/* Header with clickable status buttons */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={(e) => handleFilterClick(e, 'Available')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${activeFilter === 'Available' ? 'ring-1' : 'hover:bg-white/5'}`}
          style={{ 
            backgroundColor: activeFilter === 'Available' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: '#10b981',
            ringColor: '#10b981'
          }}
        >
          <Check className="w-4 h-4" />
          <span className="font-bold text-sm">{available.length}</span>
        </button>
        
        <button
          onClick={(e) => handleFilterClick(e, 'Maybe')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${activeFilter === 'Maybe' ? 'ring-1' : 'hover:bg-white/5'}`}
          style={{ 
            backgroundColor: activeFilter === 'Maybe' ? 'rgba(245,158,11,0.15)' : 'transparent',
            color: '#f59e0b',
            ringColor: '#f59e0b'
          }}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="font-bold text-sm">{maybe.length}</span>
        </button>
        
        <button
          onClick={(e) => handleFilterClick(e, 'Not Available')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${activeFilter === 'Not Available' ? 'ring-1' : 'hover:bg-white/5'}`}
          style={{ 
            backgroundColor: activeFilter === 'Not Available' ? 'rgba(239,68,68,0.15)' : 'transparent',
            color: '#ef4444',
            ringColor: '#ef4444'
          }}
        >
          <X className="w-4 h-4" />
          <span className="font-bold text-sm">{notAvailable.length}</span>
        </button>
      </div>

      {/* Player Chips Display */}
      {displayPlayers ? (
        // Filtered view - show selected category
        <div className="flex flex-wrap gap-1.5">
          {displayPlayers.length === 0 ? (
            <span className="text-xs" style={{ color: colors.textMuted }}>No players</span>
          ) : (
            displayPlayers.map((a) => (
              <PlayerChip key={a.id} name={a.player_name} status={a.status} />
            ))
          )}
        </div>
      ) : (
        // Default grouped view - show first few of each
        <div className="flex flex-wrap gap-1.5">
          {available.slice(0, 3).map((a) => (
            <PlayerChip key={a.id} name={a.player_name} status={a.status} />
          ))}
          {available.length > 3 && (
            <button
              onClick={(e) => handleFilterClick(e, 'Available')}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}
            >
              +{available.length - 3}
            </button>
          )}
          {maybe.slice(0, 2).map((a) => (
            <PlayerChip key={a.id} name={a.player_name} status={a.status} />
          ))}
          {maybe.length > 2 && (
            <button
              onClick={(e) => handleFilterClick(e, 'Maybe')}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
            >
              +{maybe.length - 2}
            </button>
          )}
          {notAvailable.slice(0, 2).map((a) => (
            <PlayerChip key={a.id} name={a.player_name} status={a.status} />
          ))}
          {notAvailable.length > 2 && (
            <button
              onClick={(e) => handleFilterClick(e, 'Not Available')}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
            >
              +{notAvailable.length - 2}
            </button>
          )}
        </div>
      )}
    </div>
  );
}