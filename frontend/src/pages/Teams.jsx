import React, { useState, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, Plus, Search, Users, Filter } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canViewAdmin } from '../components/RoleAccess';
import { toast } from 'sonner';
import { getFinanceTheme } from '@/components/ClubConfig';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

import TeamCard from '../components/teams/TeamCard';
import TeamForm from '../components/teams/TeamForm';
import TeamDetails from '../components/teams/TeamDetails';
import PlayerForm from '../components/teams/PlayerForm';

const colors = getFinanceTheme();

export default function Teams() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => api.auth.redirectToLogin())
      .finally(() => setLoading(false));
  }, []);

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.entities.Team.list('name', 100),
    staleTime: 0,
  });

  // Fetch all team players
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allTeamPlayers'],
    queryFn: () => api.entities.TeamPlayer.list('player_name', 500),
  });

  // Fetch matches for stats
  const { data: matches = [] } = useQuery({
    queryKey: ['teamMatches'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date', 300),
  });

  // Get players for selected team
  const selectedTeamPlayers = allPlayers.filter(p => p.team_id === selectedTeam?.id);

  // Get player count per team
  const getPlayerCount = (teamId) => allPlayers.filter(p => p.team_id === teamId).length;

  // Filter teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.short_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: (data) => api.entities.Team.create(data),
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowTeamForm(false);
      setSelectedTeam(newTeam);
      toast.success('Team created successfully');
    },
    onError: (error) => toast.error('Failed to create team: ' + error.message),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Team.update(id, data),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowTeamForm(false);
      setEditingTeam(null);
      if (selectedTeam?.id === updatedTeam.id) {
        setSelectedTeam(updatedTeam);
      }
      toast.success('Team updated');
    },
    onError: (error) => toast.error('Failed to update team: ' + error.message),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => api.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setSelectedTeam(null);
      toast.success('Team deleted');
    },
    onError: (error) => toast.error('Failed to delete team: ' + error.message),
  });

  // Player mutations
  const createPlayerMutation = useMutation({
    mutationFn: (data) => api.entities.TeamPlayer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeamPlayers'] });
      setShowPlayerForm(false);
      toast.success('Player added');
    },
    onError: (error) => toast.error('Failed to add player: ' + error.message),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.TeamPlayer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeamPlayers'] });
      setShowPlayerForm(false);
      setEditingPlayer(null);
      toast.success('Player updated');
    },
    onError: (error) => toast.error('Failed to update player: ' + error.message),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => api.entities.TeamPlayer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeamPlayers'] });
      toast.success('Player removed');
    },
    onError: (error) => toast.error('Failed to remove player: ' + error.message),
  });

  // Handlers
  const handleSaveTeam = (data) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data });
    } else {
      createTeamMutation.mutate(data);
    }
  };

  const handleSavePlayer = (data) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const handleDeleteTeam = () => {
    if (!selectedTeam) return;
    const playerCount = selectedTeamPlayers.length;
    setConfirmDialog({
      open: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete "${selectedTeam.name}"?${playerCount > 0 ? ` All ${playerCount} player(s) will also be removed.` : ''} This action cannot be undone.`,
      onConfirm: async () => {
        // Delete players first, then team
        for (const p of selectedTeamPlayers) {
          await api.entities.TeamPlayer.delete(p.id);
        }
        deleteTeamMutation.mutate(selectedTeam.id);
      },
      confirmText: 'Delete Team',
      variant: 'danger'
    });
  };

  const handleDeletePlayer = (player) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Player',
      message: `Are you sure you want to remove ${player.player_name} from ${selectedTeam?.name || 'the team'}? All player stats and records will be removed. This action cannot be undone.`,
      onConfirm: () => deletePlayerMutation.mutate(player.id),
      confirmText: 'Remove Player',
      variant: 'danger'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  // Auth check
  if (!user || !canViewAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <Card className="max-w-md" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Access Denied</h2>
            <p style={{ color: colors.textMuted }}>Only admins can manage teams.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {selectedTeam ? (
          <TeamDetails
            team={selectedTeam}
            players={selectedTeamPlayers}
            matches={matches}
            onBack={() => setSelectedTeam(null)}
            onEditTeam={() => { setEditingTeam(selectedTeam); setShowTeamForm(true); }}
            onDeleteTeam={handleDeleteTeam}
            onAddPlayer={() => { setEditingPlayer(null); setShowPlayerForm(true); }}
            onEditPlayer={(player) => { setEditingPlayer(player); setShowPlayerForm(true); }}
            onDeletePlayer={handleDeletePlayer}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>Team Management</h1>
                <p style={{ color: colors.textSecondary }}>Manage your teams, rosters, and players</p>
              </div>
              <Button 
                onClick={() => { setEditingTeam(null); setShowTeamForm(true); }}
                style={{ background: colors.gradientProfit }}
                className="text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Team
              </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold" style={{ color: colors.info }}>{teams.length}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Total Teams</p>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold" style={{ color: colors.profit }}>{teams.filter(t => t.status === 'Active' || !t.status).length}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Active Teams</p>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold" style={{ color: colors.chart2 }}>{allPlayers.length}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Total Players</p>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold" style={{ color: colors.pending }}>{teams.filter(t => t.is_home_team).length}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Home Teams</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search teams..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Teams Grid */}
            {teamsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.accent }} />
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    playerCount={getPlayerCount(team.id)}
                    onClick={() => setSelectedTeam(team)}
                    onEdit={(t) => { setEditingTeam(t); setShowTeamForm(true); }}
                    onDelete={(t) => { setSelectedTeam(t); handleDeleteTeam(); }}
                    onView={(t) => setSelectedTeam(t)}
                  />
                ))}
              </div>
            ) : (
              <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textMuted }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>No teams found</h3>
                  <p className="mb-4" style={{ color: colors.textMuted }}>
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'Get started by creating your first team'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button onClick={() => setShowTeamForm(true)} style={{ background: colors.gradientProfit }} className="text-white font-semibold">
                      <Plus className="w-4 h-4 mr-2" /> Create Team
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Team Form Dialog */}
        <TeamForm
          open={showTeamForm}
          onOpenChange={(open) => { setShowTeamForm(open); if (!open) setEditingTeam(null); }}
          team={editingTeam}
          onSave={handleSaveTeam}
          isLoading={createTeamMutation.isPending || updateTeamMutation.isPending}
        />

        {/* Player Form Dialog */}
        <PlayerForm
          open={showPlayerForm}
          onOpenChange={(open) => { setShowPlayerForm(open); if (!open) setEditingPlayer(null); }}
          player={editingPlayer}
          teamId={selectedTeam?.id}
          teamName={selectedTeam?.name}
          onSave={handleSavePlayer}
          isLoading={createPlayerMutation.isPending || updatePlayerMutation.isPending}
        />

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText || 'Confirm'}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant || 'danger'}
        />
      </div>
    </div>
  );
}