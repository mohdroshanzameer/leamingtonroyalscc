import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/components/api/apiClient';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Trophy, Calendar, MapPin, Users, Settings, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

const FORMATS = [
  { value: 'knockout', label: 'Knockout', desc: 'Single elimination bracket' },
  { value: 'league', label: 'Round Robin', desc: 'Every team plays everyone' },
  { value: 'group_knockout', label: 'Group + Knockout', desc: 'Groups then knockouts' },
  { value: 'super_league', label: 'Super League', desc: 'Points-based league' },
];

export default function CreateTournamentDialog({ open, onClose, onCreated }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    format: 'league',
    start_date: '',
    end_date: '',
    venue: '',
    overs_per_match: 20,
    balls_per_over: 6,
    max_teams: 8,
    num_groups: 2,
    teams_qualify_per_group: 2,
    description: '',
    rules: '',
    prize_money: '',
    entry_fee: 0,
    organizer_name: '',
    organizer_contact: '',
    is_public: true,
    status: 'draft',
  });

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Tournament.create(data),
    onSuccess: (tournament) => {
      toast.success('Tournament created successfully!');
      onCreated?.(tournament);
      resetForm();
    },
    onError: () => toast.error('Failed to create tournament'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      format: 'league',
      start_date: '',
      end_date: '',
      venue: '',
      overs_per_match: 20,
      balls_per_over: 6,
      max_teams: 8,
      num_groups: 2,
      teams_qualify_per_group: 2,
      description: '',
      rules: '',
      prize_money: '',
      entry_fee: 0,
      organizer_name: '',
      organizer_contact: '',
      is_public: true,
      status: 'draft',
    });
    setActiveTab('basic');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter tournament name');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col [&>button]:text-slate-500 [&>button]:hover:text-slate-700" style={{ backgroundColor: colors.surface }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Trophy className="w-5 h-5" style={{ color: colors.primary }} />
            Create Tournament
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label style={{ color: colors.textSecondary }}>Tournament Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Summer Cricket League 2024"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Short Name</Label>
                  <Input
                    value={formData.short_name}
                    onChange={(e) => updateField('short_name', e.target.value.toUpperCase())}
                    placeholder="e.g., SCL24"
                    maxLength={10}
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Venue</Label>
                  <Input
                    value={formData.venue}
                    onChange={(e) => updateField('venue', e.target.value)}
                    placeholder="e.g., Central Cricket Ground"
                    style={{ borderColor: colors.border }}
                  />
                </div>
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
                <Label style={{ color: colors.textSecondary }}>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief description of the tournament..."
                  rows={3}
                  style={{ borderColor: colors.border }}
                />
              </div>
            </TabsContent>

            {/* Format Tab */}
            <TabsContent value="format" className="space-y-4 m-0">
              <div>
                <Label style={{ color: colors.textSecondary }}>Tournament Format *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {FORMATS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => updateField('format', f.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.format === f.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold" style={{ color: colors.textPrimary }}>{f.label}</div>
                      <div className="text-xs" style={{ color: colors.textMuted }}>{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: colors.textSecondary }}>Max Teams</Label>
                  <Select value={String(formData.max_teams)} onValueChange={(v) => updateField('max_teams', parseInt(v))}>
                    <SelectTrigger style={{ borderColor: colors.border }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 6, 8, 10, 12, 16, 20, 24, 32].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} Teams</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Overs per Match</Label>
                  <Select value={String(formData.overs_per_match)} onValueChange={(v) => updateField('overs_per_match', parseInt(v))}>
                    <SelectTrigger style={{ borderColor: colors.border }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} Overs</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.format === 'group_knockout' && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <div>
                    <Label style={{ color: colors.textSecondary }}>Number of Groups</Label>
                    <Select value={String(formData.num_groups)} onValueChange={(v) => updateField('num_groups', parseInt(v))}>
                      <SelectTrigger style={{ borderColor: colors.border }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} Groups</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label style={{ color: colors.textSecondary }}>Teams Qualify per Group</Label>
                    <Select value={String(formData.teams_qualify_per_group)} onValueChange={(v) => updateField('teams_qualify_per_group', parseInt(v))}>
                      <SelectTrigger style={{ borderColor: colors.border }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} Teams</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label style={{ color: colors.textSecondary }}>Balls per Over</Label>
                <Select value={String(formData.balls_per_over)} onValueChange={(v) => updateField('balls_per_over', parseInt(v))}>
                  <SelectTrigger style={{ borderColor: colors.border }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} Balls</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-4 m-0">
              <div>
                <Label style={{ color: colors.textSecondary }}>Tournament Rules</Label>
                <Textarea
                  value={formData.rules}
                  onChange={(e) => updateField('rules', e.target.value)}
                  placeholder="Enter tournament rules, regulations, and playing conditions..."
                  rows={10}
                  style={{ borderColor: colors.border }}
                />
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  You can use markdown formatting for better readability
                </p>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: colors.textSecondary }}>Prize Money</Label>
                  <Input
                    value={formData.prize_money}
                    onChange={(e) => updateField('prize_money', e.target.value)}
                    placeholder="e.g., £500 + Trophy"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Entry Fee per Team</Label>
                  <Input
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => updateField('entry_fee', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Organizer Name</Label>
                  <Input
                    value={formData.organizer_name}
                    onChange={(e) => updateField('organizer_name', e.target.value)}
                    placeholder="Name"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textSecondary }}>Organizer Contact</Label>
                  <Input
                    value={formData.organizer_contact}
                    onChange={(e) => updateField('organizer_contact', e.target.value)}
                    placeholder="Phone or email"
                    style={{ borderColor: colors.border }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                <div>
                  <Label style={{ color: colors.textPrimary }}>Public Tournament</Label>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Allow anyone to view tournament</p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(v) => updateField('is_public', v)}
                />
              </div>

              <div>
                <Label style={{ color: colors.textSecondary }}>Initial Status</Label>
                <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger style={{ borderColor: colors.border }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="registration">Open for Registration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <Button variant="outline" onClick={onClose} className="flex-1" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending}
            className="flex-1"
            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Tournament
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}