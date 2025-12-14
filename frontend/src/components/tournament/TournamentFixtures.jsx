import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Play, Edit2, Trash2, Clock, MapPin, Trophy, Wand2, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import FixtureScheduler from './FixtureScheduler';

export default function TournamentFixtures({ tournament, matches, teams }) {
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [matchData, setMatchData] = useState({ team1_id: '', team2_id: '', match_date: '', venue: tournament.venue || '', stage: 'group', group: 'A', round: 1 });
  
  const queryClient = useQueryClient();
  const approvedTeams = teams.filter(t => t.registration_status === 'approved');

  // Detect scheduling conflicts
  const detectConflicts = () => {
    const conflicts = [];
    const matchesByDate = {};
    
    matches.forEach((m, idx) => {
      if (!m.match_date) return;
      const dateKey = m.match_date.split('T')[0];
      if (!matchesByDate[dateKey]) matchesByDate[dateKey] = [];
      matchesByDate[dateKey].push({ ...m, idx });
    });

    Object.entries(matchesByDate).forEach(([date, dayMatches]) => {
      const teamAppearances = {};
      dayMatches.forEach(m => {
        [m.team1_name, m.team2_name].forEach(team => {
          if (teamAppearances[team]) {
            conflicts.push({ matchId: m.id, type: 'same_day', team, date });
          } else {
            teamAppearances[team] = m;
          }
        });
      });
    });

    return conflicts;
  };

  const conflicts = detectConflicts();
  const matchConflictIds = new Set(conflicts.map(c => c.matchId));

  const createMatchMutation = useMutation({
    mutationFn: (data) => api.entities.TournamentMatch.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournamentMatches'] }); toast.success('Match created'); resetForm(); },
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.TournamentMatch.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournamentMatches'] }); toast.success('Match updated'); resetForm(); },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (id) => api.entities.TournamentMatch.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tournamentMatches'] }); toast.success('Match deleted'); },
  });

  const resetForm = () => { setShowAddMatch(false); setEditingMatch(null); setMatchData({ team1_id: '', team2_id: '', match_date: '', venue: tournament.venue || '', stage: 'group', group: 'A', round: 1 }); };

  const handleSubmit = () => {
    const team1 = approvedTeams.find(t => t.id === matchData.team1_id);
    const team2 = approvedTeams.find(t => t.id === matchData.team2_id);
    
    if (!team1 || !team2) { 
      toast.error('Please select both teams'); 
      return; 
    }
    if (matchData.team1_id === matchData.team2_id) { 
      toast.error('Teams must be different'); 
      return; 
    }
    
    // Check for duplicate match (same teams in same stage/round) - skip if editing same match
    const isDuplicate = matches.some(m => {
      if (editingMatch && m.id === editingMatch.id) return false;
      const sameTeams = (m.team1_id === team1.id && m.team2_id === team2.id) || 
                        (m.team1_id === team2.id && m.team2_id === team1.id);
      const sameStage = m.stage === matchData.stage;
      const sameGroup = matchData.stage !== 'group' || m.group === matchData.group;
      return sameTeams && sameStage && sameGroup;
    });
    
    if (isDuplicate) {
      toast.error(`Match between ${team1.team_name} and ${team2.team_name} already exists in this stage`);
      return;
    }
    
    // Check if match date conflicts with same team playing on same day
    if (matchData.match_date) {
      const matchDate = matchData.match_date.split('T')[0];
      const sameDayMatch = matches.find(m => {
        if (editingMatch && m.id === editingMatch.id) return false;
        if (!m.match_date) return false;
        const mDate = m.match_date.split('T')[0];
        if (mDate !== matchDate) return false;
        return m.team1_id === team1.id || m.team2_id === team1.id || 
               m.team1_id === team2.id || m.team2_id === team2.id;
      });
      if (sameDayMatch) {
        const conflictTeam = [team1, team2].find(t => 
          sameDayMatch.team1_id === t.id || sameDayMatch.team2_id === t.id
        );
        toast.error(`${conflictTeam?.team_name} already has a match scheduled on ${matchDate}`);
        return;
      }
    }
    
    const data = { 
      tournament_id: tournament.id, 
      team1_id: team1.id, 
      team1_name: team1.team_name, 
      team2_id: team2.id, 
      team2_name: team2.team_name, 
      match_date: matchData.match_date || null, 
      venue: matchData.venue, 
      stage: matchData.stage, 
      group: matchData.stage === 'group' ? matchData.group : null, 
      round: matchData.round, 
      match_number: editingMatch ? editingMatch.match_number : matches.length + 1, 
      status: 'scheduled' 
    };
    
    if (editingMatch) { 
      updateMatchMutation.mutate({ id: editingMatch.id, data }); 
    } else { 
      createMatchMutation.mutate(data); 
    }
  };

  // Handle advanced scheduler generation
  const handleSchedulerGenerate = async (fixtures) => {
    for (const fixture of fixtures) {
      await api.entities.TournamentMatch.create(fixture);
    }
    queryClient.invalidateQueries({ queryKey: ['tournamentMatches'] });
    toast.success(`${fixtures.length} matches scheduled!`);
  };

  // Quick generate (simple, no scheduling)
  const generateFixtures = async () => {
    if (approvedTeams.length < 2) { toast.error('Need at least 2 teams'); return; }
    const newMatches = [];
    let matchNum = matches.length + 1;
    if (tournament.format === 'league' || tournament.format === 'super_league') {
      const numTeams = approvedTeams.length;
      const rounds = tournament.format === 'super_league' ? 2 : 1;
      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < numTeams; i++) {
          for (let j = i + 1; j < numTeams; j++) {
            const team1 = r === 0 ? approvedTeams[i] : approvedTeams[j];
            const team2 = r === 0 ? approvedTeams[j] : approvedTeams[i];
            newMatches.push({ tournament_id: tournament.id, team1_id: team1.id, team1_name: team1.team_name, team2_id: team2.id, team2_name: team2.team_name, stage: 'league', round: r + 1, match_number: matchNum++, status: 'scheduled', venue: tournament.venue });
          }
        }
      }
    } else if (tournament.format === 'group_knockout') {
      const groups = [...new Set(approvedTeams.map(t => t.group).filter(Boolean))];
      for (const group of groups) {
        const groupTeams = approvedTeams.filter(t => t.group === group);
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            newMatches.push({ tournament_id: tournament.id, team1_id: groupTeams[i].id, team1_name: groupTeams[i].team_name, team2_id: groupTeams[j].id, team2_name: groupTeams[j].team_name, stage: 'group', group: group, round: 1, match_number: matchNum++, status: 'scheduled', venue: tournament.venue });
          }
        }
      }
    } else if (tournament.format === 'knockout') {
      const shuffled = [...approvedTeams].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          newMatches.push({ tournament_id: tournament.id, team1_id: shuffled[i].id, team1_name: shuffled[i].team_name, team2_id: shuffled[i + 1].id, team2_name: shuffled[i + 1].team_name, stage: shuffled.length <= 4 ? 'semifinal' : 'quarterfinal', bracket_position: Math.floor(i / 2) + 1, match_number: matchNum++, status: 'scheduled', venue: tournament.venue });
        }
      }
    }
    for (const match of newMatches) { await api.entities.TournamentMatch.create(match); }
    queryClient.invalidateQueries({ queryKey: ['tournamentMatches'] });
    toast.success(`${newMatches.length} matches generated!`);
  };

  const openEditMatch = (match) => { setEditingMatch(match); setMatchData({ team1_id: match.team1_id, team2_id: match.team2_id, match_date: match.match_date ? match.match_date.split('T')[0] : '', venue: match.venue || '', stage: match.stage, group: match.group || 'A', round: match.round || 1 }); setShowAddMatch(true); };

  const filteredMatches = matches.filter(m => { if (activeTab === 'all') return true; if (activeTab === 'upcoming') return m.status === 'scheduled'; if (activeTab === 'live') return m.status === 'live'; if (activeTab === 'completed') return m.status === 'completed'; return true; }).sort((a, b) => (a.match_number || 0) - (b.match_number || 0));

  const stageLabels = { group: 'Group Stage', league: 'League', quarterfinal: 'Quarter Final', semifinal: 'Semi Final', third_place: '3rd Place', final: 'Final' };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All ({matches.length})</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
              <TabsTrigger value="live" className="text-xs sm:text-sm">Live</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">Done</TabsTrigger>
            </TabsList>
          </Tabs>
          {tournament.status !== 'completed' && (
            <div className="flex flex-wrap gap-2">
              {matches.length === 0 && approvedTeams.length >= 2 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowScheduler(true)} className="flex-1 sm:flex-none" title="Open advanced fixture scheduler">
                    <Wand2 className="w-4 h-4 mr-1.5" /><span>Auto Schedule</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={generateFixtures} className="flex-1 sm:flex-none" title="Quickly generate all fixtures without dates">
                    <Calendar className="w-4 h-4 mr-1.5" /><span>Quick Generate</span>
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => setShowAddMatch(true)} className="flex-1 sm:flex-none" title="Manually create a new match">
                <Plus className="w-4 h-4 mr-1.5" /><span>New Match</span>
              </Button>
            </div>
          )}
        </div>
        
        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-700">{conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected</span>
          </div>
        )}
      </div>

      {filteredMatches.length === 0 ? (
        <Card className="text-center py-12"><Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" /><h3 className="text-lg font-semibold text-slate-700">No Matches Yet</h3><p className="text-slate-500 mt-1">Create matches manually or auto-generate fixtures</p></Card>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => (
            <Card key={match.id} className={`overflow-hidden border border-stone-200 bg-white hover:shadow-md transition-shadow ${match.status === 'live' ? 'ring-2 ring-red-500' : ''} ${matchConflictIds.has(match.id) ? 'ring-2 ring-amber-400' : ''}`}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">Match #{match.match_number || '-'}</Badge>
                      <Badge className={`text-xs ${match.status === 'live' ? 'bg-red-500 animate-pulse' : match.status === 'completed' ? 'bg-emerald-600' : 'bg-stone-500'} text-white`}>{match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()}</Badge>
                      {match.stage && <Badge variant="outline" className="text-xs">{stageLabels[match.stage]} {match.group ? `(${match.group})` : ''}</Badge>}
                      {matchConflictIds.has(match.id) && <Badge className="bg-amber-500 text-white text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Conflict</Badge>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-stone-800">{match.team1_name}</p>
                        {match.team1_score && <p className="text-lg font-bold text-[#1e3a5f]">{match.team1_score}</p>}
                      </div>
                      <div className="text-center px-3">
                        <span className="text-stone-400 font-medium text-sm">vs</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-stone-800">{match.team2_name}</p>
                        {match.team2_score && <p className="text-lg font-bold text-[#1e3a5f]">{match.team2_score}</p>}
                      </div>
                    </div>
                    {match.result_summary && <p className="text-sm text-emerald-700 mt-2 text-center font-medium">{match.result_summary}</p>}
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-stone-500">
                      {match.match_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(match.match_date), 'dd MMM yyyy, HH:mm')}</span>}
                      {match.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.venue}</span>}
                      {match.man_of_match && <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500" />MoM: {match.man_of_match}</span>}
                    </div>
                  </div>
                  {tournament.status !== 'completed' && (
                    <div className="flex flex-col border-l border-stone-100 bg-stone-50">
                      {match.status === 'scheduled' && <Link to={createPageUrl('Scoring')} className="flex-1 flex items-center justify-center px-4 hover:bg-emerald-50 text-emerald-600" title="Start live scoring"><Play className="w-4 h-4" /></Link>}
                      <button onClick={() => openEditMatch(match)} className="flex-1 flex items-center justify-center px-4 hover:bg-stone-100 text-stone-500" title="Edit match details"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this match?')) deleteMatchMutation.mutate(match.id); }} className="flex-1 flex items-center justify-center px-4 hover:bg-red-50 text-red-500" title="Delete match"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddMatch} onOpenChange={resetForm}>
        <DialogContent className="max-w-md [&>button]:text-slate-500 [&>button]:hover:text-slate-700">
          <DialogHeader><DialogTitle>{editingMatch ? 'Edit Match' : 'Add New Match'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Team 1 *</Label><Select value={matchData.team1_id} onValueChange={(v) => setMatchData(p => ({ ...p, team1_id: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{approvedTeams.map(t => (<SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Team 2 *</Label><Select value={matchData.team2_id} onValueChange={(v) => setMatchData(p => ({ ...p, team2_id: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{approvedTeams.map(t => (<SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>))}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Stage</Label><Select value={matchData.stage} onValueChange={(v) => setMatchData(p => ({ ...p, stage: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="group">Group Stage</SelectItem><SelectItem value="league">League</SelectItem><SelectItem value="quarterfinal">Quarter Final</SelectItem><SelectItem value="semifinal">Semi Final</SelectItem><SelectItem value="third_place">3rd Place</SelectItem><SelectItem value="final">Final</SelectItem></SelectContent></Select></div>
              {matchData.stage === 'group' && <div><Label>Group</Label><Select value={matchData.group} onValueChange={(v) => setMatchData(p => ({ ...p, group: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{['A', 'B', 'C', 'D', 'E', 'F'].map(g => (<SelectItem key={g} value={g}>Group {g}</SelectItem>))}</SelectContent></Select></div>}
            </div>
            <div><Label>Match Date & Time</Label><Input type="datetime-local" value={matchData.match_date} onChange={(e) => setMatchData(p => ({ ...p, match_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Venue</Label><Input value={matchData.venue} onChange={(e) => setMatchData(p => ({ ...p, venue: e.target.value }))} placeholder="Match venue" className="mt-1" /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMatchMutation.isPending || updateMatchMutation.isPending} className="flex-1">{editingMatch ? 'Update' : 'Create'} Match</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Scheduler */}
      <FixtureScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        tournament={tournament}
        teams={teams}
        onGenerate={handleSchedulerGenerate}
      />
    </div>
  );
}