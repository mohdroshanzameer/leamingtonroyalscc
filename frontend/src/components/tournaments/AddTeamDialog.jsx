import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Users, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function AddTeamDialog({ open, onClose, tournament, onAdded }) {
  const [mode, setMode] = useState('existing'); // 'existing' or 'new'
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTeam, setNewTeam] = useState({ name: '', short_name: '' });
  const [players, setPlayers] = useState([{ name: '', role: 'Batsman' }]);
  const [group, setGroup] = useState('A');

  const { data: existingTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => api.entities.Team.filter({ status: 'Active' }),
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      // Create tournament team
      const tournamentTeam = await api.entities.TournamentTeam.create({
        tournament_id: tournament.id,
        team_id: data.teamId || null,
        team_name: data.teamName,
        short_name: data.shortName,
        group: tournament.format === 'group_knockout' ? group : null,
        registration_status: 'approved',
      });

      // Create players if provided
      if (data.players?.length > 0) {
        const validPlayers = data.players.filter(p => p.name.trim());
        for (const player of validPlayers) {
          await api.entities.TournamentPlayer.create({
            tournament_id: tournament.id,
            tournament_team_id: tournamentTeam.id,
            team_name: data.teamName,
            player_name: player.name,
            role: player.role,
          });
        }
      }

      return tournamentTeam;
    },
    onSuccess: () => {
      toast.success('Team added to tournament');
      resetForm();
      onAdded?.();
    },
    onError: () => toast.error('Failed to add team'),
  });

  const resetForm = () => {
    setMode('existing');
    setSelectedTeamId('');
    setNewTeam({ name: '', short_name: '' });
    setPlayers([{ name: '', role: 'Batsman' }]);
    setGroup('A');
  };

  const addPlayer = () => {
    if (players.length < 15) {
      setPlayers([...players, { name: '', role: 'Batsman' }]);
    }
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleSubmit = () => {
    if (mode === 'existing') {
      if (!selectedTeamId) {
        toast.error('Please select a team');
        return;
      }
      const team = existingTeams.find(t => t.id === selectedTeamId);
      createTeamMutation.mutate({
        teamId: team.id,
        teamName: team.name,
        shortName: team.short_name,
        players: [],
      });
    } else {
      if (!newTeam.name.trim()) {
        toast.error('Please enter team name');
        return;
      }
      createTeamMutation.mutate({
        teamId: null,
        teamName: newTeam.name,
        shortName: newTeam.short_name || newTeam.name.substring(0, 4).toUpperCase(),
        players: players,
      });
    }
  };

  const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
  const groups = ['A', 'B', 'C', 'D'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col [&>button]:hover:bg-slate-200"
        style={{ backgroundColor: colors.surface }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Users className="w-5 h-5" style={{ color: colors.primary }} />
            Add Team to Tournament
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'existing' ? 'default' : 'outline'}
              onClick={() => setMode('existing')}
              className="flex-1"
              style={mode === 'existing' ? { backgroundColor: colors.primary, color: colors.textOnPrimary } : { borderColor: colors.border }}
            >
              Existing Team
            </Button>
            <Button
              variant={mode === 'new' ? 'default' : 'outline'}
              onClick={() => setMode('new')}
              className="flex-1"
              style={mode === 'new' ? { backgroundColor: colors.primary, color: colors.textOnPrimary } : { borderColor: colors.border }}
            >
              New Team
            </Button>
          </div>

          {/* Group Selection (for group+knockout format) */}
          {tournament?.format === 'group_knockout' && (
            <div>
              <Label style={{ color: colors.textSecondary }}>Assign to Group</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger style={{ borderColor: colors.border }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.slice(0, tournament.num_groups || 2).map(g => (
                    <SelectItem key={g} value={g}>Group {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'existing' ? (
            <div>
              <Label style={{ color: colors.textSecondary }}>Select Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger style={{ borderColor: colors.border }}>
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent>
                  {existingTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              {/* New Team Form */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label style={{ color: colors.textSecondary }}>Team Name *</Label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Royal Strikers"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Short Name</Label>
                  <Input
                    value={newTeam.short_name}
                    onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value.toUpperCase() })}
                    placeholder="e.g., RST"
                    maxLength={5}
                    style={{ borderColor: colors.border }}
                  />
                </div>
              </div>

              {/* Players */}
              <div>
                <Label style={{ color: colors.textSecondary }}>Players (Optional)</Label>
                <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto">
                  {players.map((player, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                        placeholder="Player name"
                        className="flex-1"
                        style={{ borderColor: colors.border }}
                      />
                      <Select
                        value={player.role}
                        onValueChange={(v) => updatePlayer(index, 'role', v)}
                      >
                        <SelectTrigger className="w-32" style={{ borderColor: colors.border }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlayer(index)}
                        disabled={players.length <= 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPlayer}
                  disabled={players.length >= 15}
                  className="mt-2"
                  style={{ borderColor: colors.border }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Player
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <Button variant="outline" onClick={onClose} className="flex-1" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createTeamMutation.isPending}
            className="flex-1"
            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
          >
            {createTeamMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}