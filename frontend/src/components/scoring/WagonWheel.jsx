import React from 'react';

export default function WagonWheel({ balls = [], size = 200 }) {
  // Define 8 zones (like a clock, starting from fine leg)
  const zones = [
    { angle: 22.5, label: 'Third Man' },
    { angle: 67.5, label: 'Point' },
    { angle: 112.5, label: 'Cover' },
    { angle: 157.5, label: 'Mid Off' },
    { angle: 202.5, label: 'Mid On' },
    { angle: 247.5, label: 'Mid Wicket' },
    { angle: 292.5, label: 'Square Leg' },
    { angle: 337.5, label: 'Fine Leg' },
  ];

  // Count runs per zone
  const zoneRuns = {};
  balls.forEach(ball => {
    if (ball.runs > 0 && ball.wagon_wheel_zone) {
      const zone = ball.wagon_wheel_zone;
      zoneRuns[zone] = (zoneRuns[zone] || 0) + ball.runs;
    }
  });

  // Generate shot lines
  const shotLines = balls
    .filter(b => b.runs > 0)
    .map((ball, idx) => {
      const zone = ball.wagon_wheel_zone || Math.floor(Math.random() * 8) + 1;
      const baseAngle = (zone - 1) * 45 + 22.5;
      const angle = (baseAngle + (Math.random() - 0.5) * 30) * (Math.PI / 180);
      
      // Length based on runs
      const length = ball.is_six ? size * 0.48 : ball.is_four ? size * 0.42 : size * 0.25 + ball.runs * 0.05 * size;
      
      const x2 = size / 2 + Math.sin(angle) * length;
      const y2 = size / 2 - Math.cos(angle) * length;
      
      return {
        x1: size / 2,
        y1: size / 2,
        x2,
        y2,
        runs: ball.runs,
        isFour: ball.is_four,
        isSix: ball.is_six,
      };
    });

  return (
    <div className="bg-slate-800/90 rounded-xl p-3">
      <h3 className="text-slate-400 text-xs font-medium mb-2 text-center">Wagon Wheel</h3>
      <svg width={size} height={size} className="mx-auto">
        {/* Field circles */}
        <circle cx={size/2} cy={size/2} r={size * 0.48} fill="#1a472a" stroke="#2d5a3d" strokeWidth="1" />
        <circle cx={size/2} cy={size/2} r={size * 0.35} fill="none" stroke="#2d5a3d" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx={size/2} cy={size/2} r={size * 0.2} fill="#c4a44a" stroke="#8b7635" strokeWidth="1" />
        
        {/* Pitch */}
        <rect 
          x={size/2 - 4} 
          y={size/2 - 15} 
          width="8" 
          height="30" 
          fill="#d4c088" 
          stroke="#a89860"
        />
        
        {/* Zone lines */}
        {zones.map((zone, i) => {
          const angle = zone.angle * (Math.PI / 180);
          const x2 = size/2 + Math.sin(angle) * size * 0.48;
          const y2 = size/2 - Math.cos(angle) * size * 0.48;
          return (
            <line
              key={i}
              x1={size/2}
              y1={size/2}
              x2={x2}
              y2={y2}
              stroke="#2d5a3d"
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity="0.5"
            />
          );
        })}
        
        {/* Shot lines */}
        {shotLines.map((shot, idx) => (
          <line
            key={idx}
            x1={shot.x1}
            y1={shot.y1}
            x2={shot.x2}
            y2={shot.y2}
            stroke={shot.isSix ? '#a855f7' : shot.isFour ? '#22c55e' : '#60a5fa'}
            strokeWidth={shot.isSix ? 3 : shot.isFour ? 2.5 : 1.5}
            opacity={0.8}
          />
        ))}
        
        {/* Batsman position */}
        <circle cx={size/2} cy={size/2} r="4" fill="#ef4444" />
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-3 mt-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-slate-400">6s</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500" />
          <span className="text-slate-400">4s</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-400" />
          <span className="text-slate-400">1-3</span>
        </div>
      </div>
    </div>
  );
}