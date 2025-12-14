import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users, Loader2 } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { toast } from 'sonner';

export default function QuickTeamDialog({ open, onClose, onTeamCreated }) {
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [players, setPlayers] = useState([{ name: '', role: 'Batsman' }]);
  const [saving, setSaving] = useState(false);

  const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

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

  const handleSave = async () => {
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 2) {
      toast.error('Please add at least 2 players');
      return;
    }

    setSaving(true);
    try {
      // Create team
      const team = await api.entities.Team.create({
        name: teamName,
        short_name: shortName || teamName.substring(0, 4).toUpperCase(),
        status: 'Active',
      });

      // Create players
      const playerPromises = validPlayers.map(p => 
        api.entities.TeamPlayer.create({
          team_id: team.id,
          player_name: p.name,
          role: p.role,
          status: 'Active',
        })
      );
      await Promise.all(playerPromises);

      toast.success(`Team "${teamName}" created with ${validPlayers.length} players`);
      onTeamCreated?.(team);
      
      // Reset form
      setTeamName('');
      setShortName('');
      setPlayers([{ name: '', role: 'Batsman' }]);
      onClose();
    } catch (error) {
      toast.error('Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] overflow-hidden flex flex-col [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Quick Create Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Team Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">Team Name *</Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Royals CC"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Short Name</Label>
              <Input
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                placeholder="e.g. RCC"
                maxLength={5}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-400 text-xs">Players</Label>
              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                {players.filter(p => p.name.trim()).length}/15
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-5">{index + 1}.</span>
                  <Input
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    placeholder="Player name"
                    className="bg-slate-800 border-slate-600 text-white flex-1 h-9 text-sm"
                  />
                  <Select
                    value={player.role}
                    onValueChange={(value) => updatePlayer(index, 'role', value)}
                  >
                    <SelectTrigger className="w-32 h-9 bg-slate-800 border-slate-600 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(index)}
                    disabled={players.length <= 1}
                    className="h-9 w-9 text-slate-500 hover:text-red-400 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addPlayer}
              disabled={players.length >= 15}
              className="w-full mt-2 border-dashed border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}