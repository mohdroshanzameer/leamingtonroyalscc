import React from 'react';
import { Target } from 'lucide-react';

export default function RequiredRunsPerOver({ 
  runsNeeded, 
  ballsRemaining, 
  maxOvers,
  ballsPerOver = 6
}) {
  if (!runsNeeded || ballsRemaining <= 0) return null;

  const oversRemaining = ballsRemaining / ballsPerOver;
  const requiredRR = runsNeeded / oversRemaining;
  
  // Calculate runs needed per over for remaining overs
  const fullOversLeft = Math.floor(ballsRemaining / ballsPerOver);
  const ballsInPartialOver = ballsRemaining % ballsPerOver;
  
  // Determine difficulty level
  let difficulty = 'easy';
  if (requiredRR > 12) difficulty = 'hard';
  else if (requiredRR > 9) difficulty = 'medium';
  else if (requiredRR > 6) difficulty = 'moderate';

  const difficultyColors = {
    easy: 'text-emerald-400 bg-emerald-900/30',
    moderate: 'text-blue-400 bg-blue-900/30',
    medium: 'text-amber-400 bg-amber-900/30',
    hard: 'text-red-400 bg-red-900/30'
  };

  return (
    <div className={`mx-4 rounded-lg p-3 ${difficultyColors[difficulty]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">Required</span>
        </div>
        <div className="text-right">
          <span className="font-bold">{runsNeeded} runs</span>
          <span className="text-white/60 text-sm ml-2">
            from {fullOversLeft > 0 ? `${fullOversLeft}.${ballsInPartialOver}` : ballsInPartialOver} overs
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-xs opacity-80">
        {requiredRR <= 6 && "Comfortable chase - maintain steady pace"}
        {requiredRR > 6 && requiredRR <= 9 && "Need to accelerate slightly"}
        {requiredRR > 9 && requiredRR <= 12 && "Challenging - need boundaries"}
        {requiredRR > 12 && "Steep ask - need quick runs!"}
      </div>
    </div>
  );
}