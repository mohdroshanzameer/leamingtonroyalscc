import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Loader2, X, User, UserPlus, Users } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PlayerForm({ open, onOpenChange, player, teamId, teamName, onSave, isLoading }) {
  const isEditing = !!player?.id;
  const [mode, setMode] = useState('existing'); // 'existing' or 'new'
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [leadershipRole, setLeadershipRole] = useState('none'); // 'none', 'captain', 'vice_captain', 'wicket_keeper'

  // Fetch home team to get club players
  const { data: teams = [] } = useQuery({
    queryKey: ['all-teams'],
    queryFn: () => api.entities.Team.list(),
    enabled: open && !isEditing,
  });
  const homeTeam = teams.find(t => t.is_home_team);

  // Fetch existing players from home team's roster
  const { data: existingPlayers = [] } = useQuery({
    queryKey: ['home-team-players', homeTeam?.id],
    queryFn: () => api.entities.TeamPlayer.filter({ team_id: homeTeam.id }, 'player_name'),
    enabled: open && !isEditing && !!homeTeam?.id,
  });

  // Fetch already assigned players to avoid duplicates
  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players-check', teamId],
    queryFn: () => api.entities.TeamPlayer.filter({ team_id: teamId }),
    enabled: open && !isEditing && !!teamId,
  });

  // Filter out already assigned players (for non-home teams, show home team players not yet in this team)
  const availablePlayers = teamId === homeTeam?.id 
    ? [] // If adding to home team, just create new players
    : existingPlayers.filter(p => !teamPlayers.some(tp => tp.player_name === p.player_name));
  const getInitialForm = () => ({
    player_name: player?.player_name || '',
    email: player?.email || '',
    phone: player?.phone || '',
    role: player?.role || 'Batsman',
    jersey_number: player?.jersey_number || '',
    is_captain: player?.is_captain || false,
    is_vice_captain: player?.is_vice_captain || false,
    is_wicket_keeper: player?.is_wicket_keeper || false,
    photo_url: player?.photo_url || '',
    status: player?.status || 'Active',
    batting_style: player?.batting_style || '',
    bowling_style: player?.bowling_style || '',
    date_joined: player?.date_joined || new Date().toISOString().split('T')[0],
  });
  const [form, setForm] = useState(getInitialForm());
  const [uploading, setUploading] = useState(false);

  // Reset form when player changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setForm(getInitialForm());
    }
  }, [open, player?.id]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setForm({ ...form, photo_url: file_url });
      toast.success('Photo uploaded');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectExisting = (playerId) => {
    const selectedPlayer = existingPlayers.find(p => p.id === playerId);
    if (selectedPlayer) {
      setForm({
        player_name: selectedPlayer.player_name,
        email: selectedPlayer.email || '',
        phone: selectedPlayer.phone || '',
        role: selectedPlayer.role || 'Batsman',
        jersey_number: selectedPlayer.jersey_number || '',
        is_captain: selectedPlayer.is_captain || false,
        is_vice_captain: selectedPlayer.is_vice_captain || false,
        photo_url: selectedPlayer.photo_url || '',
        status: 'Active',
        batting_style: selectedPlayer.batting_style || '',
        bowling_style: selectedPlayer.bowling_style || '',
        date_joined: new Date().toISOString().split('T')[0],
      });
      setSelectedPlayerId(playerId);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!form.player_name.trim()) {
      toast.error('Player name is required');
      return;
    }
    onSave({
      ...form,
      team_id: teamId,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      is_captain: leadershipRole === 'captain' || form.is_captain,
      is_vice_captain: leadershipRole === 'vice_captain' || form.is_vice_captain,
      is_wicket_keeper: leadershipRole === 'wicket_keeper' || form.is_wicket_keeper,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Player' : 'Add Player'}
            {teamName && <span className="text-slate-500 font-normal"> to {teamName}</span>}
          </DialogTitle>
        </DialogHeader>
        
        {!isEditing && (
          <Tabs value={mode} onValueChange={(v) => { setMode(v); setSelectedPlayerId(''); setLeadershipRole('none'); setForm(getInitialForm()); }} className="mb-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="existing" className="text-sm">
                <Users className="w-4 h-4 mr-2" /> From Squad
              </TabsTrigger>
              <TabsTrigger value="new" className="text-sm">
                <UserPlus className="w-4 h-4 mr-2" /> New Player
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {!isEditing && mode === 'existing' && (
          <div className="space-y-3 mb-4">
            <Label>Select from existing squad players</Label>
            {availablePlayers.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {availablePlayers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectExisting(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPlayerId === p.id 
                        ? 'bg-teal-100 border-2 border-teal-500' 
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.player_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{p.player_name}</div>
                      <div className="text-xs text-slate-500">{p.role}</div>
                    </div>
                    {p.jersey_number && (
                      <span className="text-xs font-bold text-slate-400">#{p.jersey_number}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 border rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No available players in squad</p>
                <p className="text-xs mt-1">Add players to the Squad page first, or create a new player</p>
              </div>
            )}
            {selectedPlayerId && (
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <Label className="text-sm text-slate-600">Assign as (optional)</Label>
                  <Select value={leadershipRole} onValueChange={setLeadershipRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Regular Player</SelectItem>
                      <SelectItem value="captain">Team Captain</SelectItem>
                      <SelectItem value="vice_captain">Vice Captain</SelectItem>
                      <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  className="w-full bg-teal-600 hover:bg-teal-700" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add to Team
                </Button>
              </div>
            )}
          </div>
        )}

        {(isEditing || mode === 'new') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            {form.photo_url ? (
              <div className="relative">
                <img src={form.photo_url} alt="Player" className="w-16 h-16 rounded-full object-cover border" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, photo_url: '' })}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Photo'}
              </div>
            </label>
          </div>

          {/* Name & Jersey */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Player Name *</Label>
              <Input 
                value={form.player_name} 
                onChange={(e) => setForm({ ...form, player_name: e.target.value })} 
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Jersey #</Label>
              <Input 
                type="number"
                value={form.jersey_number} 
                onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} 
                placeholder="00"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="player@email.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                placeholder="+44 123 456 7890"
              />
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Playing Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                  <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                  <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Injured">Injured</SelectItem>
                  <SelectItem value="Unavailable">Unavailable</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Batting & Bowling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batting Style</Label>
              <Select value={form.batting_style} onValueChange={(v) => setForm({ ...form, batting_style: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right-handed">Right-handed</SelectItem>
                  <SelectItem value="Left-handed">Left-handed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bowling Style</Label>
              <Input 
                value={form.bowling_style} 
                onChange={(e) => setForm({ ...form, bowling_style: e.target.value })} 
                placeholder="e.g., Right-arm medium"
              />
            </div>
          </div>

          {/* Captain/VC & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Leadership Role</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.is_captain} 
                    onChange={(e) => setForm({ ...form, is_captain: e.target.checked, is_vice_captain: e.target.checked ? false : form.is_vice_captain })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Captain</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.is_vice_captain} 
                    onChange={(e) => setForm({ ...form, is_vice_captain: e.target.checked, is_captain: e.target.checked ? false : form.is_captain })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Vice Captain</span>
                </label>
              </div>
            </div>
            <div>
              <Label>Date Joined</Label>
              <Input 
                type="date"
                value={form.date_joined} 
                onChange={(e) => setForm({ ...form, date_joined: e.target.value })} 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? 'Save Changes' : 'Add Player'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}