import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Calendar, MapPin, Users, Settings, ArrowLeft, Play, Plus, RefreshCw, Award, Target, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../components/ClubConfig';
import { canViewAdmin } from '../components/RoleAccess';

import PointsTable from '../components/tournaments/PointsTable';
import TournamentFixtures from '../components/tournaments/TournamentFixtures';
import TournamentTeams from '../components/tournaments/TournamentTeams';
import TournamentStats from '../components/tournaments/TournamentStats';
import KnockoutBracket from '../components/tournaments/KnockoutBracket';
import AddTeamDialog from '../components/tournaments/AddTeamDialog';
import GenerateFixturesDialog from '../components/tournaments/GenerateFixturesDialog';
import TournamentSettingsDialog from '../components/tournaments/TournamentSettingsDialog';

const { colors } = CLUB_CONFIG.theme;

export default function TournamentDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showGenerateFixtures, setShowGenerateFixtures] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { data: tournament, isLoading: loadingTournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => api.entities.Tournament.filter({ id: tournamentId }).then(r => r[0]),
    enabled: !!tournamentId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['tournamentTeams', tournamentId],
    queryFn: () => api.entities.TournamentTeam.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['tournamentMatches', tournamentId],
    queryFn: () => api.entities.TournamentMatch.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['tournamentPlayers', tournamentId],
    queryFn: () => api.entities.TournamentPlayer.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId,
  });

  const updateTournamentMutation = useMutation({
    mutationFn: (data) => api.entities.Tournament.update(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success('Tournament updated');
    },
  });

  const isAdmin = user && canViewAdmin(user);
  const approvedTeams = teams.filter(t => t.registration_status === 'approved');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const liveMatches = matches.filter(m => m.status === 'live');

  const getStatusColor = (status) => {
    const styles = {
      draft: colors.textMuted,
      registration: colors.primary,
      ongoing: colors.success,
      completed: colors.accent,
      cancelled: colors.danger,
    };
    return styles[status] || colors.textMuted;
  };

  const getFormatLabel = (format) => {
    const labels = {
      knockout: 'Knockout',
      league: 'Round Robin',
      group_knockout: 'Group + Knockout',
      super_league: 'Super League',
    };
    return labels[format] || format;
  };

  if (loading || loadingTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textMuted }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Tournament Not Found</h2>
          <Link to={createPageUrl('Tournaments')}>
            <Button style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>
              Back to Tournaments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div 
        className="relative pt-20 pb-8"
        style={{ 
          backgroundColor: colors.primary,
          backgroundImage: tournament.banner_url ? `url(${tournament.banner_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="relative max-w-6xl mx-auto px-4">
          <Link to={createPageUrl('Tournaments')} className="inline-flex items-center gap-1 text-white/70 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Tournaments
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge style={{ backgroundColor: getStatusColor(tournament.status), color: 'white' }}>
                  {tournament.status?.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white">
                  {getFormatLabel(tournament.format)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                {tournament.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(tournament.start_date), 'dd MMM')} - {tournament.end_date && format(new Date(tournament.end_date), 'dd MMM yyyy')}
                  </span>
                )}
                {tournament.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {tournament.venue}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {approvedTeams.length}/{tournament.max_teams} Teams
                </span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
                {tournament.status === 'registration' && (
                  <Button
                    size="sm"
                    onClick={() => updateTournamentMutation.mutate({ status: 'ongoing' })}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start Tournament
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Teams', value: approvedTeams.length, icon: Users },
            { label: 'Matches', value: matches.length, icon: Target },
            { label: 'Completed', value: completedMatches.length, icon: Trophy },
            { label: 'Live', value: liveMatches.length, icon: Play, highlight: liveMatches.length > 0 },
          ].map((stat, i) => (
            <Card key={i} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: stat.highlight ? colors.danger : colors.primaryLight + '30' }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.highlight ? 'white' : colors.primary }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto" style={{ backgroundColor: colors.surface }}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            {(tournament.format === 'knockout' || tournament.format === 'group_knockout') && (
              <TabsTrigger value="bracket">Bracket</TabsTrigger>
            )}
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <Card style={{ backgroundColor: colors.surface, borderColor: colors.danger }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {liveMatches.map(match => (
                      <div key={match.id} className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{match.team1_name}</span>
                            {match.team1_score && <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>{match.team1_score}</span>}
                          </div>
                          <span className="text-xs px-2" style={{ color: colors.textMuted }}>vs</span>
                          <div className="flex-1 text-right">
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{match.team2_name}</span>
                            {match.team2_score && <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>{match.team2_score}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description & Rules */}
            {(tournament.description || tournament.rules) && (
              <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.textPrimary }}>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tournament.description && (
                    <p style={{ color: colors.textSecondary }}>{tournament.description}</p>
                  )}
                  {tournament.rules && (
                    <div>
                      <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Rules</h4>
                      <pre className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>{tournament.rules}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.textPrimary }}>Upcoming Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingMatches.slice(0, 5).map(match => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                        <div>
                          <span className="font-medium" style={{ color: colors.textPrimary }}>{match.team1_name} vs {match.team2_name}</span>
                          <div className="text-xs" style={{ color: colors.textMuted }}>
                            {match.match_date && format(new Date(match.match_date), 'dd MMM, hh:mm a')}
                            {match.venue && ` • ${match.venue}`}
                          </div>
                        </div>
                        <Badge variant="outline">{match.stage}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.textPrimary }}>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setShowAddTeam(true)} style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Team
                    </Button>
                    <Button onClick={() => setShowGenerateFixtures(true)} variant="outline" style={{ borderColor: colors.border }}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Fixtures
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures" className="mt-6">
            <TournamentFixtures 
              matches={matches} 
              teams={teams}
              tournament={tournament}
              isAdmin={isAdmin}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['tournamentMatches', tournamentId] })}
            />
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="mt-6">
            <PointsTable 
              teams={approvedTeams} 
              tournament={tournament}
            />
          </TabsContent>

          {/* Bracket Tab */}
          <TabsContent value="bracket" className="mt-6">
            <KnockoutBracket 
              matches={matches.filter(m => ['quarterfinal', 'semifinal', 'third_place', 'final'].includes(m.stage))}
              teams={teams}
              tournament={tournament}
            />
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
            <TournamentTeams 
              teams={teams}
              players={players}
              tournament={tournament}
              isAdmin={isAdmin}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ['tournamentTeams', tournamentId] });
                queryClient.invalidateQueries({ queryKey: ['tournamentPlayers', tournamentId] });
              }}
            />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <TournamentStats 
              players={players}
              matches={matches}
              tournament={tournament}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddTeamDialog
        open={showAddTeam}
        onClose={() => setShowAddTeam(false)}
        tournament={tournament}
        onAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['tournamentTeams', tournamentId] });
          setShowAddTeam(false);
        }}
      />

      <GenerateFixturesDialog
        open={showGenerateFixtures}
        onClose={() => setShowGenerateFixtures(false)}
        tournament={tournament}
        teams={approvedTeams}
        onGenerated={() => {
          queryClient.invalidateQueries({ queryKey: ['tournamentMatches', tournamentId] });
          setShowGenerateFixtures(false);
        }}
      />

      <TournamentSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        tournament={tournament}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
          setShowSettings(false);
        }}
      />
    </div>
  );
}