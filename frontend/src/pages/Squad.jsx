import React, { useState, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PlayerCard from '../components/team/PlayerCard';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { pages } = CLUB_CONFIG;
const colors = CLUB_CONFIG.theme.colors;

export default function Squad() {
  const { team: pageConfig } = pages;
  const [roleFilter, setRoleFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api.auth.me()
      .then(u => { setUser(u); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.entities.Team.list('name', 50),
  });

  const homeTeam = teams.find(t => t.is_home_team);

  const { data: players, isLoading } = useQuery({
    queryKey: ['teamPlayers', homeTeam?.id],
    queryFn: () => api.entities.TeamPlayer.filter({ team_id: homeTeam.id, status: 'Active' }, 'player_name', 100),
    enabled: !!homeTeam?.id,
    initialData: [],
  });

  // Non-logged-in users see no players
  const displayPlayers = user ? players : [];

  const filteredPlayers = roleFilter === 'all' 
    ? displayPlayers 
    : displayPlayers.filter(p => p.role === roleFilter);

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (a.is_captain) return -1;
    if (b.is_captain) return 1;
    if (a.is_vice_captain) return -1;
    if (b.is_vice_captain) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 lg:pt-12 pb-12 sm:pb-20 lg:pb-12" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0">
          <img
            src={pageConfig.backgroundImage}
            alt="Team"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: colors.accent }}>
            {pageConfig.subtitle}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.textOnDark }}>
            {pageConfig.title}
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: colors.textMuted }}>
            {pageConfig.description}
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section 
        className="sticky top-16 lg:top-0 z-30 backdrop-blur-md border-b"
        style={{ backgroundColor: `${colors.surface}f5`, borderColor: colors.border }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-auto">
          <Tabs value={roleFilter} onValueChange={setRoleFilter}>
            <TabsList className="p-1 rounded-full inline-flex min-w-max" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              {['all', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(role => (
                <TabsTrigger 
                  key={role}
                  value={role} 
                  className="rounded-full px-4 sm:px-6 text-xs sm:text-sm transition-colors"
                  style={{ 
                    backgroundColor: roleFilter === role ? colors.accent : 'transparent',
                    color: roleFilter === role ? '#000' : colors.textSecondary
                  }}
                >
                  {role === 'all' ? 'All' : role === 'All-Rounder' ? 'AR' : role === 'Wicket-Keeper' ? 'WK' : role === 'Batsman' ? 'Bat' : 'Bowl'}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Members Only Notice */}
      {!user && authChecked && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            className="rounded-lg p-8 text-center"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: colors.accent }} />
            <h3 className="font-semibold text-lg mb-2" style={{ color: colors.textPrimary }}>
              Members Only
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
              Squad and player information is only visible to club members. Sign in to view the full roster.
            </p>
            <Button 
              onClick={() => api.auth.redirectToLogin()}
              className="font-semibold"
              style={{ backgroundColor: colors.accent, color: '#000' }}
            >
              Sign In
            </Button>
          </div>
        </div>
      )}

      {/* Players Grid */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading || !authChecked ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colors.border }} />
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: colors.textSecondary }}>No Players Found</h3>
              <p className="text-sm sm:text-base" style={{ color: colors.textMuted }}>Team roster will be updated soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {sortedPlayers.map((player) => (
                <Link key={player.id} to={createPageUrl(`PlayerProfile?id=${player.id}`)}>
                  <PlayerCard player={player} hideStats={!user} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}