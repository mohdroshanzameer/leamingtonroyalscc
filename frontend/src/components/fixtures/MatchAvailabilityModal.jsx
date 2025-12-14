import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, HelpCircle, AlertTriangle, Users } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const colors = CLUB_CONFIG.theme.colors;

const statusConfig = {
  'Available': { icon: Check, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  'Not Available': { icon: X, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  'Maybe': { icon: HelpCircle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  'Injured': { icon: AlertTriangle, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
};

export default function MatchAvailabilityModal({ isOpen, onClose, match, availability, totalPlayers }) {
  if (!match) return null;

  const grouped = {
    'Available': [],
    'Maybe': [],
    'Not Available': [],
    'Injured': [],
    'No Response': [],
  };

  // Group players by status
  availability.forEach(a => {
    const status = a.status || 'No Response';
    if (grouped[status]) {
      grouped[status].push(a);
    }
  });

  // Calculate no response count
  const respondedCount = availability.length;
  const noResponseCount = Math.max(0, totalPlayers - respondedCount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: colors.textPrimary }}>
            Match Availability
          </DialogTitle>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {match.team1_name} vs {match.team2_name}
          </p>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2 py-3">
          {['Available', 'Maybe', 'Not Available', 'Injured'].map(status => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const count = grouped[status]?.length || 0;
            return (
              <div 
                key={status} 
                className="text-center p-2 rounded-lg"
                style={{ backgroundColor: config.bg }}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: config.color }} />
                <div className="text-lg font-bold" style={{ color: config.color }}>{count}</div>
                <div className="text-[10px]" style={{ color: colors.textMuted }}>
                  {status === 'Not Available' ? 'Unavail' : status}
                </div>
              </div>
            );
          })}
        </div>

        {/* No Response Summary */}
        <div 
          className="flex items-center justify-between px-3 py-2 rounded-lg mb-3"
          style={{ backgroundColor: colors.surfaceHover }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: colors.textMuted }} />
            <span className="text-sm" style={{ color: colors.textSecondary }}>No Response</span>
          </div>
          <span className="text-sm font-medium" style={{ color: colors.textMuted }}>
            {noResponseCount} of {totalPlayers} players
          </span>
        </div>

        {/* Player Lists */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {['Available', 'Maybe', 'Not Available', 'Injured'].map(status => {
            const players = grouped[status];
            if (!players || players.length === 0) return null;
            
            const config = statusConfig[status];
            const Icon = config.icon;
            
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                  <span className="text-sm font-medium" style={{ color: config.color }}>
                    {status} ({players.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {players.map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ backgroundColor: config.bg }}
                    >
                      <span className="text-sm" style={{ color: colors.textPrimary }}>
                        {p.player_name}
                      </span>
                      {p.notes && (
                        <span className="text-xs truncate max-w-[120px]" style={{ color: colors.textMuted }}>
                          {p.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}