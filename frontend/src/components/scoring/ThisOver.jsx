import React from 'react';

export default function ThisOver({ overNumber, balls, maxBalls = 6 }) {
  const getBallStyle = (ball) => {
    if (ball.is_wicket) return 'bg-red-500 text-white';
    if (ball.is_six) return 'bg-purple-500 text-white';
    if (ball.is_four) return 'bg-green-500 text-white';
    if (ball.extra_type === 'wide') return 'bg-amber-500 text-black';
    if (ball.extra_type === 'no_ball') return 'bg-amber-600 text-white';
    if (ball.extra_type === 'bye' || ball.extra_type === 'leg_bye') return 'bg-orange-500 text-white';
    if (ball.runs === 0 && !ball.extras) return 'bg-slate-600 text-slate-300';
    return 'bg-slate-500 text-white';
  };

  const getDisplayValue = (ball) => {
    if (ball.is_wicket) return 'W';
    if (ball.extra_type === 'wide') {
      const total = (ball.extras || 1);
      return total > 1 ? `${total}Wd` : 'Wd';
    }
    if (ball.extra_type === 'no_ball') {
      const total = (ball.runs || 0) + (ball.extras || 1);
      return total > 1 ? `${total}Nb` : 'Nb';
    }
    if (ball.extra_type === 'bye') return `${ball.extras}B`;
    if (ball.extra_type === 'leg_bye') return `${ball.extras}Lb`;
    return String(ball.runs || 0);
  };

  // Calculate runs in this over
  const overRuns = balls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
  const legalBalls = balls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery).length;
  const emptySlots = Math.max(0, maxBalls - legalBalls);

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm font-medium">Over {overNumber}</span>
        <span className="text-slate-300 text-sm">{overRuns} runs</span>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap">
        {balls.map((ball, idx) => (
          <div
            key={ball.id || idx}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${getBallStyle(ball)} ${
              ball.is_free_hit ? 'ring-2 ring-red-400' : ''
            }`}
          >
            {getDisplayValue(ball)}
          </div>
        ))}
        
        {/* Empty slots for remaining balls */}
        {[...Array(emptySlots)].map((_, i) => (
          <div 
            key={`empty-${i}`} 
            className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 border-dashed"
          />
        ))}
      </div>
    </div>
  );
}