import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BatsmanCard({ 
  batsman, 
  isStriker, 
  stats,
  onClick,
  isEmpty,
  compact = false
}) {
  if (isEmpty) {
    return (
      <Card 
        onClick={onClick}
        className="bg-slate-800/50 border-slate-700 border-dashed cursor-pointer hover:bg-slate-800 transition-all"
      >
        <div className={compact ? "p-2 text-center" : "p-3 text-center"}>
          <div className="text-slate-500 text-xs">+ {isStriker ? 'Striker' : 'Non-Striker'}</div>
        </div>
      </Card>
    );
  }

  const strikeRate = stats?.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(0) : '0';
  
  if (compact) {
    return (
      <Card 
        onClick={onClick}
        className={`cursor-pointer transition-all ${
          isStriker 
            ? 'bg-gradient-to-r from-emerald-900/80 to-emerald-800/60 border-emerald-500/50 ring-1 ring-emerald-500/30' 
            : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800'
        }`}
      >
        <div className="p-2">
          <div className="flex items-center gap-1">
            {isStriker && <span className="text-emerald-400 text-sm">*</span>}
            <span className={`font-medium text-xs truncate ${isStriker ? 'text-white' : 'text-slate-300'}`}>
              {batsman?.split(' ')[0]}
            </span>
          </div>
          <div className={`text-lg font-bold ${isStriker ? 'text-white' : 'text-slate-200'}`}>
            {stats?.runs || 0}
            <span className="text-slate-500 text-xs font-normal">({stats?.balls || 0})</span>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      onClick={onClick}
      className={`cursor-pointer transition-all ${
        isStriker 
          ? 'bg-gradient-to-r from-emerald-900/80 to-emerald-800/60 border-emerald-500/50 ring-1 ring-emerald-500/30' 
          : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800'
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isStriker && (
              <span className="text-emerald-400 text-lg">*</span>
            )}
            <span className={`font-medium text-sm ${isStriker ? 'text-white' : 'text-slate-300'}`}>
              {batsman}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${isStriker ? 'text-white' : 'text-slate-200'}`}>
              {stats?.runs || 0}
              <span className="text-slate-500 text-sm font-normal">({stats?.balls || 0})</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1.5 text-xs">
          {stats?.fours > 0 && (
            <Badge className="bg-green-600/30 text-green-300 border-green-600/50 text-[10px] px-1.5">
              {stats.fours}×4
            </Badge>
          )}
          {stats?.sixes > 0 && (
            <Badge className="bg-purple-600/30 text-purple-300 border-purple-600/50 text-[10px] px-1.5">
              {stats.sixes}×6
            </Badge>
          )}
          <span className="text-slate-500 ml-auto">SR: {strikeRate}</span>
        </div>
      </div>
    </Card>
  );
}