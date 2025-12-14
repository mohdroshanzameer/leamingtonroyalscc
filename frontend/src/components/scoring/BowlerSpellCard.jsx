import React from 'react';
import { Zap } from 'lucide-react';

export default function BowlerSpellCard({ 
  bowler, 
  currentSpell, 
  totalStats,
  allSpells = []
}) {
  if (!bowler || !currentSpell) return null;

  return (
    <div className="px-4">
      <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-xs font-medium">Current Spell</span>
          </div>
          <span className="text-white font-bold text-sm">
            {currentSpell.wickets}-{currentSpell.runs} ({currentSpell.overs})
          </span>
        </div>
        
        {/* Previous spells */}
        {allSpells.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {allSpells.slice(0, -1).map((spell, idx) => (
              <span key={idx} className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded">
                {spell.wickets}-{spell.runs} ({spell.overs})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}