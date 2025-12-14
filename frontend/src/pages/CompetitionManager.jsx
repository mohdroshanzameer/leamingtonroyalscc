import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trophy, Calendar, Plus, Pencil, Trash2, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../components/ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function CompetitionManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('seasons');
  
  // Season state
  const [seasonDialog, setSeasonDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [seasonForm, setSeasonForm] = useState({ name: '', start_date: '', end_date: '', status: 'Upcoming', is_current: false });

  // Competition state
  const [compDialog, setCompDialog] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [compForm, setCompForm] = useState({ name: '', short_name: '', parent_id: '', format: 'T20', status: 'Active' });

  // Fetch data
  const { data: seasons = [], isLoading: loadingSeasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-name'),
  });

  const { data: competitions = [], isLoading: loadingComps } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => api.entities.Competition.list('name'),
  });

  // Mutations
  const seasonMutation = useMutation({
    mutationFn: (data) => editingSeason 
      ? api.entities.Season.update(editingSeason.id, data)
      : api.entities.Season.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      setSeasonDialog(false);
      setEditingSeason(null);
      resetSeasonForm();
      toast.success(editingSeason ? 'Season updated' : 'Season created');
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: (id) => api.entities.Season.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      toast.success('Season deleted');
    },
  });

  const compMutation = useMutation({
    mutationFn: (data) => editingComp
      ? api.entities.Competition.update(editingComp.id, data)
      : api.entities.Competition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setCompDialog(false);
      setEditingComp(null);
      resetCompForm();
      toast.success(editingComp ? 'Competition updated' : 'Competition created');
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: (id) => api.entities.Competition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competition deleted');
    },
  });

  const resetSeasonForm = () => setSeasonForm({ name: '', start_date: '', end_date: '', status: 'Upcoming', is_current: false });
  const resetCompForm = () => setCompForm({ name: '', short_name: '', parent_id: '', format: 'T20', status: 'Active' });

  const openSeasonEdit = (season) => {
    setEditingSeason(season);
    setSeasonForm({
      name: season.name || '',
      start_date: season.start_date || '',
      end_date: season.end_date || '',
      status: season.status || 'Upcoming',
      is_current: season.is_current || false,
    });
    setSeasonDialog(true);
  };

  const openCompEdit = (comp) => {
    setEditingComp(comp);
    setCompForm({
      name: comp.name || '',
      short_name: comp.short_name || '',
      parent_id: comp.parent_id || '',
      format: comp.format || 'T20',
      status: comp.status || 'Active',
    });
    setCompDialog(true);
  };

  const handleSeasonSubmit = () => {
    if (!seasonForm.name) {
      toast.error('Season name is required');
      return;
    }
    seasonMutation.mutate(seasonForm);
  };

  const handleCompSubmit = () => {
    if (!compForm.name || !compForm.short_name) {
      toast.error('Name and short name are required');
      return;
    }
    const parent = parentCompetitions.find(p => p.id === compForm.parent_id);
    compMutation.mutate({
      ...compForm,
      parent_name: parent?.short_name || parent?.name || null,
      parent_id: compForm.parent_id || null,
    });
  };

  // Group competitions
  const parentCompetitions = competitions.filter(c => !c.parent_id);
  const getSubCompetitions = (parentId) => competitions.filter(c => c.parent_id === parentId);

  const statusColors = {
    Active: 'bg-emerald-900/30 text-emerald-400',
    Completed: 'bg-slate-700/30 text-slate-400',
    Upcoming: 'bg-blue-900/30 text-blue-400',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="pt-24 sm:pt-28 pb-8 px-4" style={{ backgroundColor: colors.primary }}>
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Admin')} className="inline-flex items-center text-white/80 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            Competition Manager
          </h1>
          <p className="text-white/70 mt-1">Manage seasons and competitions</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 p-1" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                            <TabsTrigger value="seasons" className="flex items-center gap-2 data-[state=active]:text-[#1a1a2e]" style={{ color: colors.textSecondary }}>
                              <Calendar className="w-4 h-4" /> Seasons
                            </TabsTrigger>
                            <TabsTrigger value="competitions" className="flex items-center gap-2 data-[state=active]:text-[#1a1a2e]" style={{ color: colors.textSecondary }} data-state-active-style={{ backgroundColor: colors.accent }}>
                              <Trophy className="w-4 h-4" /> Competitions
                            </TabsTrigger>
                          </TabsList>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Competitions & Divisions</h2>
              <Button onClick={() => { resetCompForm(); setEditingComp(null); setCompDialog(true); }} style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Competition
              </Button>
            </div>

            {loadingComps ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {parentCompetitions.map(parent => (
                  <Card key={parent.id} style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>{parent.name}</CardTitle>
                          <Badge variant="outline" style={{ borderColor: colors.border, color: colors.textSecondary }}>{parent.short_name}</Badge>
                          <Badge className={statusColors[parent.status]}>{parent.status}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openCompEdit(parent)} style={{ color: colors.textSecondary }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCompMutation.mutate(parent.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {getSubCompetitions(parent.id).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {getSubCompetitions(parent.id).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg group" style={{ backgroundColor: colors.surfaceHover }}>
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3" style={{ color: colors.textMuted }} />
                                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{sub.name}</span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <button onClick={() => openCompEdit(sub)} className="p-1 rounded" style={{ color: colors.textSecondary }}>
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={() => deleteCompMutation.mutate(sub.id)} className="p-1 rounded">
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: colors.textMuted }}>No sub-competitions</p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Standalone competitions (no parent, no children) */}
                {competitions.filter(c => !c.parent_id && getSubCompetitions(c.id).length === 0 && !parentCompetitions.some(p => p.id === c.id)).length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Standalone Competitions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {competitions.filter(c => !c.parent_id && getSubCompetitions(c.id).length === 0).map(comp => (
                          <div key={comp.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 group">
                            <span className="text-sm font-medium">{comp.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                              <button onClick={() => openCompEdit(comp)} className="p-1 hover:bg-slate-200 rounded">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteCompMutation.mutate(comp.id)} className="p-1 hover:bg-red-100 rounded">
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Seasons</h2>
              <Button onClick={() => { resetSeasonForm(); setEditingSeason(null); setSeasonDialog(true); }} style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Season
              </Button>
            </div>

            {loadingSeasons ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="grid gap-3">
                {seasons.map(season => (
                  <Card key={season.id} style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.surfaceHover }}>
                          <Calendar className="w-5 h-5" style={{ color: colors.accent }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: colors.textPrimary }}>{season.name}</span>
                            {season.is_current && <Badge style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}>Current</Badge>}
                            <Badge className={statusColors[season.status]}>{season.status}</Badge>
                          </div>
                          {season.start_date && (
                            <p className="text-sm" style={{ color: colors.textMuted }}>
                              {season.start_date} → {season.end_date || 'Ongoing'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openSeasonEdit(season)} style={{ color: colors.textSecondary }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSeasonMutation.mutate(season.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Season Dialog */}
      <Dialog open={seasonDialog} onOpenChange={setSeasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Edit Season' : 'Add Season'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Season Name *</Label>
              <Input value={seasonForm.name} onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })} placeholder="e.g., 2025" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={seasonForm.start_date} onChange={(e) => setSeasonForm({ ...seasonForm, start_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={seasonForm.end_date} onChange={(e) => setSeasonForm({ ...seasonForm, end_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={seasonForm.status} onValueChange={(v) => setSeasonForm({ ...seasonForm, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Current Season</Label>
              <Switch checked={seasonForm.is_current} onCheckedChange={(v) => setSeasonForm({ ...seasonForm, is_current: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonDialog(false)}>Cancel</Button>
            <Button onClick={handleSeasonSubmit} disabled={seasonMutation.isPending} style={{ backgroundColor: colors.primary }} className="text-white">
              {seasonMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Competition Dialog */}
      <Dialog open={compDialog} onOpenChange={setCompDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingComp ? 'Edit Competition' : 'Add Competition'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Competition Name *</Label>
              <Input value={compForm.name} onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} placeholder="e.g., Division 1" className="mt-1" />
            </div>
            <div>
              <Label>Short Name *</Label>
              <Input value={compForm.short_name} onChange={(e) => setCompForm({ ...compForm, short_name: e.target.value })} placeholder="e.g., Div 1" className="mt-1" />
            </div>
            <div>
              <Label>Parent Competition (optional)</Label>
              <Select value={compForm.parent_id || 'none'} onValueChange={(v) => setCompForm({ ...compForm, parent_id: v === 'none' ? '' : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None (Parent Competition)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Parent Competition)</SelectItem>
                  {parentCompetitions.filter(p => p.id !== editingComp?.id).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Format</Label>
                <Select value={compForm.format} onValueChange={(v) => setCompForm({ ...compForm, format: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T20">T20</SelectItem>
                    <SelectItem value="T10">T10</SelectItem>
                    <SelectItem value="ODI">ODI</SelectItem>
                    <SelectItem value="Indoor">Indoor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={compForm.status} onValueChange={(v) => setCompForm({ ...compForm, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompDialog(false)}>Cancel</Button>
            <Button onClick={handleCompSubmit} disabled={compMutation.isPending} style={{ backgroundColor: colors.primary }} className="text-white">
              {compMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}