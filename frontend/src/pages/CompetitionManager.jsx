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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Trophy, Calendar, Plus, Pencil, Trash2, ChevronRight, ArrowLeft, Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { toast } from 'sonner';
import { getFinanceTheme } from '@/components/ClubConfig';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

const colors = getFinanceTheme();

export default function CompetitionManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('seasons');
  const [user, setUser] = useState(null);
  
  // Season state
  const [seasonDialog, setSeasonDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [seasonForm, setSeasonForm] = useState({ name: '', start_date: '', end_date: '', status: 'Upcoming', is_current: false });

  // Fetch current user
  React.useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  // Competition state
  const [compDialog, setCompDialog] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [compType, setCompType] = useState('league'); // 'league' or 'division'
  const [compForm, setCompForm] = useState({ name: '', short_name: '', parent_id: '', format: 'T20', status: 'Active', match_fee: 0 });
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

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
    mutationFn: (data) => {
      const payload = editingSeason ? data : { ...data, created_by: user?.email };
      return editingSeason 
        ? api.entities.Season.update(editingSeason.id, payload)
        : api.entities.Season.create(payload);
    },
    onSuccess: async (season) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      
      // If this is the current season, save to user preferences
      if (season.is_current && user) {
        await api.auth.updateMe({ default_season_id: season.id }).catch(() => {});
      }
      
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
    onError: (error) => {
      if (error.message?.includes('foreign key constraint')) {
        toast.error('Cannot delete season - it has associated records (payments, tournaments, etc.)');
      } else {
        toast.error('Failed to delete season');
      }
    },
  });

  const compMutation = useMutation({
    mutationFn: (data) => {
      // Ensure match_fee is a number
      const payload = { 
        ...data, 
        match_fee: parseFloat(data.match_fee) || 0,
        ...(editingComp ? {} : { created_by: user?.email })
      };
      return editingComp
        ? api.entities.Competition.update(editingComp.id, payload)
        : api.entities.Competition.create(payload);
    },
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
    onError: (error) => {
      if (error.message?.includes('foreign key constraint')) {
        toast.error('Cannot delete competition - it has associated records (tournaments, payments, etc.)');
      } else {
        toast.error('Failed to delete competition');
      }
    },
  });

  const resetSeasonForm = () => setSeasonForm({ name: '', start_date: '', end_date: '', status: 'Upcoming', is_current: false });
  const resetCompForm = () => setCompForm({ name: '', short_name: '', parent_id: '', format: 'T20', status: 'Active', match_fee: 0 });

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
    setCompType(comp.parent_id ? 'division' : 'league');
    setCompForm({
      name: comp.name || '',
      short_name: comp.short_name || '',
      parent_id: comp.parent_id || '',
      format: comp.format || 'T20',
      status: comp.status || 'Active',
      match_fee: comp.match_fee || 0,
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
    if (compType === 'division' && !compForm.parent_id) {
      toast.error('Please select a parent league');
      return;
    }
    const parent = parentCompetitions.find(p => p.id === compForm.parent_id);
    const payload = {
      ...compForm,
      match_fee: parseFloat(compForm.match_fee) || 0,
      parent_name: parent?.short_name || parent?.name || null,
      parent_id: compType === 'league' ? null : compForm.parent_id,
    };
    console.log('Submitting competition:', payload);
    compMutation.mutate(payload);
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
    <div className="min-h-screen pt-16 pb-12" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="pt-8 pb-8 px-4" style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Admin')} className="inline-flex items-center mb-4 text-sm" style={{ color: colors.textSecondary }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
            <Trophy className="w-8 h-8" />
            Competition Manager
          </h1>
          <p className="mt-1" style={{ color: colors.textSecondary }}>Manage seasons and competitions</p>
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
              <div className="flex gap-2">
                <Button 
                  onClick={() => { 
                    resetCompForm(); 
                    setEditingComp(null); 
                    setCompType('league'); 
                    setCompDialog(true); 
                  }} 
                  style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add League
                </Button>
                <Button 
                  onClick={() => { 
                    resetCompForm(); 
                    setEditingComp(null); 
                    setCompType('division'); 
                    setCompDialog(true); 
                  }} 
                  variant="outline"
                  style={{ borderColor: colors.accent, color: colors.accent }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Sub-Competition
                </Button>
              </div>
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
                          <Button variant="ghost" size="icon" onClick={() => {
                            const subComps = getSubCompetitions(parent.id);
                            const message = subComps.length > 0
                              ? `This will delete "${parent.name}" and all ${subComps.length} sub-competition(s). Any associated tournaments, payments, and matches will also be affected. This action cannot be undone.`
                              : `This will permanently delete "${parent.name}". Any associated tournaments, payments, and matches will also be affected. This action cannot be undone.`;
                            setConfirmDialog({
                              open: true,
                              title: 'Delete Competition',
                              message,
                              onConfirm: () => deleteCompMutation.mutate(parent.id),
                              confirmText: 'Delete Competition',
                              variant: 'danger'
                            });
                          }}>
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
                                <button onClick={() => {
                                  setConfirmDialog({
                                    open: true,
                                    title: 'Delete Sub-Competition',
                                    message: `This will permanently delete "${sub.name}". Any associated tournaments, payments, and matches will also be affected. This action cannot be undone.`,
                                    onConfirm: () => deleteCompMutation.mutate(sub.id),
                                    confirmText: 'Delete Sub-Competition',
                                    variant: 'danger'
                                  });
                                }} className="p-1 rounded">
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
                  <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                    <CardHeader><CardTitle className="text-lg" style={{ color: colors.textPrimary }}>Standalone Competitions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {competitions.filter(c => !c.parent_id && getSubCompetitions(c.id).length === 0).map(comp => (
                          <div key={comp.id} className="flex items-center justify-between p-2 rounded-lg group" style={{ backgroundColor: colors.surfaceHover }}>
                            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{comp.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                              <button onClick={() => openCompEdit(comp)} className="p-1 rounded" style={{ color: colors.textSecondary }}>
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: 'Delete Competition',
                                  message: `This will permanently delete "${comp.name}". Any associated tournaments, payments, and matches will also be affected. This action cannot be undone.`,
                                  onConfirm: () => deleteCompMutation.mutate(comp.id),
                                  confirmText: 'Delete Competition',
                                  variant: 'danger'
                                });
                              }} className="p-1 rounded">
                                <Trash2 className="w-3 h-3 text-red-400" />
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
                              {format(new Date(season.start_date), 'dd MMM yyyy')} → {season.end_date ? format(new Date(season.end_date), 'dd MMM yyyy') : 'Ongoing'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openSeasonEdit(season)} style={{ color: colors.textSecondary }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: 'Delete Season',
                            message: `This will permanently delete the season "${season.name}". Any associated tournaments, payments, and matches will also be affected. This action cannot be undone.`,
                            onConfirm: () => deleteSeasonMutation.mutate(season.id),
                            confirmText: 'Delete Season',
                            variant: 'danger'
                          });
                        }}>
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
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{editingSeason ? 'Edit Season' : 'Add Season'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label style={{ color: colors.textSecondary }}>Season Name *</Label>
              <Input value={seasonForm.name} onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })} placeholder="e.g., 2025" className="mt-1" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: colors.textSecondary }}>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {seasonForm.start_date ? format(new Date(seasonForm.start_date), 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <CalendarComponent 
                      mode="single" 
                      selected={seasonForm.start_date ? new Date(seasonForm.start_date) : undefined}
                      onSelect={(date) => setSeasonForm({ ...seasonForm, start_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {seasonForm.end_date ? format(new Date(seasonForm.end_date), 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <CalendarComponent 
                      mode="single" 
                      selected={seasonForm.end_date ? new Date(seasonForm.end_date) : undefined}
                      onSelect={(date) => setSeasonForm({ ...seasonForm, end_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>Status</Label>
              <Select value={seasonForm.status} onValueChange={(v) => setSeasonForm({ ...seasonForm, status: v })}>
                <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-medium" style={{ color: '#ffffff' }}>Current Season</Label>
              <Switch 
                checked={seasonForm.is_current} 
                onCheckedChange={(v) => setSeasonForm({ ...seasonForm, is_current: v })}
                style={{
                  backgroundColor: seasonForm.is_current ? colors.accent : '#334155',
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonDialog(false)} style={{ borderColor: colors.border, color: colors.textSecondary }}>Cancel</Button>
            <Button onClick={handleSeasonSubmit} disabled={seasonMutation.isPending} style={{ backgroundColor: colors.accent, color: '#000' }} className="font-semibold">
              {seasonMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Competition Dialog */}
      <Dialog open={compDialog} onOpenChange={setCompDialog}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              {editingComp 
                ? `Edit ${compType === 'league' ? 'League' : 'Sub-Competition'}` 
                : `Add ${compType === 'league' ? 'League' : 'Sub-Competition'}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {compType === 'division' && (
              <div>
                <Label style={{ color: colors.textSecondary }}>Parent League *</Label>
                <Select value={compForm.parent_id || 'select'} onValueChange={(v) => setCompForm({ ...compForm, parent_id: v === 'select' ? '' : v })}>
                  <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                    <SelectValue placeholder="Select parent league" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select" disabled>Select parent league</SelectItem>
                    {parentCompetitions.filter(p => p.id !== editingComp?.id).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label style={{ color: colors.textSecondary }}>
                {compType === 'league' ? 'League Name' : 'Sub-Competition Name'} *
              </Label>
              <Input 
                value={compForm.name} 
                onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} 
                placeholder={compType === 'league' ? 'e.g., Warwickshire Cricket League' : 'e.g., Division 9'} 
                className="mt-1" 
                style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }} 
              />
            </div>
            <div>
              <Label style={{ color: colors.textSecondary }}>Short Name *</Label>
              <Input 
                value={compForm.short_name} 
                onChange={(e) => setCompForm({ ...compForm, short_name: e.target.value })} 
                placeholder={compType === 'league' ? 'e.g., WCL' : 'e.g., Div 9'} 
                className="mt-1" 
                style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }} 
              />
            </div>
            {compType === 'division' && (
              <div>
                <Label style={{ color: colors.textSecondary }}>Match Fee (£)</Label>
                <Input 
                  type="number"
                  value={compForm.match_fee || 0} 
                  onChange={(e) => setCompForm({ ...compForm, match_fee: parseFloat(e.target.value) || 0 })} 
                  placeholder="e.g., 10" 
                  min="0"
                  step="0.01"
                  className="mt-1" 
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }} 
                />
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Match fee for this sub-competition (£0 = no fee)</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: colors.textSecondary }}>Format</Label>
                <Select value={compForm.format} onValueChange={(v) => setCompForm({ ...compForm, format: v })}>
                  <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}><SelectValue /></SelectTrigger>
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
                <Label style={{ color: colors.textSecondary }}>Status</Label>
                <Select value={compForm.status} onValueChange={(v) => setCompForm({ ...compForm, status: v })}>
                  <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setCompDialog(false)} style={{ borderColor: colors.border, color: colors.textSecondary }}>Cancel</Button>
            <Button onClick={handleCompSubmit} disabled={compMutation.isPending} style={{ backgroundColor: colors.accent, color: '#000' }} className="font-semibold">
              {compMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant || 'danger'}
      />
    </div>
  );
}