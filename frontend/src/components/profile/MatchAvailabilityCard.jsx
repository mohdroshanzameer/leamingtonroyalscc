import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, HelpCircle, MapPin, Clock } from 'lucide-react';

export default function MatchAvailabilityCard({ match, currentStatus, onStatusChange, isPending }) {
  const statusButtons = [
    { status: 'Available', icon: CheckCircle, color: 'bg-emerald-500', activeColor: 'ring-emerald-400' },
    { status: 'Maybe', icon: HelpCircle, color: 'bg-amber-500', activeColor: 'ring-amber-400' },
    { status: 'Not Available', icon: XCircle, color: 'bg-red-500', activeColor: 'ring-red-400' },
  ];

  return (
    <div 
      className="rounded-xl p-4 transition-all hover:scale-[1.01]"
      style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Match Info */}
        <div className="flex gap-3 flex-1 min-w-0">
          {/* Date Box */}
          <div 
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.2) 0%, rgba(74,222,128,0.1) 100%)' }}
          >
            <span className="text-lg font-bold text-emerald-400">
              {format(new Date(match.match_date), 'dd')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/70">
              {format(new Date(match.match_date), 'MMM')}
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white truncate">
              vs {match.team2_name || match.opponent || 'TBD'}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(match.match_date), 'HH:mm')}
              </span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {match.venue || 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          {statusButtons.map(({ status, icon: Icon, color, activeColor }) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              disabled={isPending}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                currentStatus === status 
                  ? `${color} ring-2 ${activeColor} ring-offset-2 ring-offset-slate-900 scale-110` 
                  : 'bg-slate-800/50 hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${currentStatus === status ? 'text-white' : 'text-slate-400'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}