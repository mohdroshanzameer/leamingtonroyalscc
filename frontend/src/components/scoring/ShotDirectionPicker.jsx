import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

// Boundary positions for 4s and 6s (deep fielding positions)
const zones = [
  { id: 1, label: 'Third Man', shortLabel: '3M', angle: -22.5 },
  { id: 2, label: 'Deep Point', shortLabel: 'DP', angle: -67.5 },
  { id: 3, label: 'Deep Cover', shortLabel: 'DC', angle: -112.5 },
  { id: 4, label: 'Long Off', shortLabel: 'LO', angle: -157.5 },
  { id: 5, label: 'Long On', shortLabel: 'LN', angle: 157.5 },
  { id: 6, label: 'Deep Mid-Wicket', shortLabel: 'DM', angle: 112.5 },
  { id: 7, label: 'Deep Square Leg', shortLabel: 'DS', angle: 67.5 },
  { id: 8, label: 'Fine Leg', shortLabel: 'FL', angle: 22.5 },
];

export default function ShotDirectionPicker({ open, onClose, onSelect, runs, batsmanName = '', existingShots = [] }) {
  const handleZoneClick = (zone) => {
    onSelect(zone.id);
  };

  const handleSkip = () => {
    onSelect(null);
  };

  const isSix = runs === 6;
  
  // Count shots per zone for heat map effect
  const shotCounts = zones.reduce((acc, zone) => {
    acc[zone.id] = existingShots.filter(s => s.wagon_wheel_zone === zone.id).length;
    return acc;
  }, {});
  
  const maxShots = Math.max(...Object.values(shotCounts), 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 max-w-[340px] p-0 [&>button]:hidden">
        {/* Header */}
        <div className={`px-4 py-3 rounded-t-lg ${isSix ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-green-600 to-green-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-medium">Shot Direction</p>
              <p className="text-white font-bold text-lg">
                {isSix ? '🚀 MAXIMUM SIX!' : '🏏 BOUNDARY FOUR!'}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {batsmanName && (
            <p className="text-white/70 text-xs mt-1">{batsmanName}</p>
          )}
        </div>
        
        <div className="p-4">
          {/* Wagon Wheel */}
          <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
            <svg width="280" height="280" className="absolute inset-0">
              {/* Gradient definitions */}
              <defs>
                <radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.05)" />
                  <stop offset="100%" stopColor="rgba(34, 197, 94, 0.15)" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Outer boundary with glow */}
              <circle 
                cx="140" cy="140" r="130" 
                fill="url(#fieldGradient)" 
                stroke={isSix ? 'rgba(168, 85, 247, 0.6)' : 'rgba(34, 197, 94, 0.6)'} 
                strokeWidth="3" 
              />
              
              {/* 30 yard circle */}
              <circle 
                cx="140" cy="140" r="85" 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.15)" 
                strokeWidth="1" 
                strokeDasharray="8,4" 
              />
              
              {/* Inner circle (close-in) */}
              <circle 
                cx="140" cy="140" r="45" 
                fill="rgba(210, 180, 140, 0.1)" 
                stroke="rgba(210, 180, 140, 0.3)" 
                strokeWidth="1" 
              />
              
              {/* Pitch */}
              <rect x="136" y="115" width="8" height="50" fill="rgba(210, 180, 140, 0.6)" rx="2" />
              <rect x="138" y="118" width="4" height="6" fill="rgba(255, 255, 255, 0.5)" rx="1" />
              <rect x="138" y="156" width="4" height="6" fill="rgba(255, 255, 255, 0.5)" rx="1" />
              
              {/* Zone segments with hover areas */}
              {zones.map((zone, idx) => {
                const startAngle = zone.angle - 22.5;
                const endAngle = zone.angle + 22.5;
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                const x1 = 140 + 130 * Math.cos(startRad);
                const y1 = 140 + 130 * Math.sin(startRad);
                const x2 = 140 + 130 * Math.cos(endRad);
                const y2 = 140 + 130 * Math.sin(endRad);
                
                // Heat intensity based on previous shots
                const intensity = shotCounts[zone.id] / maxShots;
                const heatColor = isSix 
                  ? `rgba(168, 85, 247, ${0.1 + intensity * 0.3})`
                  : `rgba(34, 197, 94, ${0.1 + intensity * 0.3})`;
                
                return (
                  <g key={zone.id}>
                    {/* Zone fill for heat map */}
                    <path
                      d={`M 140 140 L ${x1} ${y1} A 130 130 0 0 1 ${x2} ${y2} Z`}
                      fill={heatColor}
                      className="transition-all duration-300"
                    />
                    {/* Zone divider lines */}
                    <line
                      x1="140" y1="140"
                      x2={x1} y2={y1}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>
            
            {/* Zone buttons - larger and more visible */}
            {zones.map(zone => {
              const radians = (zone.angle - 90) * Math.PI / 180;
              const x = 140 + 100 * Math.cos(radians) - 26;
              const y = 140 + 100 * Math.sin(radians) - 26;
              const hasShots = shotCounts[zone.id] > 0;
              
              return (
                <button
                  key={zone.id}
                  onClick={() => handleZoneClick(zone)}
                  className={`absolute w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center text-white font-bold transition-all duration-200 hover:scale-115 active:scale-95 ${
                    isSix 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600' 
                      : 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-400 hover:to-green-600'
                  }`}
                  style={{ 
                    left: x, 
                    top: y,
                    boxShadow: hasShots 
                      ? `0 0 20px ${isSix ? '#a855f7' : '#22c55e'}, 0 0 40px ${isSix ? '#a855f780' : '#22c55e80'}`
                      : `0 4px 15px rgba(0,0,0,0.4)`,
                    border: hasShots ? `2px solid ${isSix ? '#c084fc' : '#4ade80'}` : '2px solid rgba(255,255,255,0.2)',
                  }}
                  title={zone.label}
                >
                  <span className="text-[10px] opacity-80 leading-none">{zone.shortLabel}</span>
                  {hasShots && (
                    <span className="text-[9px] bg-white/20 rounded px-1 mt-0.5">{shotCounts[zone.id]}</span>
                  )}
                </button>
              );
            })}
            
            {/* Center batsman indicator */}
            <div 
              className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white shadow-lg flex items-center justify-center"
              style={{ left: 124, top: 124 }}
            >
              <span className="text-[10px]">🏏</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${isSix ? 'bg-purple-600' : 'bg-green-600'}`} />
              <span>Tap zone</span>
            </div>
            {Object.values(shotCounts).some(c => c > 0) && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${isSix ? 'bg-purple-400' : 'bg-green-400'} ring-2 ring-white/50`} />
                <span>Previous shots</span>
              </div>
            )}
          </div>
          
          {/* Skip button */}
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full mt-3 text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
          >
            Skip (don't record direction)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}