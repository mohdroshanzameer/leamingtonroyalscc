import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Loader2, Calendar, MapPin, ChevronRight, ChevronDown, ArrowLeft, Check, X, HelpCircle, Users } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { format, parseISO } from 'date-fns';
import MatchAvailabilityModal from '@/components/fixtures/MatchAvailabilityModal';

const colors = CLUB_CONFIG.theme.colors;

// Match Row Component
function MatchRow({ match, availability = [], totalPlayers = 0, onShowAvailability }) {
  const matchDate = match.match_date ? parseISO(match.match_date) : null;
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const isUpcoming = !isCompleted && !isLive;

  // Calculate availability counts for this match
  const matchAvailability = availability.filter(a => a.match_id === match.id);
  const availableCount = matchAvailability.filter(a => a.status === 'Available').length;
  const maybeCount = matchAvailability.filter(a => a.status === 'Maybe').length;
  const notAvailableCount = matchAvailability.filter(a => a.status === 'Not Available').length;
  
  return (
    <div 
      className="border-b last:border-b-0 hover:bg-white/5 transition-colors"
      style={{ borderColor: colors.border }}
    >
      <Link 
        to={createPageUrl(`MatchReport?id=${match.id}`)}
        className="block"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isLive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500 text-white">
                    Live
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[10px] font-medium uppercase" style={{ color: colors.textMuted }}>
                    Result
                  </span>
                )}
                {isUpcoming && (
                  <span className="text-[10px] font-medium uppercase" style={{ color: colors.accent }}>
                    Upcoming
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span 
                    className={`text-sm font-medium ${match.winner_name === match.team1_name ? 'font-bold' : ''}`}
                    style={{ color: match.winner_name === match.team1_name ? colors.textPrimary : colors.textSecondary }}
                  >
                    {match.team1_name}
                  </span>
                  {match.team1_score && (
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {match.team1_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className={`text-sm font-medium ${match.winner_name === match.team2_name ? 'font-bold' : ''}`}
                    style={{ color: match.winner_name === match.team2_name ? colors.textPrimary : colors.textSecondary }}
                  >
                    {match.team2_name}
                  </span>
                  {match.team2_score && (
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {match.team2_score}
                    </span>
                  )}
                </div>
              </div>

              {match.result_summary && (
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  {match.result_summary}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              {matchDate && (
                <>
                  <div className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    {format(matchDate, 'dd MMM')}
                  </div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {format(matchDate, 'h:mm a')}
                  </div>
                </>
              )}
              {match.venue && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <MapPin className="w-3 h-3" style={{ color: colors.textMuted }} />
                  <span className="text-[11px] max-w-[100px] truncate" style={{ color: colors.textMuted }}>
                    {match.venue}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Availability Row - Only for upcoming matches */}
      {isUpcoming && (
        <div 
          className="px-4 pb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>{availableCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3 h-3" style={{ color: '#f59e0b' }} />
              <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>{maybeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="w-3 h-3" style={{ color: '#ef4444' }} />
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>{notAvailableCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" style={{ color: colors.textMuted }} />
              <span className="text-xs" style={{ color: colors.textMuted }}>{totalPlayers}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowAvailability(match, matchAvailability);
            }}
            className="text-xs px-2 py-1 rounded-md transition-colors hover:bg-white/10"
            style={{ color: colors.accent, border: `1px solid ${colors.accent}30` }}
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
}

// Date Group Component
function DateGroup({ dateLabel, matches, availability, totalPlayers, onShowAvailability }) {
  const [isExpanded, setIsExpanded] = useState(true);
  if (matches.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-left"
        style={{ backgroundColor: colors.surfaceHover }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
          {dateLabel}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
          style={{ color: colors.textMuted }} 
        />
      </button>
      {isExpanded && (
        <div style={{ backgroundColor: colors.surface }}>
          {matches.map(match => (
            <MatchRow 
              key={match.id} 
              match={match} 
              availability={availability}
              totalPlayers={totalPlayers}
              onShowAvailability={onShowAvailability}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompetitionFixtures() {
  const urlParams = new URLSearchParams(window.location.search);
  const competitionParam = urlParams.get('competition') || 'all';
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedSubCompetition, setSelectedSubCompetition] = useState('all');
  const [user, setUser] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedMatchAvailability, setSelectedMatchAvailability] = useState([]);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  // Reset sub-competition when season changes
  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setSelectedSubCompetition('all');
  };

  const handleShowAvailability = (match, matchAvail) => {
    setSelectedMatch(match);
    setSelectedMatchAvailability(matchAvail);
    setShowAvailabilityModal(true);
  };

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['tournamentMatches'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.entities.Tournament.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: seasons = [], isLoading: seasonsLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-start_date'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['matchAvailability'],
    queryFn: () => api.entities.MatchAvailability.list(),
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['teamPlayers'],
    queryFn: () => api.entities.TeamPlayer.filter({ status: 'Active' }),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const totalPlayers = players.length;
  const isLoading = matchesLoading || tournamentsLoading || seasonsLoading;

  // Create tournament lookup map
  const tournamentMap = useMemo(() => {
    const map = {};
    tournaments.forEach(t => { map[t.id] = t; });
    return map;
  }, [tournaments]);

  // Check if match belongs to the main competition
  const checkBelongsToCompetition = useMemo(() => {
    return (match) => {
      if (competitionParam === 'all') return true;
      const tournament = match.tournament_id ? tournamentMap[match.tournament_id] : null;
      const name = (tournament?.name || '').toLowerCase();
      const comp = competitionParam.toLowerCase();
      
      if (comp === 'wcl') return name.includes('wcl') || name.includes('warwickshire');
      if (comp === 'lms league') return name.includes('lms');
      if (comp === 'eagle premier') return name.includes('eagle');
      if (comp === 'friendlies') return name.includes('friendly');
      return name.includes(comp);
    };
  }, [competitionParam, tournamentMap]);

  // Get sub-competitions (filtered by selected season)
  const subCompetitions = useMemo(() => {
    const subs = new Set();
    matches.forEach(m => {
      if (checkBelongsToCompetition(m)) {
        const tournament = m.tournament_id ? tournamentMap[m.tournament_id] : null;
        // Filter by season if selected (use season_name field)
        if (selectedSeason !== 'all' && tournament?.season_name !== selectedSeason) return;
        if (tournament?.name) subs.add(tournament.name);
      }
    });
    return Array.from(subs).sort();
  }, [matches, tournamentMap, checkBelongsToCompetition, selectedSeason]);

  // Get available seasons from matches
  const availableSeasons = useMemo(() => {
    const seasonSet = new Set();
    matches.forEach(m => {
      if (checkBelongsToCompetition(m)) {
        const tournament = m.tournament_id ? tournamentMap[m.tournament_id] : null;
        if (tournament?.season_name) seasonSet.add(tournament.season_name);
      }
    });
    // Also add from Season entity
    seasons.forEach(s => seasonSet.add(s.name));
    return Array.from(seasonSet).sort().reverse();
  }, [matches, tournamentMap, seasons, checkBelongsToCompetition]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      if (!checkBelongsToCompetition(match)) return false;
      
      const tournament = match.tournament_id ? tournamentMap[match.tournament_id] : null;
      
      // Season filter (use season_name field)
      if (selectedSeason !== 'all') {
        if (tournament?.season_name !== selectedSeason) return false;
      }
      
      // Sub-competition filter
      if (selectedSubCompetition !== 'all') {
        if (tournament?.name !== selectedSubCompetition) return false;
      }
      
      return true;
    });
  }, [matches, tournamentMap, selectedSeason, selectedSubCompetition, competitionParam]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredMatches.forEach(match => {
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
  }, [filteredMatches, activeTab]);

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'TBD') return 1;
    if (b === 'TBD') return -1;
    return activeTab === 'results' ? b.localeCompare(a) : a.localeCompare(b);
  });

  const upcomingCount = filteredMatches.filter(m => m.status === 'scheduled' || m.status === 'live').length;
  const completedCount = filteredMatches.filter(m => m.status === 'completed').length;

  // Properly format competition title
const formatCompetitionTitle = (title) => {
  if (title === 'all') return 'All Fixtures';
  // Handle common abbreviations
  const abbrevs = ['wcl', 'lms', 'epl'];
  return title.split(' ').map(word => {
    if (abbrevs.includes(word.toLowerCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};
const competitionTitle = formatCompetitionTitle(competitionParam);

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: colors.background }}>
      
      {/* Header */}
      <header style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-3xl mx-auto">
          {/* Back & Title */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Link 
              to={createPageUrl('Fixtures')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {competitionTitle}
            </h1>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
            {/* Season Filter */}
            {availableSeasons.length > 0 && (
              <select
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer shrink-0"
                style={{ 
                  backgroundColor: colors.surfaceHover, 
                  borderColor: colors.border,
                  color: selectedSeason !== 'all' ? colors.accent : colors.textSecondary
                }}
              >
                <option value="all">All Seasons</option>
                {availableSeasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            )}

            {/* Sub-competition Filter - show when there are options */}
            {subCompetitions.length > 0 && (
              <select
                value={selectedSubCompetition}
                onChange={(e) => setSelectedSubCompetition(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer shrink-0"
                style={{ 
                  backgroundColor: colors.surfaceHover, 
                  borderColor: colors.border,
                  color: selectedSubCompetition !== 'all' ? colors.accent : colors.textSecondary
                }}
              >
                <option value="all">All Divisions</option>
                {subCompetitions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-t" style={{ borderColor: colors.border }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              className="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors"
              style={{ 
                borderColor: activeTab === 'upcoming' ? colors.accent : 'transparent',
                color: activeTab === 'upcoming' ? colors.textPrimary : colors.textMuted,
              }}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors"
              style={{ 
                borderColor: activeTab === 'results' ? colors.accent : 'transparent',
                color: activeTab === 'results' ? colors.textPrimary : colors.textMuted,
              }}
            >
              Results ({completedCount})
            </button>
          </div>
        </div>
      </header>

      {/* Match List */}
      <main className="max-w-3xl mx-auto pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : dateKeys.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: colors.textMuted }} />
            <h3 className="text-base font-medium mb-1" style={{ color: colors.textSecondary }}>
              {activeTab === 'upcoming' ? 'No Upcoming Matches' : 'No Results Yet'}
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
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
                availability={availability}
                totalPlayers={totalPlayers}
                onShowAvailability={handleShowAvailability}
              />
            ))}
          </div>
        )}
      </main>

      {/* Availability Modal */}
      <MatchAvailabilityModal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        match={selectedMatch}
        availability={selectedMatchAvailability}
        totalPlayers={totalPlayers}
      />
    </div>
  );
}