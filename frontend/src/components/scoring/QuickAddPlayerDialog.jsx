import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { toast } from 'sonner';

export default function QuickAddPlayerDialog({ open, onClose, teamId, teamName, onPlayerAdded, existingPlayers = [] }) {
  const [playerName, setPlayerName] = useState('');
  const [role, setRole] = useState('Batsman');
  const [saving, setSaving] = useState(false);

  const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

  const handleSave = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter player name');
      return;
    }

    // Check for duplicate name in this team
    const normalizedName = playerName.trim().toLowerCase();
    const isDuplicate = existingPlayers.some(p => 
      (p.player_name || p.name || '').toLowerCase() === normalizedName
    );
    
    if (isDuplicate) {
      toast.error(`A player named "${playerName.trim()}" already exists`);
      return;
    }

    setSaving(true);
    try {
      // Generate a unique placeholder email for opponent players
      const placeholderEmail = `opponent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@opponent.local`;
      const player = await api.entities.TeamPlayer.create({
        team_id: teamId,
        team_name: teamName,
        player_name: playerName.trim(),
        email: placeholderEmail,
        role: role,
        status: 'Active',
      });

      toast.success(`${playerName} added to ${teamName}`);
      onPlayerAdded?.(player);
      
      // Reset form
      setPlayerName('');
      setRole('Batsman');
      onClose();
    } catch (error) {
      toast.error('Failed to add player');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-sm [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-500" />
            Add Player to {teamName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-400 text-xs">Player Name *</Label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="bg-slate-800 border-slate-600 text-white"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-slate-400 text-xs">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {roles.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
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
            Add Player
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}