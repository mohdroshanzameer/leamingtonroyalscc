import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { MapPin, Clock, ChevronRight, CalendarDays, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { CLUB_CONFIG } from '@/components/ClubConfig';

const theme = CLUB_CONFIG.theme || {};
const colors = theme.colors || {};

export default function UpcomingMatches({ matches }) {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <section style={{ 
      backgroundColor: colors.background,
      padding: 'clamp(2rem, 5vw, 4rem) 0'
    }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        {/* Section Header - Mobile first stack, desktop flex */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: 'clamp(2rem, 4vw, 2.5rem)'
        }}>
          <div>
            <p className="font-semibold uppercase tracking-wider mb-2" style={{ 
              color: colors.accent,
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}>
              Schedule
            </p>
            <h2 className="font-bold" style={{ 
              color: colors.textPrimary,
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              marginBottom: '0.5rem'
            }}>
              Upcoming Fixtures
            </h2>
            <p style={{ 
              color: colors.textMuted,
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}>
              Don't miss our next matches
            </p>
          </div>
          <Link 
            to={createPageUrl('Fixtures')}
            className="inline-flex items-center gap-2 font-medium transition-all group"
            style={{ 
              color: colors.accent,
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              alignSelf: 'flex-start'
            }}
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Matches Grid - Mobile 1 col, Auto-fit responsive */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
        }}>
          {matches.slice(0, 3).map((match, index) => (
            <div
              key={match.id}
              className="group relative rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                padding: 'clamp(1rem, 3vw, 1.25rem)'
              }}
            >
              {/* Match Number Indicator */}
              <div 
                className="absolute -top-2 -right-2 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                style={{ 
                  backgroundColor: colors.accent,
                  color: '#000',
                  width: 'clamp(1.75rem, 4vw, 2rem)',
                  height: 'clamp(1.75rem, 4vw, 2rem)',
                }}
              >
                {index + 1}
              </div>

              {/* Date & Type */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2" style={{ 
                  color: colors.textSecondary,
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                }}>
                  <div className="rounded-lg flex items-center justify-center" style={{ 
                    backgroundColor: colors.accentLight,
                    width: 'clamp(1.75rem, 5vw, 2rem)',
                    height: 'clamp(1.75rem, 5vw, 2rem)',
                  }}>
                    <CalendarDays style={{ 
                      color: colors.accent,
                      width: 'clamp(0.875rem, 3vw, 1rem)',
                      height: 'clamp(0.875rem, 3vw, 1rem)',
                    }} />
                  </div>
                  {format(new Date(match.match_date), 'EEE, MMM d')}
                </div>
                <Badge 
                  style={{ 
                    backgroundColor: colors.surfaceHover, 
                    color: colors.textSecondary,
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                  }}
                >
                  {match.stage || 'Match'}
                </Badge>
              </div>

              {/* Teams */}
              <div className="mb-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg flex items-center justify-center font-bold" style={{ 
                    backgroundColor: colors.accent,
                    color: '#000',
                    width: 'clamp(2rem, 6vw, 2.5rem)',
                    height: 'clamp(2rem, 6vw, 2.5rem)',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }}>
                    {(match.team1_name || 'T1').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="font-bold" style={{ 
                    color: colors.textPrimary,
                    fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)'
                  }}>
                    {match.team1_name}
                  </div>
                </div>
                <div className="font-medium uppercase tracking-wider my-2 ml-12" style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                }}>
                  vs
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg flex items-center justify-center font-bold" style={{ 
                    backgroundColor: colors.surfaceHover,
                    color: colors.textSecondary,
                    width: 'clamp(2rem, 6vw, 2.5rem)',
                    height: 'clamp(2rem, 6vw, 2.5rem)',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }}>
                    {(match.team2_name || 'T2').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="font-bold" style={{ 
                    color: colors.textPrimary,
                    fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)'
                  }}>
                    {match.team2_name}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center gap-3 pt-4 border-t" style={{ 
                borderColor: colors.borderLight,
                color: colors.textMuted,
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
              }}>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: colors.surfaceHover }}>
                  <Clock style={{ 
                    color: colors.accent,
                    width: 'clamp(0.75rem, 2vw, 0.875rem)',
                    height: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }} />
                  {format(new Date(match.match_date), 'h:mm a')}
                </div>
                <div className="flex items-center gap-1.5 truncate px-2 py-1 rounded-md" style={{ backgroundColor: colors.surfaceHover }}>
                  <MapPin style={{ 
                    color: colors.danger,
                    width: 'clamp(0.75rem, 2vw, 0.875rem)',
                    height: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }} className="flex-shrink-0" />
                  <span className="truncate">{match.venue || 'TBA'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}