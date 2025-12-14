import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from '@/components/api/apiClient';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function TournamentSettingsDialog({ open, onClose, tournament, onSaved }) {
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name || '',
        short_name: tournament.short_name || '',
        start_date: tournament.start_date || '',
        end_date: tournament.end_date || '',
        venue: tournament.venue || '',
        description: tournament.description || '',
        rules: tournament.rules || '',
        prize_money: tournament.prize_money || '',
        organizer_name: tournament.organizer_name || '',
        organizer_contact: tournament.organizer_contact || '',
        is_public: tournament.is_public ?? true,
        status: tournament.status || 'draft',
        current_stage: tournament.current_stage || 'group',
      });
    }
  }, [tournament]);

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.Tournament.update(tournament.id, data),
    onSuccess: () => {
      toast.success('Tournament updated');
      onSaved?.();
    },
    onError: () => toast.error('Failed to update tournament'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all related data first
      const teams = await api.entities.TournamentTeam.filter({ tournament_id: tournament.id });
      const matches = await api.entities.TournamentMatch.filter({ tournament_id: tournament.id });
      const players = await api.entities.TournamentPlayer.filter({ tournament_id: tournament.id });

      for (const p of players) await api.entities.TournamentPlayer.delete(p.id);
      for (const m of matches) await api.entities.TournamentMatch.delete(m.id);
      for (const t of teams) await api.entities.TournamentTeam.delete(t.id);
      
      // Delete tournament
      await api.entities.Tournament.delete(tournament.id);
    },
    onSuccess: () => {
      toast.success('Tournament deleted');
      window.location.href = '/Tournaments';
    },
    onError: () => toast.error('Failed to delete tournament'),
  });

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      toast.error('Tournament name is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col [&>button]:hover:bg-slate-200" style={{ backgroundColor: colors.surface }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Settings className="w-5 h-5" style={{ color: colors.primary }} />
            Tournament Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <Label style={{ color: colors.textSecondary }}>Tournament Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              style={{ borderColor: colors.border }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: colors.textSecondary }}>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                style={{ borderColor: colors.border }}
              />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                style={{ borderColor: colors.border }}
              />
            </div>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Venue</Label>
            <Input
              value={formData.venue}
              onChange={(e) => updateField('venue', e.target.value)}
              style={{ borderColor: colors.border }}
            />
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Status</Label>
            <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
              <SelectTrigger style={{ borderColor: colors.border }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="registration">Open for Registration</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Current Stage</Label>
            <Select value={formData.current_stage} onValueChange={(v) => updateField('current_stage', v)}>
              <SelectTrigger style={{ borderColor: colors.border }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Group Stage</SelectItem>
                <SelectItem value="knockout">Knockout</SelectItem>
                <SelectItem value="quarterfinal">Quarter Finals</SelectItem>
                <SelectItem value="semifinal">Semi Finals</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              style={{ borderColor: colors.border }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: colors.textSecondary }}>Prize Money</Label>
              <Input
                value={formData.prize_money}
                onChange={(e) => updateField('prize_money', e.target.value)}
                style={{ borderColor: colors.border }}
              />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>Organizer</Label>
              <Input
                value={formData.organizer_name}
                onChange={(e) => updateField('organizer_name', e.target.value)}
                style={{ borderColor: colors.border }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <Label style={{ color: colors.textPrimary }}>Public Tournament</Label>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(v) => updateField('is_public', v)}
            />
          </div>

          {/* Danger Zone */}
          <div className="p-4 rounded-lg border-2 border-red-200" style={{ backgroundColor: '#fef2f2' }}>
            <h4 className="text-red-700 font-medium mb-2">Danger Zone</h4>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tournament
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600">Are you sure? This will delete all teams, matches, and stats!</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <Button variant="outline" onClick={onClose} className="flex-1" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateMutation.isPending}
            className="flex-1"
            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}