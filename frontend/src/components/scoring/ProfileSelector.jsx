import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// ICC System Profiles
const ICC_PROFILES = {
  't20': {
    id: 't20',
    name: 'ICC T20',
    total_overs: 20,
    balls_per_over: 6,
    wide_1st_runs: 1, wide_2nd_runs: 1, wide_3rd_runs: 1, wide_4th_runs: 1, wide_5th_runs: 1, wide_6th_plus_runs: 1,
    wide_1st_legal: false, wide_2nd_legal: false, wide_3rd_legal: false, wide_4th_legal: false, wide_5th_legal: false, wide_6th_plus_legal: false,
    noball_1st_runs: 1, noball_2nd_runs: 1, noball_3rd_runs: 1, noball_4th_runs: 1, noball_5th_runs: 1, noball_6th_plus_runs: 1,
    noball_1st_legal: false, noball_2nd_legal: false, noball_3rd_legal: false, noball_4th_legal: false, noball_5th_legal: false, noball_6th_plus_legal: false,
    free_hit_on_noball: true, free_hit_on_wide: false,
    retire_at_score: 0, retired_can_return: true, last_man_can_play: false,
    powerplay_overs: 6, max_overs_per_bowler: 4,
    isSystem: true,
  },
  'odi': {
    id: 'odi',
    name: 'ICC ODI (50 Overs)',
    total_overs: 50,
    balls_per_over: 6,
    wide_1st_runs: 1, wide_2nd_runs: 1, wide_3rd_runs: 1, wide_4th_runs: 1, wide_5th_runs: 1, wide_6th_plus_runs: 1,
    wide_1st_legal: false, wide_2nd_legal: false, wide_3rd_legal: false, wide_4th_legal: false, wide_5th_legal: false, wide_6th_plus_legal: false,
    noball_1st_runs: 1, noball_2nd_runs: 1, noball_3rd_runs: 1, noball_4th_runs: 1, noball_5th_runs: 1, noball_6th_plus_runs: 1,
    noball_1st_legal: false, noball_2nd_legal: false, noball_3rd_legal: false, noball_4th_legal: false, noball_5th_legal: false, noball_6th_plus_legal: false,
    free_hit_on_noball: true, free_hit_on_wide: false,
    retire_at_score: 0, retired_can_return: true, last_man_can_play: false,
    powerplay_overs: 10, max_overs_per_bowler: 10,
    isSystem: true,
  },
  'test': {
    id: 'test',
    name: 'ICC Test',
    total_overs: 0,
    balls_per_over: 6,
    wide_1st_runs: 1, wide_2nd_runs: 1, wide_3rd_runs: 1, wide_4th_runs: 1, wide_5th_runs: 1, wide_6th_plus_runs: 1,
    wide_1st_legal: false, wide_2nd_legal: false, wide_3rd_legal: false, wide_4th_legal: false, wide_5th_legal: false, wide_6th_plus_legal: false,
    noball_1st_runs: 1, noball_2nd_runs: 1, noball_3rd_runs: 1, noball_4th_runs: 1, noball_5th_runs: 1, noball_6th_plus_runs: 1,
    noball_1st_legal: false, noball_2nd_legal: false, noball_3rd_legal: false, noball_4th_legal: false, noball_5th_legal: false, noball_6th_plus_legal: false,
    free_hit_on_noball: false, free_hit_on_wide: false,
    retire_at_score: 0, retired_can_return: true, last_man_can_play: false,
    powerplay_overs: 0, max_overs_per_bowler: 0,
    isSystem: true,
  },
};

const DEFAULT_PROFILE = {
  name: '',
  total_overs: 20,
  balls_per_over: 6,
  wide_1st_runs: 1, wide_2nd_runs: 1, wide_3rd_runs: 1, wide_4th_runs: 1, wide_5th_runs: 1, wide_6th_plus_runs: 1,
  wide_1st_legal: false, wide_2nd_legal: false, wide_3rd_legal: false, wide_4th_legal: false, wide_5th_legal: false, wide_6th_plus_legal: false,
  noball_1st_runs: 1, noball_2nd_runs: 1, noball_3rd_runs: 1, noball_4th_runs: 1, noball_5th_runs: 1, noball_6th_plus_runs: 1,
  noball_1st_legal: false, noball_2nd_legal: false, noball_3rd_legal: false, noball_4th_legal: false, noball_5th_legal: false, noball_6th_plus_legal: false,
  free_hit_on_noball: true, free_hit_on_wide: false,
  retire_at_score: 0, retired_can_return: true, last_man_can_play: false,
  powerplay_overs: 6, max_overs_per_bowler: 4,
};

