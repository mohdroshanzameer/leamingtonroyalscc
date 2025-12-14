import React from 'react';
import { Trophy, Calendar, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

// Competition color palette
const competitionColors = {
  default: { bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)', accent: '#00d4ff' },
  wcl: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', accent: '#8b5cf6' },
  lms: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', accent: '#10b981' },
  eagle: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', accent: '#fb923c' },
  friendly: { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)', accent: '#9ca3af' },
};

const getCompetitionTheme = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('wcl') || lower.includes('warwickshire')) return competitionColors.wcl;
  if (lower.includes('lms') || lower.includes('sunday')) return competitionColors.lms;
  if (lower.includes('eagle') || lower.includes('premier')) return competitionColors.eagle;
  if (lower.includes('friendly') || lower.includes('practice')) return competitionColors.friendly;
  return competitionColors.default;
};

export default function CompetitionCard({ name, stats, isSelected, onClick }) {
  const theme = getCompetitionTheme(name);
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      style={{ 
        backgroundColor: isSelected ? theme.bg : 'rgba(255,255,255,0.02)',
        borderColor: isSelected ? theme.accent : colors.border,
        ringColor: theme.accent,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: theme.bg }}
          >
            <Trophy className="w-4 h-4" style={{ color: theme.accent }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
              {name || 'Other'}
            </h3>
          </div>
        </div>
        <ChevronRight 
          className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} 
          style={{ color: isSelected ? theme.accent : colors.textMuted }} 
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="text-lg font-bold" style={{ color: theme.accent }}>{stats.upcoming}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Upcoming</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="text-lg font-bold" style={{ color: colors.success }}>{stats.completed}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Played</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="text-lg font-bold" style={{ color: colors.textPrimary }}>{stats.total}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Total</div>
        </div>
      </div>
    </button>
  );
}