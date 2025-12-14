import React from 'react';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function ClubStatsSection({ stats }) {
  const currentStats = stats || CLUB_CONFIG.defaultStats;
  const winRate = currentStats.matches_played > 0 
    ? Math.round((currentStats.matches_won / currentStats.matches_played) * 100) 
    : 0;

  const statsItems = [
    { icon: Target, value: currentStats.matches_played, label: 'Matches' },
    { icon: Trophy, value: currentStats.matches_won, label: 'Victories' },
    { icon: TrendingUp, value: `${winRate}%`, label: 'Win Rate' },
    { icon: Award, value: currentStats.trophies_won || 0, label: 'Trophies' },
  ];

  return (
    <section style={{ 
      backgroundColor: colors.background,
      padding: 'clamp(2rem, 5vw, 4rem) 0'
    }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        {/* Grid: 2 cols mobile, auto-fit to 4 cols desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
        }}>
          {statsItems.map((stat, index) => (
            <div
              key={index}
              className="relative rounded-xl text-center group transition-all hover:scale-105"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                padding: 'clamp(1.25rem, 4vw, 1.5rem)',
              }}
            >
              <stat.icon className="mx-auto mb-3" style={{
                color: colors.accent,
                width: 'clamp(1.5rem, 5vw, 2rem)',
                height: 'clamp(1.5rem, 5vw, 2rem)',
              }} />
              <div className="font-bold mb-1" style={{
                color: colors.textPrimary,
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              }}>
                {stat.value}
              </div>
              <div style={{
                color: colors.textSecondary,
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}