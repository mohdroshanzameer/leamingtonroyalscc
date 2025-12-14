import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Save, Trash2, AlertTriangle, Image, Trophy, Users, Calendar, DollarSign, Globe, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../../utils';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function TournamentSettings({ tournament }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ ...tournament });
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); setHasChanges(true); };

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.Tournament.update(tournament.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] }); toast.success('Settings saved'); setHasChanges(false); },
    onError: () => { toast.error('Failed to save settings'); }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const matches = await api.entities.TournamentMatch.filter({ tournament_id: tournament.id });
      const teams = await api.entities.TournamentTeam.filter({ tournament_id: tournament.id });
      const players = await api.entities.TournamentPlayer.filter({ tournament_id: tournament.id });
      for (const match of matches) await api.entities.TournamentMatch.delete(match.id);
      for (const team of teams) await api.entities.TournamentTeam.delete(team.id);
      for (const player of players) await api.entities.TournamentPlayer.delete(player.id);
      return api.entities.Tournament.delete(tournament.id);
    },
    onSuccess: () => { toast.success('Tournament deleted'); window.location.href = createPageUrl('Tournaments'); },
    onError: () => { toast.error('Failed to delete tournament'); }
  });

  const handleSave = () => { const { id, created_date, updated_date, created_by, ...data } = formData; updateMutation.mutate(data); };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const { file_url } = await api.integrations.Core.UploadFile({ file }); updateField('logo_url', file_url); toast.success('Logo uploaded'); } catch (err) { toast.error('Failed to upload logo'); }
  };

  const handleUploadBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const { file_url } = await api.integrations.Core.UploadFile({ file }); updateField('banner_url', file_url); toast.success('Banner uploaded'); } catch (err) { toast.error('Failed to upload banner'); }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: colors.warning },
    { value: 'registration', label: 'Registration Open', color: colors.accent },
    { value: 'ongoing', label: 'Ongoing', color: colors.success },
    { value: 'completed', label: 'Completed', color: colors.textMuted },
    { value: 'cancelled', label: 'Cancelled', color: colors.danger }
  ];

  const SectionCard = ({ icon: Icon, title, children }) => (
    <div 
      className="rounded-xl p-5"
      style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: colors.border }}>
        <Icon className="w-5 h-5" style={{ color: colors.accent }} />
        <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  const inputStyle = { backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Tournament Details */}
      <SectionCard icon={Trophy} title="Tournament Details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Name *</Label>
              <Input value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Short Name</Label>
              <Input value={formData.short_name || ''} onChange={(e) => updateField('short_name', e.target.value.toUpperCase())} maxLength={10} className="mt-1.5" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                <SelectTrigger className="mt-1.5" style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Venue</Label>
              <Input value={formData.venue || ''} onChange={(e) => updateField('venue', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Start Date</Label>
              <Input type="date" value={formData.start_date || ''} onChange={(e) => updateField('start_date', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">End Date</Label>
              <Input type="date" value={formData.end_date || ''} onChange={(e) => updateField('end_date', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm">Description</Label>
            <Textarea value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} className="mt-1.5" rows={3} style={inputStyle} />
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm">Rules</Label>
            <Textarea value={formData.rules || ''} onChange={(e) => updateField('rules', e.target.value)} className="mt-1.5" rows={4} style={inputStyle} />
          </div>
        </div>
      </SectionCard>

      {/* Match Settings */}
      <SectionCard icon={Users} title="Match Settings">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm">Max Teams</Label>
            <Input type="number" value={formData.max_teams || 8} onChange={(e) => updateField('max_teams', parseInt(e.target.value))} className="mt-1.5" min={2} max={64} style={inputStyle} />
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm">Overs/Match</Label>
            <Input type="number" value={formData.overs_per_match || 20} onChange={(e) => updateField('overs_per_match', parseInt(e.target.value))} className="mt-1.5" min={1} max={50} style={inputStyle} />
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm">Balls/Over</Label>
            <Input type="number" value={formData.balls_per_over || 6} onChange={(e) => updateField('balls_per_over', parseInt(e.target.value))} className="mt-1.5" min={4} max={8} style={inputStyle} />
          </div>
        </div>
      </SectionCard>

      {/* Branding */}
      <SectionCard icon={Image} title="Branding">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm mb-2 block">Tournament Logo</Label>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: colors.surfaceHover, border: `1px dashed ${colors.border}` }}
              >
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8" style={{ color: colors.textMuted }} />
                )}
              </div>
              <div>
                <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload">
                  <Button variant="outline" size="sm" asChild style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }} className="text-sm mb-2 block">Banner Image</Label>
            <div 
              className="h-20 rounded-xl flex items-center justify-center overflow-hidden mb-2"
              style={{ backgroundColor: colors.surfaceHover, border: `1px dashed ${colors.border}` }}
            >
              {formData.banner_url ? (
                <img src={formData.banner_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm" style={{ color: colors.textMuted }}>No banner</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleUploadBanner} className="hidden" id="banner-upload" />
            <label htmlFor="banner-upload">
              <Button variant="outline" size="sm" asChild style={{ borderColor: colors.border, color: colors.textSecondary }}>
                <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload Banner</span>
              </Button>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* Prize & Organizer */}
      <SectionCard icon={DollarSign} title="Prize & Organizer">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Prize Money</Label>
              <Input value={formData.prize_money || ''} onChange={(e) => updateField('prize_money', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Entry Fee</Label>
              <Input type="number" value={formData.entry_fee || 0} onChange={(e) => updateField('entry_fee', parseFloat(e.target.value))} className="mt-1.5" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Organizer Name</Label>
              <Input value={formData.organizer_name || ''} onChange={(e) => updateField('organizer_name', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }} className="text-sm">Contact</Label>
              <Input value={formData.organizer_contact || ''} onChange={(e) => updateField('organizer_contact', e.target.value)} className="mt-1.5" style={inputStyle} />
            </div>
          </div>
          <div 
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ backgroundColor: colors.surfaceHover }}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" style={{ color: colors.accent }} />
              <div>
                <p className="font-medium" style={{ color: colors.textPrimary }}>Public Tournament</p>
                <p className="text-xs" style={{ color: colors.textMuted }}>Anyone can view details</p>
              </div>
            </div>
            <Switch checked={formData.is_public !== false} onCheckedChange={(v) => updateField('is_public', v)} />
          </div>
        </div>
      </SectionCard>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending} 
            className="shadow-lg"
            style={{ backgroundColor: colors.accent, color: '#000' }}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Danger Zone */}
      <div 
        className="rounded-xl p-5"
        style={{ backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30` }}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: `${colors.danger}30` }}>
          <AlertTriangle className="w-5 h-5" style={{ color: colors.danger }} />
          <h3 className="font-semibold" style={{ color: colors.danger }}>Danger Zone</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: colors.textPrimary }}>Delete Tournament</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>This action cannot be undone</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" style={{ backgroundColor: colors.danger }}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <AlertDialogHeader>
                <AlertDialogTitle style={{ color: colors.textPrimary }}>Delete Tournament?</AlertDialogTitle>
                <AlertDialogDescription style={{ color: colors.textSecondary }}>
                  This will permanently delete "{tournament.name}" and all associated matches, teams, and statistics.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel style={{ borderColor: colors.border, color: colors.textSecondary }}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate()} 
                  style={{ backgroundColor: colors.danger }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Tournament'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}