import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/components/api/apiClient';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function EditMatchDialog({ open, onClose, match, teams, onSaved }) {
  const [formData, setFormData] = useState({
    match_date: '',
    venue: '',
    status: 'scheduled',
    team1_score: '',
    team1_overs: '',
    team2_score: '',
    team2_overs: '',
    winner_id: '',
    winner_name: '',
    result_summary: '',
    man_of_match: '',
    mom_performance: '',
    toss_winner: '',
    toss_decision: '',
  });

  useEffect(() => {
    if (match) {
      setFormData({
        match_date: match.match_date?.split('T')[0] || '',
        venue: match.venue || '',
        status: match.status || 'scheduled',
        team1_score: match.team1_score || '',
        team1_overs: match.team1_overs || '',
        team2_score: match.team2_score || '',
        team2_overs: match.team2_overs || '',
        winner_id: match.winner_id || '',
        winner_name: match.winner_name || '',
        result_summary: match.result_summary || '',
        man_of_match: match.man_of_match || '',
        mom_performance: match.mom_performance || '',
        toss_winner: match.toss_winner || '',
        toss_decision: match.toss_decision || '',
      });
    }
  }, [match]);

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.TournamentMatch.update(match.id, data),
    onSuccess: () => {
      toast.success('Match updated');
      onSaved?.();
    },
    onError: () => toast.error('Failed to update match'),
  });

  const handleSubmit = () => {
    const data = { ...formData };
    if (data.match_date) {
      data.match_date = new Date(data.match_date).toISOString();
    }
    
    // Auto-set winner name if winner_id is selected
    if (data.winner_id) {
      if (data.winner_id === match.team1_id) {
        data.winner_name = match.team1_name;
      } else if (data.winner_id === match.team2_id) {
        data.winner_name = match.team2_name;
      }
    }
    
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col [&>button]:hover:bg-slate-200" style={{ backgroundColor: colors.surface }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Edit2 className="w-5 h-5" style={{ color: colors.primary }} />
            Edit Match
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Match Info */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="font-medium" style={{ color: colors.textPrimary }}>
              {match?.team1_name} vs {match?.team2_name}
            </p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {match?.stage?.replace('_', ' ').toUpperCase()} {match?.group && `• Group ${match.group}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: colors.textSecondary }}>Date</Label>
              <Input
                type="date"
                value={formData.match_date}
                onChange={(e) => updateField('match_date', e.target.value)}
                style={{ borderColor: colors.border }}
              />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>Venue</Label>
              <Input
                value={formData.venue}
                onChange={(e) => updateField('venue', e.target.value)}
                style={{ borderColor: colors.border }}
              />
            </div>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Status</Label>
            <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
              <SelectTrigger style={{ borderColor: colors.border }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toss */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: colors.textSecondary }}>Toss Winner</Label>
              <Select value={formData.toss_winner} onValueChange={(v) => updateField('toss_winner', v)}>
                <SelectTrigger style={{ borderColor: colors.border }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match?.team1_name}>{match?.team1_name}</SelectItem>
                  <SelectItem value={match?.team2_name}>{match?.team2_name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>Elected To</Label>
              <Select value={formData.toss_decision} onValueChange={(v) => updateField('toss_decision', v)}>
                <SelectTrigger style={{ borderColor: colors.border }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bat">Bat</SelectItem>
                  <SelectItem value="bowl">Bowl</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scores */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Scores</h4>
            <div className="space-y-3">
              <div>
                <Label style={{ color: colors.textSecondary }}>{match?.team1_name}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={formData.team1_score}
                    onChange={(e) => updateField('team1_score', e.target.value)}
                    placeholder="e.g., 165/7"
                    style={{ borderColor: colors.border }}
                  />
                  <Input
                    value={formData.team1_overs}
                    onChange={(e) => updateField('team1_overs', e.target.value)}
                    placeholder="Overs (e.g., 20.0)"
                    style={{ borderColor: colors.border }}
                  />
                </div>
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>{match?.team2_name}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={formData.team2_score}
                    onChange={(e) => updateField('team2_score', e.target.value)}
                    placeholder="e.g., 140/10"
                    style={{ borderColor: colors.border }}
                  />
                  <Input
                    value={formData.team2_overs}
                    onChange={(e) => updateField('team2_overs', e.target.value)}
                    placeholder="Overs (e.g., 18.4)"
                    style={{ borderColor: colors.border }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div>
            <Label style={{ color: colors.textSecondary }}>Winner</Label>
            <Select value={formData.winner_id} onValueChange={(v) => updateField('winner_id', v)}>
              <SelectTrigger style={{ borderColor: colors.border }}>
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={match?.team1_id}>{match?.team1_name}</SelectItem>
                <SelectItem value={match?.team2_id}>{match?.team2_name}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Result Summary</Label>
            <Input
              value={formData.result_summary}
              onChange={(e) => updateField('result_summary', e.target.value)}
              placeholder="e.g., Team A won by 25 runs"
              style={{ borderColor: colors.border }}
            />
          </div>

          {/* Man of the Match */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: colors.textSecondary }}>Man of the Match</Label>
              <Input
                value={formData.man_of_match}
                onChange={(e) => updateField('man_of_match', e.target.value)}
                placeholder="Player name"
                style={{ borderColor: colors.border }}
              />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>Performance</Label>
              <Input
                value={formData.mom_performance}
                onChange={(e) => updateField('mom_performance', e.target.value)}
                placeholder="e.g., 65(40)"
                style={{ borderColor: colors.border }}
              />
            </div>
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