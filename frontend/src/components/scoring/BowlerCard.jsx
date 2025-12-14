import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BowlerCard({ 
  bowler, 
  stats,
  onClick,
  isEmpty,
  isNewOver,
  compact = false
}) {
  if (isEmpty) {
    return (
      <Card 
        onClick={onClick}
        className={`border-dashed cursor-pointer transition-all ${
          isNewOver 
            ? 'bg-amber-900/30 border-amber-500/50 animate-pulse' 
            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
        }`}
      >
        <div className={compact ? "p-2 text-center" : "p-3 text-center"}>
          <div className={`text-xs ${isNewOver ? 'text-amber-300' : 'text-slate-500'}`}>
            {isNewOver ? '⚾ New Bowler' : '+ Bowler'}
          </div>
        </div>
      </Card>
    );
  }

  const economy = stats?.overs && parseFloat(stats.overs) > 0 
    ? (stats.runs / parseFloat(stats.overs)).toFixed(1) 
    : '0.0';
  
  if (compact) {
    return (
      <Card 
        onClick={onClick}
        className="bg-gradient-to-r from-blue-900/60 to-slate-800/70 border-blue-700/50 cursor-pointer hover:bg-blue-900/70 transition-all"
      >
        <div className="p-2">
          <div className="flex items-center gap-1">
            <span className="text-blue-400 text-sm">🎯</span>
            <span className="font-medium text-xs text-white truncate">{bowler?.split(' ')[0]}</span>
          </div>
          <div className="text-lg font-bold text-white">
            {stats?.wickets || 0}-{stats?.runs || 0}
            <span className="text-slate-400 text-xs font-normal ml-0.5">({stats?.overs || '0.0'})</span>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      onClick={onClick}
      className="bg-gradient-to-r from-blue-900/60 to-slate-800/70 border-blue-700/50 cursor-pointer hover:bg-blue-900/70 transition-all"
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🎯</span>
            <span className="font-medium text-sm text-white">{bowler}</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">
              {stats?.wickets || 0}-{stats?.runs || 0}
              <span className="text-slate-400 text-xs font-normal ml-1">({stats?.overs || '0.0'})</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1.5 text-xs">
          {stats?.maidens > 0 && (
            <Badge className="bg-slate-600/50 text-slate-300 text-[10px] px-1.5">
              M: {stats.maidens}
            </Badge>
          )}
          {stats?.dotBalls > 0 && (
            <Badge className="bg-slate-600/50 text-slate-300 text-[10px] px-1.5">
              •: {stats.dotBalls}
            </Badge>
          )}
          <span className="text-slate-500 ml-auto">Econ: {economy}</span>
        </div>
      </div>
    </Card>
  );
}