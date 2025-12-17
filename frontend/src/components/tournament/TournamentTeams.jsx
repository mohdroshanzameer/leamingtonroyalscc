import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, X, Search, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/confirm-dialog';

export default function TournamentTeams({ tournament, teams }) {
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(null);
  const [search, setSearch] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShortName, setNewTeamShortName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('Batsman');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  
  const queryClient = useQueryClient();

  const { data: players = [], refetch: refetchPlayers } = useQuery({
    queryKey: ['tournamentPlayers', tournament.id],
    queryFn: () => api.entities.TournamentPlayer.filter({ tournament_id: tournament.id }, 'player_name', 500),
    enabled: !!tournament.id,
  });

  // Fetch all TeamPlayers for dropdown
  const { data: allTeamPlayers = [] } = useQuery({
    queryKey: ['allTeamPlayers'],
    queryFn: () => api.entities.TeamPlayer.list('player_name', 500),
  });

  const addTeamMutation = useMutation({
    mutationFn: (data) => api.entities.TournamentTeam.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentTeams'] });
      toast.success('Team added');
      setShowAddTeam(false);
      setNewTeamName('');
      setNewTeamShortName('');
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      // Get team info
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      // Delete all matches involving this team (only if tournament hasn't started)
      if (tournament.status === 'draft' || tournament.status === 'registration') {
        const allMatches = await api.entities.TournamentMatch.filter({ tournament_id: tournament.id });
        const teamMatches = allMatches.filter(m => m.team1_id === teamId || m.team2_id === teamId || m.team1_name === team.team_name || m.team2_name === team.team_name);
        for (const match of teamMatches) {
          await api.entities.TournamentMatch.delete(match.id);
        }
      }

      // Delete all players from this team in the tournament
      const teamPlayers = players.filter(p => p.tournament_team_id === teamId);
      for (const player of teamPlayers) {
        await api.entities.TournamentPlayer.delete(player.id);
      }

      // Finally delete the team
      return api.entities.TournamentTeam.delete(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentTeams'] });
      queryClient.invalidateQueries({ queryKey: ['tournamentMatches'] });
      queryClient.invalidateQueries({ queryKey: ['tournamentPlayers'] });
      refetchPlayers();
      toast.success('Team and related matches removed');
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data) => api.entities.TournamentPlayer.create(data),
    onSuccess: () => {
      refetchPlayers();
      toast.success('Player added');
      setNewPlayerName('');
      setSelectedPlayerId('');
      setShowAddPlayer(null);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => api.entities.TournamentPlayer.delete(id),
    onSuccess: () => {
      refetchPlayers();
      toast.success('Player removed');
    },
  });

  const handleAddTeam = () => {
    const teamName = newTeamName.trim();
    const shortName = newTeamShortName.trim() || teamName.substring(0, 4).toUpperCase();
    
    if (!teamName) {
      toast.error('Please enter team name');
      return;
    }
    
    // Check for duplicate team name
    const existingTeam = teams.find(t => 
      t.team_name.toLowerCase() === teamName.toLowerCase()
    );
    if (existingTeam) {
      toast.error(`Team "${teamName}" already exists in this tournament`);
      return;
    }
    
    // Check for duplicate short name
    const existingShortName = teams.find(t => 
      t.short_name?.toLowerCase() === shortName.toLowerCase()
    );
    if (existingShortName) {
      toast.error(`Short name "${shortName}" is already used by ${existingShortName.team_name}`);
      return;
    }
    
    // Check max teams limit
    if (teams.length >= tournament.max_teams) {
      toast.error(`Tournament is limited to ${tournament.max_teams} teams`);
      return;
    }
    
    addTeamMutation.mutate({
      tournament_id: tournament.id,
      team_name: teamName,
      short_name: shortName,
      group: tournament.format === 'group_knockout' ? selectedGroup : null,
      registration_status: 'approved',
    });
  };

  const handleAddPlayer = () => {
    if (!showAddPlayer) return;
    
    let playerName = newPlayerName.trim();
    let playerRole = newPlayerRole;
    let playerId = selectedPlayerId !== 'new' ? selectedPlayerId : null;
    
    // If a player is selected from dropdown, use their info
    if (selectedPlayerId && selectedPlayerId !== 'new') {
      const selectedPlayer = allTeamPlayers.find(p => p.id === selectedPlayerId);
      if (selectedPlayer) {
        playerName = selectedPlayer.player_name;
        playerRole = selectedPlayer.role || 'Batsman';
      }
    }
    
    if (!playerName) {
      toast.error('Please select or enter a player name');
      return;
    }
    
    // Check if player already exists in ANY team in this tournament
    const existingPlayer = players.find(p => 
      p.player_name.toLowerCase() === playerName.toLowerCase() ||
      (playerId && p.player_id === playerId)
    );
    
    if (existingPlayer) {
      const existingTeam = teams.find(t => t.id === existingPlayer.tournament_team_id);
      toast.error(`${playerName} is already registered with ${existingTeam?.team_name || 'another team'}`);
      return;
    }
    
    addPlayerMutation.mutate({
      tournament_id: tournament.id,
      tournament_team_id: showAddPlayer.id,
      team_name: showAddPlayer.team_name,
      player_name: playerName,
      player_id: playerId,
      role: playerRole,
    });
    setSelectedPlayerId('');
  };

  const filteredTeams = teams.filter(t => 
    t.team_name.toLowerCase().includes(search.toLowerCase())
  );

  const groups = tournament.format === 'group_knockout' 
    ? Array.from({ length: tournament.num_groups || 2 }, (_, i) => String.fromCharCode(65 + i))
    : [];

  const getTeamPlayers = (teamId) => players.filter(p => p.tournament_team_id === teamId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search teams..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {tournament.status !== 'completed' && (
          <Button onClick={() => setShowAddTeam(true)} size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Team
          </Button>
        )}
      </div>

      {tournament.format === 'group_knockout' ? (
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map(group => (
            <Card key={group}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">{group}</span>
                  Group {group}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredTeams.filter(t => t.group === group).length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center">No teams in this group</p>
                ) : (
                  filteredTeams.filter(t => t.group === group).map(team => (
                    <TeamCard key={team.id} team={team} players={getTeamPlayers(team.id)} onAddPlayer={() => setShowAddPlayer(team)} onDelete={() => {
                      const playerCount = getTeamPlayers(team.id).length;
                      setConfirmDialog({
                        open: true,
                        title: 'Delete Team',
                        message: `Are you sure you want to delete "${team.team_name}" from the tournament?${playerCount > 0 ? ` All ${playerCount} player(s) and associated matches will be removed.` : ''} This action cannot be undone.`,
                        onConfirm: () => deleteTeamMutation.mutate(team.id),
                        confirmText: 'Delete Team',
                        variant: 'danger'
                      });
                    }} onDeletePlayer={(id) => {
                      const player = players.find(p => p.id === id);
                      setConfirmDialog({
                        open: true,
                        title: 'Remove Player',
                        message: `Are you sure you want to remove ${player?.player_name || 'this player'} from ${team.team_name}? This action cannot be undone.`,
                        onConfirm: () => deletePlayerMutation.mutate(id),
                        confirmText: 'Remove Player',
                        variant: 'danger'
                      });
                    }} canEdit={tournament.status !== 'completed'} />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.length === 0 ? (
            <Card className="col-span-full text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700">No Teams Yet</h3>
              <p className="text-slate-500 mt-1">Add teams to start the tournament</p>
            </Card>
          ) : (
            filteredTeams.map(team => (
              <TeamCard key={team.id} team={team} players={getTeamPlayers(team.id)} onAddPlayer={() => setShowAddPlayer(team)} onDelete={() => {
                const playerCount = getTeamPlayers(team.id).length;
                setConfirmDialog({
                  open: true,
                  title: 'Delete Team',
                  message: `Are you sure you want to delete "${team.team_name}" from the tournament?${playerCount > 0 ? ` All ${playerCount} player(s) and associated matches will be removed.` : ''} This action cannot be undone.`,
                  onConfirm: () => deleteTeamMutation.mutate(team.id),
                  confirmText: 'Delete Team',
                  variant: 'danger'
                });
              }} onDeletePlayer={(id) => {
                const player = players.find(p => p.id === id);
                setConfirmDialog({
                  open: true,
                  title: 'Remove Player',
                  message: `Are you sure you want to remove ${player?.player_name || 'this player'}? This action cannot be undone.`,
                  onConfirm: () => deletePlayerMutation.mutate(id),
                  confirmText: 'Remove Player',
                  variant: 'danger'
                });
              }} canEdit={tournament.status !== 'completed'} />
            ))
          )}
        </div>
      )}

      <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
        <DialogContent className="max-w-md [&>button]:text-slate-500 [&>button]:hover:text-slate-700">
          <DialogHeader><DialogTitle>Add Team to Tournament</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Team Name *</Label><Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Enter team name" className="mt-1" /></div>
            <div><Label>Short Name</Label><Input value={newTeamShortName} onChange={(e) => setNewTeamShortName(e.target.value.toUpperCase())} placeholder="e.g., RCC" maxLength={5} className="mt-1" /></div>
            {tournament.format === 'group_knockout' && (
              <div><Label>Group</Label><Select value={selectedGroup} onValueChange={setSelectedGroup}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{groups.map(g => (<SelectItem key={g} value={g}>Group {g}</SelectItem>))}</SelectContent></Select></div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddTeam(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddTeam} disabled={addTeamMutation.isPending} className="flex-1">Add Team</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddPlayer} onOpenChange={() => { setShowAddPlayer(null); setSelectedPlayerId(''); setNewPlayerName(''); }}>
        <DialogContent className="max-w-md [&>button]:text-slate-500 [&>button]:hover:text-slate-700">
          <DialogHeader><DialogTitle>Add Player to {showAddPlayer?.team_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Player</Label>
              <Select value={selectedPlayerId} onValueChange={(v) => {
                setSelectedPlayerId(v);
                if (v === 'new') {
                  setNewPlayerName('');
                } else {
                  const player = allTeamPlayers.find(p => p.id === v);
                  if (player) {
                    setNewPlayerRole(player.role || 'Batsman');
                  }
                }
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose from existing players..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Add New Player</SelectItem>
                  {allTeamPlayers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.player_name} ({p.role || 'Unknown'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPlayerId === 'new' && (
              <>
                <div>
                  <Label>Player Name *</Label>
                  <Input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Enter player name" className="mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newPlayerRole} onValueChange={setNewPlayerRole}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                      <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowAddPlayer(null); setSelectedPlayerId(''); setNewPlayerName(''); }} className="flex-1">Cancel</Button>
              <Button 
                onClick={handleAddPlayer} 
                disabled={addPlayerMutation.isPending || (!selectedPlayerId || (selectedPlayerId === 'new' && !newPlayerName.trim()))} 
                className="flex-1"
              >
                Add Player
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
  );
}

function TeamCard({ team, players, onAddPlayer, onDelete, onDeletePlayer, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = { 
    pending: 'bg-amber-50 text-amber-700 border border-amber-200', 
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
    rejected: 'bg-red-50 text-red-700 border border-red-200' 
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border border-stone-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <span className="font-semibold text-white">{team.short_name || team.team_name.substring(0, 2)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">{team.team_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${statusColors[team.registration_status]}`}>{team.registration_status}</Badge>
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {players.length} players
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button variant="ghost" size="icon" onClick={onAddPlayer} className="text-stone-400 hover:text-[#1e3a5f] hover:bg-stone-50" title="Add Player">
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
            {canEdit && (
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-stone-400 hover:text-red-500 hover:bg-red-50" title="Delete Team">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {team.matches_played > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
            <div className="bg-stone-50 rounded p-2"><p className="font-bold text-stone-700">{team.matches_played}</p><p className="text-stone-500">P</p></div>
            <div className="bg-emerald-50 rounded p-2"><p className="font-bold text-emerald-700">{team.matches_won}</p><p className="text-emerald-600">W</p></div>
            <div className="bg-red-50 rounded p-2"><p className="font-bold text-red-700">{team.matches_lost}</p><p className="text-red-600">L</p></div>
            <div className="bg-sky-50 rounded p-2"><p className="font-bold text-sky-700">{team.points}</p><p className="text-sky-600">Pts</p></div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full mt-3 text-stone-600 hover:text-stone-800 hover:bg-stone-50">{expanded ? 'Hide Players' : `Show Players (${players.length})`}</Button>
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {players.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-slate-500 text-sm mb-2">No players added yet</p>
                {canEdit && <Button variant="outline" size="sm" onClick={onAddPlayer}><UserPlus className="w-4 h-4 mr-2" /> Add First Player</Button>}
              </div>
            ) : players.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1 hover:bg-slate-50 rounded px-1 -mx-1">
                <span>{p.player_name}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">{p.role}</Badge>
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50" 
                      onClick={() => onDeletePlayer(p.id)}
                      title="Remove player"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {canEdit && players.length > 0 && (
              <Button variant="outline" size="sm" onClick={onAddPlayer} className="w-full mt-2">
                <UserPlus className="w-4 h-4 mr-2" /> Add Player
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}