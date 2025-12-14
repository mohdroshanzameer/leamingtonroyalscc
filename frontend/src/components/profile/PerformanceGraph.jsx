import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

export default function PerformanceGraph({ matches = [], type = 'runs' }) {
  const [viewType, setViewType] = React.useState(type);

  if (!matches || matches.length < 2) {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
          Performance Trend
        </h3>
        <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>Need at least 2 matches for graph</p>
      </div>
    );
  }

  // Prepare data for chart (reverse so oldest is first)
  const chartData = [...matches].reverse().slice(-10).map((match, idx) => ({
    match: `M${idx + 1}`,
    runs: match.runs || 0,
    wickets: match.wickets || 0,
    date: match.date,
  }));

  // Calculate cumulative runs
  let cumulative = 0;
  const cumulativeData = chartData.map(d => {
    cumulative += d.runs;
    return { ...d, cumulative };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="px-3 py-2 rounded-lg shadow-lg"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>{label}</p>
          {viewType === 'runs' && (
            <p className="text-sm font-bold text-blue-400">{payload[0].value} runs</p>
          )}
          {viewType === 'wickets' && (
            <p className="text-sm font-bold text-red-400">{payload[0].value} wickets</p>
          )}
          {viewType === 'cumulative' && (
            <p className="text-sm font-bold text-emerald-400">{payload[0].value} total runs</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
          Performance Trend
        </h3>
        <div className="flex gap-1">
          {['runs', 'wickets', 'cumulative'].map((t) => (
            <button
              key={t}
              onClick={() => setViewType(t)}
              className={`px-2.5 py-1 text-[10px] uppercase font-medium rounded-full transition-colors ${
                viewType === t ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: viewType === t 
                  ? (t === 'runs' ? '#3b82f6' : t === 'wickets' ? '#ef4444' : '#10b981')
                  : colors.surfaceHover,
                color: viewType === t ? 'white' : colors.textMuted
              }}
            >
              {t === 'cumulative' ? 'Total' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'cumulative' ? (
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="match" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: colors.textMuted }}
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax + 20']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#colorCumulative)" 
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="match" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: colors.textMuted }}
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={viewType} 
                stroke={viewType === 'runs' ? '#3b82f6' : '#ef4444'} 
                strokeWidth={2}
                fill={viewType === 'runs' ? 'url(#colorRuns)' : 'url(#colorWickets)'}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
        <div className="text-center">
          <p className="text-sm font-bold text-blue-400">{chartData.reduce((s, d) => s + d.runs, 0)}</p>
          <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Total Runs</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-red-400">{chartData.reduce((s, d) => s + d.wickets, 0)}</p>
          <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Total Wkts</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
            {(chartData.reduce((s, d) => s + d.runs, 0) / chartData.length).toFixed(1)}
          </p>
          <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Avg Runs</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
            {Math.max(...chartData.map(d => d.runs))}
          </p>
          <p className="text-[8px] uppercase" style={{ color: colors.textMuted }}>Best</p>
        </div>
      </div>
    </div>
  );
}