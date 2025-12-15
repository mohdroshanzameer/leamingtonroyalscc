import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trophy, ArrowLeft, Save, Calendar, Users, Zap, Shield, Swords, Layers, Check, ChevronRight, Award, Phone, Globe, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { toast } from 'sonner';
import { getFinanceTheme } from '../components/ClubConfig';

const colors = getFinanceTheme();

export default function TournamentCreate() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    season_id: '',
    competition_id: '',
    sub_competition_id: '',
    format: 'league',
    overs_per_match: 20,
    balls_per_over: 6,
    max_teams: 8,
    num_groups: 2,
    teams_qualify_per_group: 2,
    start_date: '',
    end_date: '',
    description: '',
    rules: '',
    prize_money: '',
    entry_fee: 0,
    organizer_name: '',
    organizer_contact: '',
    is_public: true,
  });

  const updateField = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate tournament name and short_name when season, competition, or sub-competition changes
      if (['season_id', 'competition_id', 'sub_competition_id'].includes(field)) {
        const season = field === 'season_id' 
          ? seasons.find(s => s.id === value) 
          : seasons.find(s => s.id === updated.season_id);
        
        const comp = field === 'competition_id'
          ? competitions.find(c => c.id === value)
          : competitions.find(c => c.id === updated.competition_id);
        
        const subCompId = field === 'sub_competition_id' ? value : updated.sub_competition_id;
        const subComp = subCompId ? competitions.find(c => c.id === subCompId) : null;
        
        // Full name
        const nameParts = [comp?.short_name || comp?.name, subComp?.name, season?.name].filter(Boolean);
        if (nameParts.length > 0) {
          updated.name = nameParts.join(' - ');
        }
        

      }
      
      return updated;
    });
  };

  // Fetch seasons, competitions, existing tournaments
  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-name'),
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => api.entities.Competition.list('name'),
  });

  const { data: existingTournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.entities.Tournament.list(),
  });

  // Parent competitions (no parent_id)
  const parentCompetitions = competitions.filter(c => !c.parent_id);
  
  // Sub-competitions (child of selected competition)
  const subCompetitions = competitions.filter(c => c.parent_id === formData.competition_id);

  // Fetch match profiles
  const { data: matchProfiles = [] } = useQuery({
    queryKey: ['matchProfiles'],
    queryFn: () => api.entities.MatchProfile.list('name'),
  });

  const selectedProfile = matchProfiles.find(p => p.id === formData.match_profile_id);

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Tournament.create(data),
    onSuccess: (tournament) => {
      toast.success('Tournament created successfully!');
      window.location.href = createPageUrl(`TournamentView?id=${tournament.id}`);
    },
    onError: (error) => {
      console.error('Tournament creation error:', error);
      toast.error('Failed to create tournament');
    }
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name) {
      toast.error('Please select season and competition to generate tournament name');
      return;
    }
    
    if (!formData.season_id) {
      toast.error('Please select a season');
      setStep(1);
      return;
    }
    
    // Check for duplicate tournament name
    const duplicateName = existingTournaments.find(t => 
      t.name && t.name.toLowerCase() === formData.name.toLowerCase()
    );
    if (duplicateName) {
      toast.error(`Tournament "${formData.name}" already exists. Please choose a different name.`);
      return;
    }
    
    // Validate dates
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        toast.error('End date cannot be before start date');
        setStep(1);
        return;
      }
    }
    
    // Validate group_knockout settings
    if (formData.format === 'group_knockout') {
      const teamsPerGroup = Math.floor(formData.max_teams / formData.num_groups);
      if (teamsPerGroup < 2) {
        toast.error(`Not enough teams for ${formData.num_groups} groups. Reduce groups or increase max teams.`);
        setStep(2);
        return;
      }
      if (formData.teams_qualify_per_group >= teamsPerGroup) {
        toast.error(`Teams qualifying per group should be less than teams per group (${teamsPerGroup})`);
        setStep(2);
        return;
      }
    }
    
    // Get names for denormalized fields
    const season = seasons.find(s => s.id === formData.season_id);
    const comp = competitions.find(c => c.id === formData.competition_id);
    const subComp = formData.sub_competition_id ? competitions.find(c => c.id === formData.sub_competition_id) : null;
    const profile = matchProfiles.find(p => p.id === formData.match_profile_id);
    
    createMutation.mutate({
      ...formData,
      status: 'draft',
      // Denormalized name fields for faster loading
      season_name: season?.name || '',
      competition_name: comp?.short_name || comp?.name || '',
      sub_competition_name: subComp?.name || '',
      match_profile_name: profile?.name || '',
    });
  };

  const formatOptions = [
    { value: 'knockout', label: 'Knockout', desc: 'Single elimination tournament', icon: Zap },
    { value: 'league', label: 'Round Robin', desc: 'Every team plays every other team', icon: Shield },
    { value: 'group_knockout', label: 'Groups + Knockout', desc: 'Groups followed by knockout rounds', icon: Layers },
    { value: 'super_league', label: 'Super League', desc: 'Double round robin format', icon: Swords },
  ];

  const steps = [
    { num: 1, label: 'Basic Info', icon: Calendar },
    { num: 2, label: 'Format & Rules', icon: Trophy },
    { num: 3, label: 'Details', icon: Award }
  ];

  return (
    <div className="min-h-screen pt-16 pb-12" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('Tournaments')} 
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tournaments
          </Link>
          
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.accent }}
            >
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.textPrimary }}>
                Create Tournament
              </h1>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Set up your cricket tournament in minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              
              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 relative transition-all"
                  style={{ 
                    borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
                    color: isActive ? colors.accent : isCompleted ? colors.success : colors.textMuted 
                  }}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{ 
                      backgroundColor: isActive ? colors.accent : isCompleted ? colors.success : colors.surfaceHover,
                      color: isActive || isCompleted ? '#000' : colors.textMuted
                    }}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div 
          className="rounded-xl p-6"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <Calendar className="w-5 h-5" style={{ color: colors.accent }} />
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Basic Information</h2>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Define your tournament's identity</p>
                  </div>
                </div>

                {/* Season, Competition, Sub-Competition */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label style={{ color: colors.textSecondary }}>Season *</Label>
                    <Select value={formData.season_id} onValueChange={(v) => updateField('season_id', v)}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                        <SelectValue placeholder="Select Season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.is_current && '(Current)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label style={{ color: colors.textSecondary }}>Competition</Label>
                    <Select 
                      value={formData.competition_id} 
                      onValueChange={(v) => {
                        updateField('competition_id', v);
                        updateField('sub_competition_id', '');
                      }}
                    >
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                        <SelectValue placeholder="Select Competition" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentCompetitions.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label style={{ color: colors.textSecondary }}>Division</Label>
                    <Select 
                      value={formData.sub_competition_id} 
                      onValueChange={(v) => updateField('sub_competition_id', v)}
                      disabled={!formData.competition_id || subCompetitions.length === 0}
                    >
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                        <SelectValue placeholder={subCompetitions.length === 0 ? "No divisions" : "Select"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subCompetitions.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tournament Name Preview */}
                {formData.name && (
                  <div 
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: `${colors.accent}15`, border: `1px solid ${colors.accent}30` }}
                  >
                    <Trophy className="w-5 h-5" style={{ color: colors.accent }} />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.accent }}>Tournament Name</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{formData.name}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label style={{ color: colors.textSecondary }}>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                      className="mt-2"
                      style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label style={{ color: colors.textSecondary }}>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => updateField('end_date', e.target.value)}
                      className="mt-2"
                      style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                    />
                  </div>
                </div>

                <div>
                  <Label style={{ color: colors.textSecondary }}>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Brief description of the tournament..."
                    className="mt-2"
                    rows={3}
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Format & Rules */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <Trophy className="w-5 h-5" style={{ color: colors.accent }} />
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Format & Rules</h2>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Choose how the tournament will be played</p>
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <Label style={{ color: colors.textSecondary }} className="mb-3 block">Tournament Format *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {formatOptions.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = formData.format === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField('format', opt.value)}
                          className="p-4 rounded-xl text-left transition-all relative overflow-hidden group"
                          style={{ 
                            backgroundColor: isSelected ? `${colors.accent}15` : colors.surfaceHover,
                            border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ 
                                backgroundColor: isSelected ? colors.accent : colors.border,
                                color: isSelected ? '#000' : colors.textMuted
                              }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: colors.textPrimary }}>{opt.label}</p>
                              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{opt.desc}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div 
                              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colors.accent }}
                            >
                              <Check className="w-3 h-3 text-black" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team Settings */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4" style={{ color: colors.accent }} />
                    <span className="font-medium" style={{ color: colors.textPrimary }}>Team Settings</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <Label style={{ color: colors.textMuted }} className="text-xs">Max Teams</Label>
                      <Select value={String(formData.max_teams)} onValueChange={(v) => updateField('max_teams', parseInt(v))}>
                        <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[4, 6, 8, 10, 12, 16, 20, 24, 32].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} Teams</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.format === 'group_knockout' && (
                      <>
                        <div>
                          <Label style={{ color: colors.textMuted }} className="text-xs">Groups</Label>
                          <Select value={String(formData.num_groups)} onValueChange={(v) => updateField('num_groups', parseInt(v))}>
                            <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 3, 4, 5, 6].map(n => (
                                <SelectItem key={n} value={String(n)}>{n} Groups</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label style={{ color: colors.textMuted }} className="text-xs">Qualify Per Group</Label>
                          <Select value={String(formData.teams_qualify_per_group)} onValueChange={(v) => updateField('teams_qualify_per_group', parseInt(v))}>
                            <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map(n => (
                                <SelectItem key={n} value={String(n)}>Top {n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Match Profile Selection */}
                <div>
                  <Label style={{ color: colors.textSecondary }}>Match Profile</Label>
                  <p className="text-xs mb-2" style={{ color: colors.textMuted }}>Scoring rules for all matches</p>
                  <Select value={formData.match_profile_id || ''} onValueChange={(v) => updateField('match_profile_id', v)}>
                    <SelectTrigger className="mt-1" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                      <SelectValue placeholder="Select a match profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchProfiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.total_overs} overs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProfile && (
                    <div 
                      className="mt-3 p-3 rounded-lg text-sm flex flex-wrap gap-3"
                      style={{ backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}30` }}
                    >
                      <span style={{ color: colors.textPrimary }}>{selectedProfile.total_overs} overs</span>
                      <span style={{ color: colors.textMuted }}>•</span>
                      <span style={{ color: colors.textPrimary }}>{selectedProfile.balls_per_over} balls/over</span>
                      <span style={{ color: colors.textMuted }}>•</span>
                      <span style={{ color: colors.textPrimary }}>Max {selectedProfile.max_overs_per_bowler}/bowler</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label style={{ color: colors.textSecondary }}>Tournament Rules</Label>
                  <Textarea
                    value={formData.rules}
                    onChange={(e) => updateField('rules', e.target.value)}
                    placeholder="Enter tournament rules, tie-breaker conditions, player eligibility..."
                    className="mt-2"
                    rows={4}
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: colors.border }}>
                  <Award className="w-5 h-5" style={{ color: colors.accent }} />
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Additional Details</h2>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Prize info and organizer details</p>
                  </div>
                </div>

                {/* Prize & Entry */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4" style={{ color: colors.warning }} />
                    <span className="font-medium" style={{ color: colors.textPrimary }}>Prize & Fees</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textMuted }} className="text-xs">Prize Money</Label>
                      <Input
                        value={formData.prize_money}
                        onChange={(e) => updateField('prize_money', e.target.value)}
                        placeholder="e.g., £500 Winner"
                        className="mt-1"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textMuted }} className="text-xs">Entry Fee (per team)</Label>
                      <Input
                        type="number"
                        value={formData.entry_fee}
                        onChange={(e) => updateField('entry_fee', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                  </div>
                </div>

                {/* Organizer */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-4 h-4" style={{ color: colors.accent }} />
                    <span className="font-medium" style={{ color: colors.textPrimary }}>Organizer</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textMuted }} className="text-xs">Name</Label>
                      <Input
                        value={formData.organizer_name}
                        onChange={(e) => updateField('organizer_name', e.target.value)}
                        placeholder="Your name or organization"
                        className="mt-1"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textMuted }} className="text-xs">Contact</Label>
                      <Input
                        value={formData.organizer_contact}
                        onChange={(e) => updateField('organizer_contact', e.target.value)}
                        placeholder="Phone or Email"
                        className="mt-1"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                  </div>
                </div>

                {/* Public Toggle */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5" style={{ color: colors.accent }} />
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>Public Tournament</p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>Anyone can view details</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(v) => updateField('is_public', v)}
                  />
                </div>

                {/* Summary */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: `${colors.accent}10`, border: `1px solid ${colors.accent}30` }}
                >
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.accent }}>
                    <Check className="w-4 h-4" /> Ready to Create
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span style={{ color: colors.textMuted }}>Name</span>
                      <p className="font-medium truncate" style={{ color: colors.textPrimary }}>{formData.name || '-'}</p>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Format</span>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{formatOptions.find(f => f.value === formData.format)?.label}</p>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Teams</span>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{formData.max_teams} max</p>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Profile</span>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{selectedProfile?.name || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t" style={{ borderColor: colors.border }}>
              {step > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step - 1)}
                  style={{ borderColor: colors.border, color: colors.textSecondary, backgroundColor: 'transparent' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
              ) : (
                <Link to={createPageUrl('Tournaments')}>
                  <Button 
                    variant="outline"
                    style={{ borderColor: colors.border, color: colors.textSecondary, backgroundColor: 'transparent' }}
                  >
                    Cancel
                  </Button>
                </Link>
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  style={{ backgroundColor: colors.accent, color: '#000' }}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={createMutation.isPending || !formData.name}
                  style={{ backgroundColor: colors.accent, color: '#000' }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
                </Button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}