export default function ProfileSelector({ onSelect, onBack }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: customProfiles = [], isLoading } = useQuery({
    queryKey: ['matchProfiles'],
    queryFn: () => api.entities.MatchProfile.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.MatchProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchProfiles'] });
      toast.success('Profile created!');
      setShowEditor(false);
      setEditingProfile(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.MatchProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchProfiles'] });
      toast.success('Profile updated!');
      setShowEditor(false);
      setEditingProfile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.MatchProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchProfiles'] });
      toast.success('Profile deleted');
      if (selectedProfile?.id === editingProfile?.id) {
        setSelectedProfile(null);
      }
    },
  });

  const handleCreateNew = () => {
    setEditingProfile({ ...DEFAULT_PROFILE, isNew: true });
    setShowEditor(true);
  };

  const handleEdit = (profile) => {
    setEditingProfile({ ...profile });
    setShowEditor(true);
  };

  const handleView = (profile) => {
    setViewingProfile(profile);
    setShowViewer(true);
  };

  const handleSave = () => {
    if (!editingProfile.name?.trim()) {
      toast.error('Please enter a profile name');
      return;
    }
    
    const { isNew, id, isSystem, ...data } = editingProfile;
    
    // If editing an ICC profile, create a new custom profile based on it
    if (isSystem) {
      createMutation.mutate(data);
    } else if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id, data });
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedProfile) {
      toast.error('Please select a profile');
      return;
    }
    onSelect(selectedProfile);
  };

  const allProfiles = [
    ...Object.values(ICC_PROFILES),
    ...customProfiles.map(p => ({ ...p, isSystem: false })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-slate-800/80 border-slate-700 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="text-4xl mb-3">📋</div>
          <CardTitle className="text-white text-xl">Select Game Profile</CardTitle>
          <p className="text-slate-400 text-sm mt-1">Choose scoring rules for this match</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Profile List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {/* ICC Profiles */}
            <div className="text-xs text-slate-500 font-medium px-1">ICC Official Rules</div>
            {Object.values(ICC_PROFILES).map(profile => (
              <div
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedProfile?.id === profile.id
                    ? 'bg-emerald-600/30 border border-emerald-500'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏏</span>
                  <div>
                    <div className="text-white font-medium">{profile.name}</div>
                    <div className="text-slate-400 text-xs">{profile.total_overs} overs • {profile.balls_per_over} balls/over</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleView(profile); }} className="h-8 w-8 text-slate-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit({ ...profile, isSystem: true }); }} className="h-8 w-8 text-slate-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {selectedProfile?.id === profile.id && <Check className="w-5 h-5 text-emerald-400" />}
                </div>
              </div>
            ))}

            {/* Custom Profiles */}
            {customProfiles.length > 0 && (
              <>
                <div className="text-xs text-slate-500 font-medium px-1 mt-4">Custom Profiles</div>
                {customProfiles.map(profile => (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile({ ...profile, isSystem: false })}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      selectedProfile?.id === profile.id
                        ? 'bg-emerald-600/30 border border-emerald-500'
                        : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📋</span>
                      <div>
                        <div className="text-white font-medium">{profile.name}</div>
                        <div className="text-slate-400 text-xs">{profile.total_overs || 20} overs • {profile.balls_per_over || 6} balls/over</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleView(profile); }} className="h-8 w-8 text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(profile); }} className="h-8 w-8 text-slate-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(profile.id); }} className="h-8 w-8 text-slate-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {selectedProfile?.id === profile.id && <Check className="w-5 h-5 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Create New Button */}
          <Button onClick={handleCreateNew} variant="outline" className="w-full border-dashed border-slate-600 text-white bg-slate-700/50 hover:bg-slate-600 hover:text-white">
            <Plus className="w-4 h-4 mr-2" /> Create New Profile
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onBack} className="flex-1 text-white bg-slate-700/50 hover:text-white hover:bg-slate-600/50">
              ← Back
            </Button>
            <Button 
              onClick={handleConfirmSelection} 
              disabled={!selectedProfile}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Editor Dialog */}
      <ProfileEditorDialog
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditingProfile(null); }}
        profile={editingProfile}
        onChange={setEditingProfile}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Profile Viewer Dialog */}
      <ProfileViewerDialog
        open={showViewer}
        onClose={() => { setShowViewer(false); setViewingProfile(null); }}
        profile={viewingProfile}
      />
    </div>
  );
}

