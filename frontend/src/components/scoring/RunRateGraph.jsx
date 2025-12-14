import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';

export default function RunRateGraph({ balls = [], requiredRunRate = null, ballsPerOver = 6 }) {
  // Group balls by over and calculate cumulative run rate
  const overData = [];
  let totalRuns = 0;
  let totalBalls = 0;
  
  // Get legal balls only
  const legalBalls = balls.filter(b => 
    !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery
  );
  
  // Calculate runs per over
  const maxOver = Math.max(...balls.map(b => b.over_number), 0);
  
  for (let over = 1; over <= maxOver; over++) {
    const overBalls = balls.filter(b => b.over_number === over);
    const overRuns = overBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const legalInOver = overBalls.filter(b => 
      !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery
    ).length;
    
    totalRuns += overRuns;
    totalBalls += legalInOver;
    
    const runRate = totalBalls > 0 ? (totalRuns / (totalBalls / ballsPerOver)).toFixed(2) : 0;
    
    overData.push({
      over,
      runs: overRuns,
      cumulative: totalRuns,
      runRate: parseFloat(runRate),
      requiredRR: requiredRunRate,
    });
  }

  if (overData.length === 0) {
    return (
      <div className="bg-slate-800/90 rounded-xl p-3">
        <h3 className="text-slate-400 text-xs font-medium mb-2">Run Rate</h3>
        <div className="h-24 flex items-center justify-center text-slate-500 text-xs">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 rounded-xl p-3">
      <h3 className="text-slate-400 text-xs font-medium mb-2">Run Rate by Over</h3>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={overData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis 
              dataKey="over" 
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              domain={[0, 'auto']}
            />
            
            {/* Required run rate line */}
            {requiredRunRate && (
              <ReferenceLine 
                y={requiredRunRate} 
                stroke="#ef4444" 
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            
            {/* Run rate area */}
            <Area
              type="monotone"
              dataKey="runRate"
              fill="#3b82f6"
              fillOpacity={0.2}
              stroke="none"
            />
            
            {/* Run rate line */}
            <Line
              type="monotone"
              dataKey="runRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 5, fill: '#60a5fa' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-slate-400">Run Rate</span>
        </div>
        {requiredRunRate && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500 border-dashed" />
            <span className="text-slate-400">Required ({requiredRunRate.toFixed(2)})</span>
          </div>
        )}
      </div>
    </div>
  );
}