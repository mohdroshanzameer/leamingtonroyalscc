import React from 'react';
import { Card } from "@/components/ui/card";
import { Users } from 'lucide-react';

export default function PartnershipCard({ 
  runs = 0, 
  balls = 0, 
  batsman1, 
  batsman2, 
  batsman1Runs = 0, 
  batsman2Runs = 0 
}) {
  const runRate = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';
  const contribution1 = runs > 0 ? Math.round((batsman1Runs / runs) * 100) : 50;
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 mx-4">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>Partnership</span>
          </div>
          <div className="text-right">
            <span className="text-white font-bold">{runs}</span>
            <span className="text-slate-500 text-sm">({balls})</span>
            <span className="text-slate-500 text-xs ml-2">RR: {runRate}</span>
          </div>
        </div>
        
        {/* Progress bar showing contribution */}
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 transition-all duration-300" 
            style={{ width: `${contribution1}%` }}
          />
          <div 
            className="bg-blue-500 transition-all duration-300" 
            style={{ width: `${100 - contribution1}%` }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] mt-1 text-slate-500">
          <span>{batsman1}: {batsman1Runs}</span>
          <span>{batsman2}: {batsman2Runs}</span>
        </div>
      </div>
    </Card>
  );
}