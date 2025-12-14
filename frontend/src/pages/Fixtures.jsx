import React, { useState, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Loader2, Calendar, MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { format, parseISO } from 'date-fns';

const colors = CLUB_CONFIG.theme.colors;

// Match Row Component - Responsive design
function MatchRow({ match, showDate = false }) {
  const matchDate = match.match_date ? parseISO(match.match_date) : null;
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  
  return (
    <Link 
      to={createPageUrl(`MatchReport?id=${match.id}`)}
      className="block border-b last:border-b-0 hover:bg-white/5 transition-colors"
      style={{ borderColor: colors.border }}
    >
      <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem)' }}>
        {/* Match info row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <span className="px-1.5 py-0.5 rounded font-bold uppercase bg-red-500 text-white" style={{
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                }}>
                  Live
                </span>
              )}
              {isCompleted && (
                <span className="font-medium uppercase" style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                }}>
                  Result
                </span>
              )}
              {!isLive && !isCompleted && (
                <span className="font-medium uppercase" style={{ 
                  color: colors.accent,
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                }}>
                  Upcoming
                </span>
              )}
              {match.stage && match.stage !== 'league' && (
                <span style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                }}>
                  • {match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                </span>
              )}
            </div>
            
            {/* Teams */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span 
                  className={`font-medium ${match.winner_name === match.team1_name ? 'font-bold' : ''}`}
                  style={{ 
                    color: match.winner_name === match.team1_name ? colors.textPrimary : colors.textSecondary,
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  }}
                >
                  {match.team1_name}
                </span>
                {match.team1_score && (
                  <span className="font-semibold" style={{ 
                    color: colors.textPrimary,
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  }}>
                    {match.team1_score}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`font-medium ${match.winner_name === match.team2_name ? 'font-bold' : ''}`}
                  style={{ 
                    color: match.winner_name === match.team2_name ? colors.textPrimary : colors.textSecondary,
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  }}
                >
                  {match.team2_name}
                </span>
                {match.team2_score && (
                  <span className="font-semibold" style={{ 
                    color: colors.textPrimary,
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  }}>
                    {match.team2_score}
                  </span>
                )}
              </div>
            </div>

            {/* Result summary */}
            {match.result_summary && (
              <p className="mt-1" style={{ 
                color: colors.textMuted,
                fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
              }}>
                {match.result_summary}
              </p>
            )}
          </div>

          {/* Right side - Date/Time & Venue */}
          <div className="text-right shrink-0">
            {matchDate && (
              <>
                {showDate && (
                  <div className="font-medium" style={{ 
                    color: colors.textSecondary,
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                  }}>
                    {format(matchDate, 'dd MMM')}
                  </div>
                )}
                <div style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                }}>
                  {format(matchDate, 'h:mm a')}
                </div>
              </>
            )}
            {match.venue && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <MapPin style={{ 
                  color: colors.textMuted,
                  width: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                  height: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                }} />
                <span className="max-w-[120px] truncate" style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
                }}>
                  {match.venue}
                </span>
              </div>
            )}
            <ChevronRight className="ml-auto mt-1" style={{ 
              color: colors.textMuted,
              width: 'clamp(0.875rem, 2vw, 1rem)',
              height: 'clamp(0.875rem, 2vw, 1rem)',
            }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Date Group Component
function DateGroup({ dateLabel, matches }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (matches.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
        style={{ 
          backgroundColor: colors.surfaceHover,
          padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
        }}
      >
        <span className="font-semibold uppercase tracking-wide" style={{ 
          color: colors.textSecondary,
          fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
        }}>
          {dateLabel}
        </span>
        <ChevronDown 
          className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
          style={{ 
            color: colors.textMuted,
            width: 'clamp(0.875rem, 2vw, 1rem)',
            height: 'clamp(0.875rem, 2vw, 1rem)',
          }} 
        />
      </button>
      {isExpanded && (
        <div style={{ backgroundColor: colors.surface }}>
          {matches.map(match => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Fixtures() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();
  
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['tournamentMatches'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.entities.Tournament.list('-created_date', 150),
    staleTime: 5 * 60 * 1000,
  });

  const getMainCompetition = (match) => {
    if (!match.tournament_id) return 'Other';
    const tournament = tournaments.find(t => t.id === match.tournament_id);
    const name = tournament?.name || 'Other';
    if (name.toLowerCase().includes('wcl')) return 'WCL';
    if (name.toLowerCase().includes('lms')) return 'LMS LEAGUE';
    if (name.toLowerCase().includes('eagle')) return 'EAGLE PREMIER';
    if (name.toLowerCase().includes('friendly')) return 'Friendlies';
    return name.split(' ')[0] || 'Other';
  };

  const mainCompetitions = useMemo(() => {
    const comps = new Set();
    matches.forEach(m => comps.add(getMainCompetition(m)));
    return Array.from(comps).sort();
  }, [matches, tournaments]);

  const groupedByDate = useMemo(() => {
    const groups = {};
    matches.forEach(match => {
      const isCompleted = match.status === 'completed';
      if ((activeTab === 'upcoming' && isCompleted) || (activeTab === 'results' && !isCompleted)) {
        return;
      }
      
      const dateKey = match.match_date ? format(parseISO(match.match_date), 'yyyy-MM-dd') : 'TBD';
      const dateLabel = match.match_date ? format(parseISO(match.match_date), 'EEE, dd MMM yyyy') : 'Date TBD';
      if (!groups[dateKey]) groups[dateKey] = { label: dateLabel, matches: [] };
      groups[dateKey].matches.push(match);
    });
    
    Object.keys(groups).forEach(key => {
      groups[key].matches.sort((a, b) => {
        const dateA = a.match_date ? new Date(a.match_date) : new Date(0);
        const dateB = b.match_date ? new Date(b.match_date) : new Date(0);
        return activeTab === 'results' ? dateB - dateA : dateA - dateB;
      });
    });
    
    return groups;
  }, [matches, activeTab]);

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'TBD') return 1;
    if (b === 'TBD') return -1;
    return activeTab === 'results' ? b.localeCompare(a) : a.localeCompare(b);
  });

  const upcomingCount = matches.filter(m => m.status === 'scheduled' || m.status === 'live').length;
  const completedCount = matches.filter(m => m.status === 'completed').length;

  return (
    <div className="min-h-screen pt-16 lg:pt-0" style={{ backgroundColor: colors.background }}>
      
      {/* Header - Responsive */}
      <header 
        className="sticky top-14 lg:top-0 z-20 border-b"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="max-w-3xl lg:max-w-5xl mx-auto">
          {/* Title & Competition Dropdown */}
          <div className="flex items-center justify-between" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem)',
          }}>
            <h1 className="font-bold" style={{ 
              color: colors.textPrimary,
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            }}>
              Fixtures
            </h1>
            
            {/* Competition Dropdown */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  navigate(createPageUrl(`CompetitionFixtures?competition=${encodeURIComponent(e.target.value)}`));
                }
              }}
              className="rounded-lg font-semibold border outline-none cursor-pointer appearance-none bg-no-repeat bg-right"
              style={{ 
                backgroundColor: colors.surfaceHover, 
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 8px center',
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem) clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              }}
            >
              <option value="">Select Competition</option>
              {mainCompetitions.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex border-t" style={{ borderColor: colors.border }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              className="flex-1 text-center border-b-2 transition-colors font-medium"
              style={{ 
                borderColor: activeTab === 'upcoming' ? colors.accent : 'transparent',
                color: activeTab === 'upcoming' ? colors.textPrimary : colors.textMuted,
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              }}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className="flex-1 text-center border-b-2 transition-colors font-medium"
              style={{ 
                borderColor: activeTab === 'results' ? colors.accent : 'transparent',
                color: activeTab === 'results' ? colors.textPrimary : colors.textMuted,
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              }}
            >
              Results ({completedCount})
            </button>
          </div>
        </div>
      </header>

      {/* Match List */}
      <main className="max-w-3xl lg:max-w-5xl mx-auto pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : dateKeys.length === 0 ? (
          <div className="text-center px-4" style={{ padding: 'clamp(3rem, 10vw, 4rem) clamp(1rem, 3vw, 1.5rem)' }}>
            <Calendar className="mx-auto mb-3 opacity-30" style={{ 
              color: colors.textMuted,
              width: 'clamp(2rem, 8vw, 2.5rem)',
              height: 'clamp(2rem, 8vw, 2.5rem)',
            }} />
            <h3 className="font-medium mb-1" style={{ 
              color: colors.textSecondary,
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            }}>
              {activeTab === 'upcoming' ? 'No Upcoming Matches' : 'No Results Yet'}
            </h3>
            <p style={{ 
              color: colors.textMuted,
              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
            }}>
              {activeTab === 'upcoming' ? 'Check back soon for new fixtures' : 'Match results will appear here'}
            </p>
          </div>
        ) : (
          <div className="pt-2">
            {dateKeys.map(dateKey => (
              <DateGroup 
                key={dateKey} 
                dateLabel={groupedByDate[dateKey].label}
                matches={groupedByDate[dateKey].matches}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}