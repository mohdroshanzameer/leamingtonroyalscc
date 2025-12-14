import React, { useState, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, Calendar, Users, BarChart3, Settings, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { CLUB_CONFIG } from '../components/ClubConfig';

import TournamentTeams from '../components/tournament/TournamentTeams';
import TournamentFixtures from '../components/tournament/TournamentFixtures';
import TournamentPointsTable from '../components/tournament/TournamentPointsTable';
import TournamentBracket from '../components/tournament/TournamentBracket';
import TournamentStats from '../components/tournament/TournamentStats';
import TournamentSettings from '../components/tournament/TournamentSettings';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

const statusConfig = {
  draft: { color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', label: 'Draft' },
  registration: { color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500', label: 'Registration Open' },
  ongoing: { color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500 animate-pulse', label: 'Live' },
  completed: { color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500', label: 'Completed' },
  cancelled: { color: 'bg-red-50 text-red-600', dot: 'bg-red-500', label: 'Cancelled' },
};

const formatLabels = {
  knockout: 'Knockout',
  league: 'Round Robin',
  group_knockout: 'Group + Knockout',
  super_league: 'Super League',
};

export default function TournamentView() {
  const [activeTab, setActiveTab] = useState('fixtures');
  const [user, setUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  useEffect(() => {
    let mounted = true;
    api.auth.me()
      .then(u => { if (mounted) setUser(u); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const { data: tournament, isLoading: loadingTournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => api.entities.Tournament.filter({ id: tournamentId }, '-created_date', 1).then(r => r[0]),
    enabled: !!tournamentId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['tournamentTeams', tournamentId],
    queryFn: () => api.entities.TournamentTeam.filter({ tournament_id: tournamentId }, 'team_name', 100),
    enabled: !!tournamentId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['tournamentMatches', tournamentId],
    queryFn: () => api.entities.TournamentMatch.filter({ tournament_id: tournamentId }, 'match_number', 200),
    enabled: !!tournamentId,
  });

  if (!tournamentId) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Card className="max-w-md text-center p-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
          <p className="text-slate-500 mb-4">No tournament ID provided</p>
          <Link to={createPageUrl('Tournaments')}>
            <Button>View All Tournaments</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loadingTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Card className="max-w-md text-center p-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
          <p className="text-slate-500 mb-4">This tournament may have been deleted</p>
          <Link to={createPageUrl('Tournaments')}>
            <Button>View All Tournaments</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const approvedTeams = teams.filter(t => t.registration_status === 'approved');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 lg:pt-8 pb-12 sm:pb-16 lg:pb-10" style={{ backgroundColor: colors.secondary }}>
        {tournament.banner_url && (
          <div className="absolute inset-0">
            <img src={tournament.banner_url} alt="" className="w-full h-full object-cover opacity-20" />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Tournaments')} className="inline-flex items-center text-white/70 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tournaments
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Logo & Title */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                {tournament.logo_url ? (
                  <img src={tournament.logo_url} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
                ) : (
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: colors.accent }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[tournament.status]?.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[tournament.status]?.dot}`} />
                    {statusConfig[tournament.status]?.label}
                  </div>
                  <Badge variant="outline" className="border-white/30 text-white text-xs">
                    {formatLabels[tournament.format]}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
                  {tournament.name}
                </h1>
                {tournament.start_date && (
                  <p className="text-white/60 text-sm mt-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(tournament.start_date), 'dd MMM yyyy')}
                    {tournament.end_date && ` - ${format(new Date(tournament.end_date), 'dd MMM yyyy')}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="grid grid-cols-4 gap-2 sm:gap-6">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>{approvedTeams.length}</div>
              <div className="text-xs sm:text-sm" style={{ color: colors.textMuted }}>Teams</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.warning }}>{upcomingMatches.length}</div>
              <div className="text-xs sm:text-sm" style={{ color: colors.textMuted }}>Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.success }}>{completedMatches.length}</div>
              <div className="text-xs sm:text-sm" style={{ color: colors.textMuted }}>Played</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.textPrimary }}>{matches.length}</div>
              <div className="text-xs sm:text-sm" style={{ color: colors.textMuted }}>Total</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 sm:py-8">
        <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="p-1 rounded-xl inline-flex mb-6 sm:mb-8 flex-wrap gap-1" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <TabsTrigger 
                value="fixtures" 
                className="rounded-lg px-3 sm:px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-black"
                style={{ color: colors.textSecondary }}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Fixtures</span>
              </TabsTrigger>
              <TabsTrigger 
                value="standings" 
                className="rounded-lg px-3 sm:px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-black"
                style={{ color: colors.textSecondary }}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Standings</span>
              </TabsTrigger>
              {(tournament.format === 'knockout' || tournament.format === 'group_knockout') && (
                <TabsTrigger 
                  value="bracket" 
                  className="rounded-lg px-3 sm:px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-black"
                  style={{ color: colors.textSecondary }}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Bracket</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="teams" 
                className="rounded-lg px-3 sm:px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-black"
                style={{ color: colors.textSecondary }}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Teams</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="rounded-lg px-3 sm:px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-black"
                style={{ color: colors.textSecondary }}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="settings" 
                  className="rounded-lg px-3 sm:px-5 py-2 text-xs sm:text-sm flex items-center gap-1.5 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-black"
                  style={{ color: colors.textSecondary }}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="fixtures">
              <TournamentFixtures tournament={tournament} matches={matches} teams={teams} />
            </TabsContent>

            <TabsContent value="standings">
              <TournamentPointsTable tournament={tournament} teams={teams} />
            </TabsContent>

            <TabsContent value="bracket">
              <TournamentBracket tournament={tournament} matches={matches} />
            </TabsContent>

            <TabsContent value="teams">
              <TournamentTeams tournament={tournament} teams={teams} />
            </TabsContent>

            <TabsContent value="stats">
              <TournamentStats tournament={tournament} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="settings">
                <TournamentSettings tournament={tournament} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>
    </div>
  );
}