// Get ball ordinals based on balls per over
function getBallOrdinals(ballsPerOver) {
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const count = Math.min(ballsPerOver || 6, 8);
  const result = ordinals.slice(0, count - 1);
  result.push(`${count}th_plus`);
  return result;
}

// Profile Editor Dialog Component
function ProfileEditorDialog({ open, onClose, profile, onChange, onSave, isSaving }) {
  const [errors, setErrors] = React.useState({});
  
  if (!profile) return null;

  const updateField = (key, value) => {
    onChange({ ...profile, [key]: value });
    // Clear error when field is updated
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validateAndSave = () => {
    const newErrors = {};
    if (!profile.name?.trim()) {
      newErrors.name = 'Profile name is required';
    }
    if (!profile.total_overs || profile.total_overs < 1) {
      newErrors.total_overs = 'Total overs must be at least 1';
    }
    if (!profile.balls_per_over || profile.balls_per_over < 4 || profile.balls_per_over > 8) {
      newErrors.balls_per_over = 'Balls per over must be 4-8';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setErrors({});
    onSave();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const ballsPerOver = profile.balls_per_over || 6;
  const ballOrdinals = getBallOrdinals(ballsPerOver);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[85vh] flex flex-col p-0 [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-white">
            {profile.isSystem ? 'Create Profile from ICC Template' : profile.isNew ? 'Create Profile' : 'Edit Profile'}
          </DialogTitle>
          {profile.isSystem && (
            <p className="text-slate-400 text-sm">Editing ICC profile will create a new custom profile</p>
          )}
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-6">
          {/* Basic Info */}
          <div>
            <Label className="text-slate-300">Profile Name *</Label>
            <Input
              value={profile.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., 3 Over Blast"
              className={`bg-slate-800 border-slate-600 text-white ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Total Overs *</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={profile.total_overs ?? ''}
                onChange={(e) => updateField('total_overs', e.target.value === '' ? '' : parseInt(e.target.value))}
                className={`bg-slate-800 border-slate-600 text-white ${errors.total_overs ? 'border-red-500' : ''}`}
              />
              {errors.total_overs && <p className="text-red-400 text-xs mt-1">{errors.total_overs}</p>}
            </div>
            <div>
              <Label className="text-slate-300">Balls per Over *</Label>
              <Input
                type="number"
                min={4}
                max={8}
                value={profile.balls_per_over ?? ''}
                onChange={(e) => updateField('balls_per_over', e.target.value === '' ? '' : parseInt(e.target.value))}
                className={`bg-slate-800 border-slate-600 text-white ${errors.balls_per_over ? 'border-red-500' : ''}`}
              />
              {errors.balls_per_over && <p className="text-red-400 text-xs mt-1">{errors.balls_per_over}</p>}
            </div>
          </div>

          {/* Wide Settings */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-amber-400 font-medium text-sm mb-2">Wide Ball Rules ({ballsPerOver} balls/over)</h4>
            <div className="space-y-2">
              {ballOrdinals.map((ord) => (
                <div key={ord} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-12">{ord.replace('_plus', '+').replace('th', '')}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={profile[`wide_${ord}_runs`] ?? ''}
                    onChange={(e) => updateField(`wide_${ord}_runs`, e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    onBlur={(e) => { if (e.target.value === '') updateField(`wide_${ord}_runs`, 1); }}
                    className="bg-slate-700 border border-slate-600 text-white h-8 w-14 rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-500 text-xs">runs</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-slate-500 text-xs">Legal?</span>
                    <button
                      type="button"
                      onClick={() => updateField(`wide_${ord}_legal`, !profile[`wide_${ord}_legal`])}
                      className={`w-10 h-6 rounded-full transition-colors ${profile[`wide_${ord}_legal`] ? 'bg-emerald-500' : 'bg-red-500'}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${profile[`wide_${ord}_legal`] ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No Ball Settings */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-orange-400 font-medium text-sm mb-2">No Ball Rules ({ballsPerOver} balls/over)</h4>
            <div className="space-y-2">
              {ballOrdinals.map((ord) => (
                <div key={ord} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-12">{ord.replace('_plus', '+').replace('th', '')}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={profile[`noball_${ord}_runs`] ?? ''}
                    onChange={(e) => updateField(`noball_${ord}_runs`, e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    onBlur={(e) => { if (e.target.value === '') updateField(`noball_${ord}_runs`, 1); }}
                    className="bg-slate-700 border border-slate-600 text-white h-8 w-14 rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-500 text-xs">runs</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-slate-500 text-xs">Legal?</span>
                    <button
                      type="button"
                      onClick={() => updateField(`noball_${ord}_legal`, !profile[`noball_${ord}_legal`])}
                      className={`w-10 h-6 rounded-full transition-colors ${profile[`noball_${ord}_legal`] ? 'bg-emerald-500' : 'bg-red-500'}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${profile[`noball_${ord}_legal`] ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Free Hit & Other Rules */}
          <div className="bg-slate-800 rounded-lg p-3 space-y-3">
            <h4 className="text-blue-400 font-medium text-sm">Other Rules</h4>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Free hit on no ball</Label>
              <Switch checked={profile.free_hit_on_noball ?? true} onCheckedChange={(v) => updateField('free_hit_on_noball', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Free hit on wide</Label>
              <Switch checked={profile.free_hit_on_wide ?? false} onCheckedChange={(v) => updateField('free_hit_on_wide', v)} />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Retire at score (0 = no limit)</Label>
              <Input
                type="number"
                min={0}
                value={profile.retire_at_score || 0}
                onChange={(e) => updateField('retire_at_score', parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white h-8 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs">Powerplay Overs</Label>
                <Input
                  type="number"
                  min={0}
                  value={profile.powerplay_overs || 0}
                  onChange={(e) => updateField('powerplay_overs', parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white h-8"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Max Overs/Bowler</Label>
                <Input
                  type="number"
                  min={0}
                  value={profile.max_overs_per_bowler || 0}
                  onChange={(e) => updateField('max_overs_per_bowler', parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white h-8"
                />
              </div>
            </div>
          </div>

        </div>
        
        {/* Sticky footer */}
        <div className="flex gap-2 p-4 border-t border-slate-700 bg-slate-900">
          <Button variant="outline" onClick={handleClose} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">Cancel</Button>
          <Button onClick={validateAndSave} disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Profile Viewer Dialog
function ProfileViewerDialog({ open, onClose, profile }) {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-sm [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {profile.isSystem ? '🏏' : '📋'} {profile.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 rounded p-2">
              <span className="text-slate-400">Total Overs:</span>
              <span className="text-white ml-2">{profile.total_overs || 'Unlimited'}</span>
            </div>
            <div className="bg-slate-800 rounded p-2">
              <span className="text-slate-400">Balls/Over:</span>
              <span className="text-white ml-2">{profile.balls_per_over || 6}</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded p-2">
            <span className="text-amber-400">Wide:</span>
            <span className="text-white ml-2">{profile.wide_1st_runs || 1} run(s)</span>
            <span className="text-slate-500 ml-2">• {profile.wide_1st_legal ? 'Legal' : 'Not legal'}</span>
          </div>

          <div className="bg-slate-800 rounded p-2">
            <span className="text-orange-400">No Ball:</span>
            <span className="text-white ml-2">{profile.noball_1st_runs || 1} run(s)</span>
            <span className="text-slate-500 ml-2">• {profile.noball_1st_legal ? 'Legal' : 'Not legal'}</span>
          </div>

          <div className="bg-slate-800 rounded p-2">
            <span className="text-blue-400">Free Hit:</span>
            <span className="text-white ml-2">
              {profile.free_hit_on_noball ? 'On No Ball' : ''}
              {profile.free_hit_on_noball && profile.free_hit_on_wide ? ' & ' : ''}
              {profile.free_hit_on_wide ? 'On Wide' : ''}
              {!profile.free_hit_on_noball && !profile.free_hit_on_wide ? 'None' : ''}
            </span>
          </div>

          {profile.retire_at_score > 0 && (
            <div className="bg-slate-800 rounded p-2">
              <span className="text-purple-400">Retire at:</span>
              <span className="text-white ml-2">{profile.retire_at_score} runs</span>
            </div>
          )}

          <Button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ICC_PROFILES, DEFAULT_PROFILE };