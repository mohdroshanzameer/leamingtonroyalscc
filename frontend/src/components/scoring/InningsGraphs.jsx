import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area 
} from 'recharts';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

/**
 * Process balls into over-by-over data for graphing
 */
const processOverData = (balls) => {
  if (!balls || balls.length === 0) return [];
  
  const overMap = {};
  let cumulativeRuns = 0;
  let cumulativeWickets = 0;
  let legalBalls = 0;
  
  balls.forEach(ball => {
    const overNum = ball.over_number || 1;
    if (!overMap[overNum]) {
      overMap[overNum] = { runs: 0, wickets: 0, balls: 0 };
    }
    
    const ballRuns = (ball.runs || 0) + (ball.extras || 0);
    overMap[overNum].runs += ballRuns;
    
    if (ball.is_wicket) {
      overMap[overNum].wickets++;
    }
    
    if (ball.extra_type !== 'wide' && ball.extra_type !== 'no_ball') {
      overMap[overNum].balls++;
    }
  });
  
  const data = [];
  Object.keys(overMap).sort((a, b) => Number(a) - Number(b)).forEach(overNum => {
    cumulativeRuns += overMap[overNum].runs;
    cumulativeWickets += overMap[overNum].wickets;
    legalBalls += overMap[overNum].balls;
    
    const oversCompleted = legalBalls / 6;
    const runRate = oversCompleted > 0 ? (cumulativeRuns / oversCompleted).toFixed(2) : 0;
    
    data.push({
      over: Number(overNum),
      runs: overMap[overNum].runs,
      wickets: overMap[overNum].wickets,
      cumulative: cumulativeRuns,
      runRate: parseFloat(runRate)
    });
  });
  
  return data;
};

/**
 * Per Over Runs & Wickets Chart
 */
export function OverByOverChart({ balls, teamName }) {
  const data = processOverData(balls);
  
  if (data.length === 0) return null;
  
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h4 className="font-semibold text-sm mb-3" style={{ color: colors.textPrimary }}>
        📊 {teamName} - Runs Per Over
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis 
            dataKey="over" 
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            domain={[0, 'auto']}
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colors.surface, 
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.textPrimary
            }}
            labelFormatter={(val) => `Over ${val}`}
          />
          <Bar yAxisId="left" dataKey="runs" fill="#3b82f6" name="Runs" radius={[4, 4, 0, 0]} />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="runRate" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
            name="Run Rate"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Wickets indicator */}
      <div className="flex flex-wrap gap-2 mt-2">
        {data.filter(d => d.wickets > 0).map((d, i) => (
          <span 
            key={i} 
            className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
          >
            Over {d.over}: {d.wickets}W
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Run Rate Comparison Chart (Worm Chart)
 */
export function RunRateComparisonChart({ innings1Balls, innings2Balls, team1Name, team2Name }) {
  const data1 = processOverData(innings1Balls);
  const data2 = processOverData(innings2Balls);
  
  if (data1.length === 0 && data2.length === 0) return null;
  
  // Merge data for comparison
  const maxOvers = Math.max(
    data1.length > 0 ? data1[data1.length - 1].over : 0,
    data2.length > 0 ? data2[data2.length - 1].over : 0
  );
  
  const comparisonData = [];
  for (let over = 1; over <= maxOvers; over++) {
    const inn1 = data1.find(d => d.over === over);
    const inn2 = data2.find(d => d.over === over);
    
    comparisonData.push({
      over,
      [team1Name]: inn1?.cumulative || (comparisonData[over - 2]?.[team1Name] || 0),
      [team2Name]: inn2?.cumulative || (comparisonData[over - 2]?.[team2Name] || 0),
      [`${team1Name} RR`]: inn1?.runRate || null,
      [`${team2Name} RR`]: inn2?.runRate || null
    });
  }
  
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h4 className="font-semibold text-sm mb-3" style={{ color: colors.textPrimary }}>
        📈 Score Comparison (Worm)
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis 
            dataKey="over" 
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
            label={{ value: 'Overs', position: 'bottom', fill: colors.textMuted, fontSize: 10 }}
          />
          <YAxis 
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
            label={{ value: 'Runs', angle: -90, position: 'insideLeft', fill: colors.textMuted, fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colors.surface, 
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.textPrimary
            }}
            labelFormatter={(val) => `After Over ${val}`}
          />
          <Legend 
            wrapperStyle={{ color: colors.textSecondary, fontSize: 11 }}
          />
          <Line 
            type="monotone" 
            dataKey={team1Name} 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey={team2Name} 
            stroke="#f59e0b" 
            strokeWidth={3}
            dot={{ fill: '#f59e0b', r: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Run Rate Comparison */}
      <div className="mt-4">
        <h5 className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>Run Rate Progression</h5>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis 
              dataKey="over" 
              tick={{ fill: colors.textMuted, fontSize: 9 }}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis 
              domain={[0, 'auto']}
              tick={{ fill: colors.textMuted, fontSize: 9 }}
              axisLine={{ stroke: colors.border }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: colors.surface, 
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textPrimary
              }}
              labelFormatter={(val) => `Over ${val}`}
            />
            <Line 
              type="monotone" 
              dataKey={`${team1Name} RR`} 
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey={`${team2Name} RR`} 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Manhattan Chart (Classic cricket scoring chart)
 */
export function ManhattanChart({ innings1Balls, innings2Balls, team1Name, team2Name }) {
  const data1 = processOverData(innings1Balls);
  const data2 = processOverData(innings2Balls);
  
  if (data1.length === 0 && data2.length === 0) return null;
  
  const maxOvers = Math.max(
    data1.length > 0 ? data1[data1.length - 1].over : 0,
    data2.length > 0 ? data2[data2.length - 1].over : 0
  );
  
  const comparisonData = [];
  for (let over = 1; over <= maxOvers; over++) {
    const inn1 = data1.find(d => d.over === over);
    const inn2 = data2.find(d => d.over === over);
    
    comparisonData.push({
      over,
      [team1Name]: inn1?.runs || 0,
      [team2Name]: inn2?.runs || 0
    });
  }
  
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <h4 className="font-semibold text-sm mb-3" style={{ color: colors.textPrimary }}>
        📊 Manhattan - Runs Per Over Comparison
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis 
            dataKey="over" 
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
          />
          <YAxis 
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={{ stroke: colors.border }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colors.surface, 
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.textPrimary
            }}
            labelFormatter={(val) => `Over ${val}`}
          />
          <Legend 
            wrapperStyle={{ color: colors.textSecondary, fontSize: 11 }}
          />
          <Bar dataKey={team1Name} fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey={team2Name} fill="#f59e0b" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}