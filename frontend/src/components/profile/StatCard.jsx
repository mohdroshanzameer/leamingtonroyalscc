import React from 'react';

export default function StatCard({ icon: Icon, label, value, subValue, trend, color = '#4ade80', large = false }) {
  return (
    <div 
      className={`rounded-2xl p-4 relative overflow-hidden ${large ? 'col-span-2' : ''}`}
      style={{ 
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />
      
      <div className="relative">
        {Icon && (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`font-bold text-white ${large ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
          {subValue && <span className="text-sm text-slate-400">{subValue}</span>}
        </div>
        {trend !== undefined && (
          <p className={`text-xs mt-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}