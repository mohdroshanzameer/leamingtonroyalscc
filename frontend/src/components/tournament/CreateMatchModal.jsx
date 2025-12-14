import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, Users, Loader2, Swords, Trophy, Layers } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

const stageOptions = [
  { value: 'league', label: 'League Match', icon: '🏏' },
  { value: 'group', label: 'Group Stage', icon: '📊' },
  { value: 'quarterfinal', label: 'Quarter Final', icon: '🎯' },
  { value: 'semifinal', label: 'Semi Final', icon: '⚔️' },
  { value: 'third_place', label: 'Third Place', icon: '🥉' },
  { value: 'final', label: 'Final', icon: '🏆' },
];

const groupOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function CreateMatchModal({ isOpen, onClose, tournament, teams = [], onCreateMatch }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    team1_id: '',
    team1_name: '',
    team2_id: '',
    team2_name: '',
    match_date: '',
    match_time: '',
    venue: '',
    stage: 'league',
    group: '',
    round: 1,
    match_number: '',
  });

  const approvedTeams = teams.filter(t => t.registration_status === 'approved');

  const handleTeamSelect = (teamId, field) => {
    const team = approvedTeams.find(t => t.id === teamId);
    if (field === 'team1') {
      setFormData(prev => ({ ...prev, team1_id: teamId, team1_name: team?.team_name || '' }));
    } else {
      setFormData(prev => ({ ...prev, team2_id: teamId, team2_name: team?.team_name || '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.team1_name || !formData.team2_name) return;

    setIsSubmitting(true);

    // Combine date and time
    let matchDateTime = null;
    if (formData.match_date) {
      matchDateTime = formData.match_time 
        ? `${formData.match_date}T${formData.match_time}:00`
        : `${formData.match_date}T12:00:00`;
    }

    const matchData = {
      tournament_id: tournament.id,
      team1_id: formData.team1_id || null,
      team1_name: formData.team1_name,
      team2_id: formData.team2_id || null,
      team2_name: formData.team2_name,
      match_date: matchDateTime,
      venue: formData.venue || null,
      stage: formData.stage,
      group: formData.stage === 'group' ? formData.group : null,
      round: formData.round || 1,
      match_number: formData.match_number ? parseInt(formData.match_number) : null,
      status: 'scheduled',
    };

    await onCreateMatch(matchData);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      team1_id: '',
      team1_name: '',
      team2_id: '',
      team2_name: '',
      match_date: '',
      match_time: '',
      venue: '',
      stage: 'league',
      group: '',
      round: 1,
      match_number: '',
    });
    onClose();
  };

  const showGroupField = formData.stage === 'group';

  const inputStyle = { backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <DialogHeader className="pb-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.accent }}
            >
              <Swords className="w-5 h-5 text-black" />
            </div>
            <div>
              <DialogTitle style={{ color: colors.textPrimary }}>Create New Match</DialogTitle>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {tournament?.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Teams Section */}
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" style={{ color: colors.accent }} />
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Teams</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block" style={{ color: colors.textMuted }}>Home Team *</Label>
                {approvedTeams.length > 0 ? (
                  <Select value={formData.team1_id} onValueChange={(v) => handleTeamSelect(v, 'team1')}>
                    <SelectTrigger style={inputStyle}>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedTeams.map(team => (
                        <SelectItem key={team.id} value={team.id} disabled={team.id === formData.team2_id}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter team name"
                    value={formData.team1_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, team1_name: e.target.value }))}
                    style={inputStyle}
                  />
                )}
              </div>
              <div>
                <Label className="text-xs mb-1.5 block" style={{ color: colors.textMuted }}>Away Team *</Label>
                {approvedTeams.length > 0 ? (
                  <Select value={formData.team2_id} onValueChange={(v) => handleTeamSelect(v, 'team2')}>
                    <SelectTrigger style={inputStyle}>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedTeams.map(team => (
                        <SelectItem key={team.id} value={team.id} disabled={team.id === formData.team1_id}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter team name"
                    value={formData.team2_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, team2_name: e.target.value }))}
                    style={inputStyle}
                  />
                )}
              </div>
            </div>
            {formData.team1_name && formData.team2_name && (
              <div 
                className="mt-3 p-2 rounded-lg text-center text-sm font-medium"
                style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
              >
                {formData.team1_name} vs {formData.team2_name}
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                <Calendar className="w-3 h-3" /> Date
              </Label>
              <Input
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData(prev => ({ ...prev, match_date: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                <Clock className="w-3 h-3" /> Time
              </Label>
              <Input
                type="time"
                value={formData.match_time}
                onChange={(e) => setFormData(prev => ({ ...prev, match_time: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                <MapPin className="w-3 h-3" /> Venue
              </Label>
              <Input
                placeholder="Ground"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Stage Section */}
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4" style={{ color: colors.warning }} />
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Match Stage</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {stageOptions.slice(0, 6).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, stage: opt.value }))}
                  className="p-2 rounded-lg text-xs font-medium transition-all text-center"
                  style={{
                    backgroundColor: formData.stage === opt.value ? `${colors.accent}20` : colors.surface,
                    border: `1px solid ${formData.stage === opt.value ? colors.accent : colors.border}`,
                    color: formData.stage === opt.value ? colors.accent : colors.textSecondary
                  }}
                >
                  <span className="mr-1">{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            {showGroupField && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                <div>
                  <Label className="text-xs mb-1.5 block" style={{ color: colors.textMuted }}>Group</Label>
                  <Select value={formData.group} onValueChange={(v) => setFormData(prev => ({ ...prev, group: v }))}>
                    <SelectTrigger style={inputStyle}>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map(g => (
                        <SelectItem key={g} value={g}>Group {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block" style={{ color: colors.textMuted }}>Match #</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Optional"
                    value={formData.match_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, match_number: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              style={{ borderColor: colors.border, color: colors.textSecondary, backgroundColor: 'transparent' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.team1_name || !formData.team2_name || isSubmitting}
              className="flex-1"
              style={{ backgroundColor: colors.accent, color: '#000' }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Match'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}