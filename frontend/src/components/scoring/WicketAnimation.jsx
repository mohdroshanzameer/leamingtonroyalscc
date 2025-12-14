import React, { useEffect, useState } from 'react';

export default function WicketAnimation({ wicketType, dismissedBatsman, bowler, onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Animation stages
    const timer1 = setTimeout(() => setStage(1), 100);
    const timer2 = setTimeout(() => setStage(2), 500);
    const timer3 = setTimeout(() => setStage(3), 1500);
    const timer4 = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  const getWicketEmoji = () => {
    switch (wicketType) {
      case 'bowled': return '🎯';
      case 'caught': return '🙌';
      case 'caught_behind': return '🧤';
      case 'caught_and_bowled': return '👏';
      case 'lbw': return '🦵';
      case 'stumped': return '⚡';
      case 'run_out': return '🏃';
      case 'hit_wicket': return '💥';
      default: return '🔥';
    }
  };

  const getWicketLabel = () => {
    const labels = {
      bowled: 'BOWLED!',
      caught: 'CAUGHT!',
      caught_behind: 'CAUGHT BEHIND!',
      caught_and_bowled: 'CAUGHT & BOWLED!',
      lbw: 'LBW!',
      stumped: 'STUMPED!',
      run_out: 'RUN OUT!',
      hit_wicket: 'HIT WICKET!',
    };
    return labels[wicketType] || 'OUT!';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Dark overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          stage >= 1 ? 'opacity-70' : 'opacity-0'
        }`}
      />
      
      {/* Main content */}
      <div className={`relative z-10 text-center transition-all duration-500 ${
        stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        {/* Wicket icon with pulse */}
        <div className={`text-8xl mb-4 ${stage >= 2 ? 'animate-bounce' : ''}`}>
          {getWicketEmoji()}
        </div>
        
        {/* OUT text with glow */}
        <div 
          className={`font-black text-6xl md:text-8xl text-red-500 mb-4 transition-all duration-300 ${
            stage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
          }`}
          style={{
            textShadow: '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4)',
          }}
        >
          {getWicketLabel()}
        </div>
        
        {/* Dismissed batsman */}
        <div className={`transition-all duration-500 delay-200 ${
          stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="text-white text-2xl font-bold mb-2">
            {dismissedBatsman}
          </div>
          {bowler && wicketType !== 'run_out' && (
            <div className="text-amber-400 text-lg">
              b. {bowler}
            </div>
          )}
        </div>
        
        {/* Stumps flying animation */}
        {wicketType === 'bowled' && stage >= 2 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-16 bg-amber-200 rounded-sm animate-ping"
                style={{
                  left: `${45 + i * 5}%`,
                  top: '50%',
                  transform: `rotate(${-30 + i * 30}deg)`,
                  animation: `stumps-fly 1s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Red flash borders */}
      <div className={`absolute inset-0 border-8 border-red-500 transition-opacity duration-100 ${
        stage === 1 ? 'opacity-100' : 'opacity-0'
      }`} />
      
      <style>{`
        @keyframes stumps-fly {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-200px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}