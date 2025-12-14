import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Wand2, AlertTriangle, Check, X, Plus, Trash2, Settings2 } from 'lucide-react';
import { format, addDays, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { toast } from 'sonner';

// Venue slot configuration
const DEFAULT_TIME_SLOTS = [
  { id: '1', startTime: '09:00', endTime: '12:00', label: 'Morning' },
  { id: '2', startTime: '13:00', endTime: '16:00', label: 'Afternoon' },
  { id: '3', startTime: '17:00', endTime: '20:00', label: 'Evening' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function FixtureScheduler({ open, onClose, tournament, teams, onGenerate }) {
  const [schedulingConfig, setSchedulingConfig] = useState({
    startDate: tournament.start_date || format(new Date(), 'yyyy-MM-dd'),
    endDate: tournament.end_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    matchesPerDay: 2,
    minDaysBetweenMatches: 1,
    venues: [{ id: '1', name: tournament.venue || 'Main Ground', slots: [...DEFAULT_TIME_SLOTS] }],
    availableDays: [0, 6], // Weekend by default
    avoidConsecutiveDays: true,
    balanceHomeAway: true,
  });

  const [generatedFixtures, setGeneratedFixtures] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [step, setStep] = useState('config'); // config, preview, conflicts
  const [showVenueEditor, setShowVenueEditor] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const approvedTeams = teams.filter(t => t.registration_status === 'approved');

  // Generate raw match pairings based on format
  const generateMatchPairings = () => {
    const pairings = [];
    
    if (tournament.format === 'league' || tournament.format === 'super_league') {
      const rounds = tournament.format === 'super_league' ? 2 : 1;
      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < approvedTeams.length; i++) {
          for (let j = i + 1; j < approvedTeams.length; j++) {
            const team1 = r === 0 ? approvedTeams[i] : approvedTeams[j];
            const team2 = r === 0 ? approvedTeams[j] : approvedTeams[i];
            pairings.push({
              team1_id: team1.id,
              team1_name: team1.team_name,
              team2_id: team2.id,
              team2_name: team2.team_name,
              stage: 'league',
              round: r + 1,
            });
          }
        }
      }
    } else if (tournament.format === 'group_knockout') {
      const groups = [...new Set(approvedTeams.map(t => t.group).filter(Boolean))];
      for (const group of groups) {
        const groupTeams = approvedTeams.filter(t => t.group === group);
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            pairings.push({
              team1_id: groupTeams[i].id,
              team1_name: groupTeams[i].team_name,
              team2_id: groupTeams[j].id,
              team2_name: groupTeams[j].team_name,
              stage: 'group',
              group: group,
              round: 1,
            });
          }
        }
      }
    } else if (tournament.format === 'knockout') {
      const shuffled = [...approvedTeams].sort(() => Math.random() - 0.5);
      const stage = shuffled.length <= 4 ? 'semifinal' : shuffled.length <= 8 ? 'quarterfinal' : 'round1';
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          pairings.push({
            team1_id: shuffled[i].id,
            team1_name: shuffled[i].team_name,
            team2_id: shuffled[i + 1].id,
            team2_name: shuffled[i + 1].team_name,
            stage: stage,
            bracket_position: Math.floor(i / 2) + 1,
          });
        }
      }
    }
    
    return pairings;
  };

  // Get available date-time slots
  const getAvailableSlots = () => {
    const slots = [];
    const start = parseISO(schedulingConfig.startDate);
    const end = parseISO(schedulingConfig.endDate);
    
    let current = start;
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (schedulingConfig.availableDays.includes(dayOfWeek)) {
        for (const venue of schedulingConfig.venues) {
          for (const timeSlot of venue.slots) {
            slots.push({
              date: format(current, 'yyyy-MM-dd'),
              venue: venue.name,
              venueId: venue.id,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              slotLabel: timeSlot.label,
            });
          }
        }
      }
      current = addDays(current, 1);
    }
    
    return slots;
  };

  // Check for conflicts
  const detectConflicts = (fixtures) => {
    const foundConflicts = [];
    
    // Team playing twice on same day
    const matchesByDate = {};
    fixtures.forEach((f, idx) => {
      const key = f.date;
      if (!matchesByDate[key]) matchesByDate[key] = [];
      matchesByDate[key].push({ ...f, idx });
    });

    Object.entries(matchesByDate).forEach(([date, matches]) => {
      const teamAppearances = {};
      matches.forEach(m => {
        [m.team1_name, m.team2_name].forEach(team => {
          if (teamAppearances[team]) {
            foundConflicts.push({
              type: 'same_day',
              message: `${team} has multiple matches on ${format(parseISO(date), 'dd MMM')}`,
              matches: [teamAppearances[team].idx, m.idx],
              severity: 'error',
            });
          } else {
            teamAppearances[team] = m;
          }
        });
      });
    });

    // Consecutive day matches
    if (schedulingConfig.avoidConsecutiveDays) {
      const sortedFixtures = [...fixtures].sort((a, b) => a.date.localeCompare(b.date));
      const teamLastMatch = {};
      
      sortedFixtures.forEach((f, idx) => {
        [f.team1_name, f.team2_name].forEach(team => {
          if (teamLastMatch[team]) {
            const lastDate = parseISO(teamLastMatch[team].date);
            const currentDate = parseISO(f.date);
            const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < schedulingConfig.minDaysBetweenMatches + 1) {
              foundConflicts.push({
                type: 'consecutive',
                message: `${team} has matches on consecutive days (${format(lastDate, 'dd MMM')} & ${format(currentDate, 'dd MMM')})`,
                matches: [teamLastMatch[team].idx, idx],
                severity: 'warning',
              });
            }
          }
          teamLastMatch[team] = { date: f.date, idx };
        });
      });
    }

    // Venue double-booking
    fixtures.forEach((f1, i) => {
      fixtures.forEach((f2, j) => {
        if (i < j && f1.date === f2.date && f1.venue === f2.venue && f1.startTime === f2.startTime) {
          foundConflicts.push({
            type: 'venue_clash',
            message: `Venue ${f1.venue} double-booked on ${format(parseISO(f1.date), 'dd MMM')} at ${f1.startTime}`,
            matches: [i, j],
            severity: 'error',
          });
        }
      });
    });

    return foundConflicts;
  };

  // Generate fixtures with scheduling
  const handleGenerate = () => {
    if (approvedTeams.length < 2) {
      toast.error('Need at least 2 teams to generate fixtures');
      return;
    }

    const pairings = generateMatchPairings();
    const slots = getAvailableSlots();

    if (slots.length < pairings.length) {
      toast.error(`Not enough available slots (${slots.length}) for ${pairings.length} matches. Adjust dates or add more time slots.`);
      return;
    }

    // Assign slots to matches
    const fixtures = pairings.map((pairing, idx) => {
      const slot = slots[idx];
      return {
        ...pairing,
        tournament_id: tournament.id,
        match_number: idx + 1,
        date: slot.date,
        match_date: `${slot.date}T${slot.startTime}`,
        venue: slot.venue,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'scheduled',
      };
    });

    setGeneratedFixtures(fixtures);
    setConflicts(detectConflicts(fixtures));
    setStep('preview');
  };

  // Handle fixture time/date edit
  const updateFixture = (index, field, value) => {
    const updated = [...generatedFixtures];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'date') {
      updated[index].match_date = `${value}T${updated[index].startTime}`;
    }
    setGeneratedFixtures(updated);
    setConflicts(detectConflicts(updated));
  };

  // Swap fixtures
  const swapFixtures = (idx1, idx2) => {
    const updated = [...generatedFixtures];
    const temp = { date: updated[idx1].date, startTime: updated[idx1].startTime, venue: updated[idx1].venue };
    updated[idx1] = { ...updated[idx1], date: updated[idx2].date, startTime: updated[idx2].startTime, venue: updated[idx2].venue };
    updated[idx2] = { ...updated[idx2], ...temp };
    updated[idx1].match_date = `${updated[idx1].date}T${updated[idx1].startTime}`;
    updated[idx2].match_date = `${updated[idx2].date}T${updated[idx2].startTime}`;
    setGeneratedFixtures(updated);
    setConflicts(detectConflicts(updated));
    toast.success('Fixtures swapped');
  };

  const handleConfirm = () => {
    const errors = conflicts.filter(c => c.severity === 'error');
    if (errors.length > 0) {
      toast.error(`Please resolve ${errors.length} scheduling errors first`);
      return;
    }
    onGenerate(generatedFixtures);
    onClose();
  };

  // Venue editor
  const addVenue = () => {
    setSchedulingConfig(prev => ({
      ...prev,
      venues: [...prev.venues, { id: String(Date.now()), name: 'New Venue', slots: [...DEFAULT_TIME_SLOTS] }]
    }));
  };

  const updateVenue = (id, field, value) => {
    setSchedulingConfig(prev => ({
      ...prev,
      venues: prev.venues.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const removeVenue = (id) => {
    if (schedulingConfig.venues.length <= 1) {
      toast.error('Need at least one venue');
      return;
    }
    setSchedulingConfig(prev => ({
      ...prev,
      venues: prev.venues.filter(v => v.id !== id)
    }));
  };

  const addTimeSlot = (venueId) => {
    setSchedulingConfig(prev => ({
      ...prev,
      venues: prev.venues.map(v => v.id === venueId ? {
        ...v,
        slots: [...v.slots, { id: String(Date.now()), startTime: '10:00', endTime: '13:00', label: 'New Slot' }]
      } : v)
    }));
  };

  const updateTimeSlot = (venueId, slotId, field, value) => {
    setSchedulingConfig(prev => ({
      ...prev,
      venues: prev.venues.map(v => v.id === venueId ? {
        ...v,
        slots: v.slots.map(s => s.id === slotId ? { ...s, [field]: value } : s)
      } : v)
    }));
  };

  const removeTimeSlot = (venueId, slotId) => {
    setSchedulingConfig(prev => ({
      ...prev,
      venues: prev.venues.map(v => v.id === venueId ? {
        ...v,
        slots: v.slots.filter(s => s.id !== slotId)
      } : v)
    }));
  };

  const toggleDay = (day) => {
    setSchedulingConfig(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day].sort((a, b) => a - b)
    }));
  };

  const totalMatches = useMemo(() => {
    if (tournament.format === 'league') return (approvedTeams.length * (approvedTeams.length - 1)) / 2;
    if (tournament.format === 'super_league') return approvedTeams.length * (approvedTeams.length - 1);
    if (tournament.format === 'knockout') return Math.floor(approvedTeams.length / 2);
    if (tournament.format === 'group_knockout') {
      const groups = [...new Set(approvedTeams.map(t => t.group).filter(Boolean))];
      return groups.reduce((sum, g) => {
        const n = approvedTeams.filter(t => t.group === g).length;
        return sum + (n * (n - 1)) / 2;
      }, 0);
    }
    return 0;
  }, [tournament.format, approvedTeams]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:text-slate-500 [&>button]:hover:text-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Advanced Fixture Scheduler
          </DialogTitle>
        </DialogHeader>

        <Tabs value={step} onValueChange={setStep}>
          <TabsList className="mb-4">
            <TabsTrigger value="config">1. Configuration</TabsTrigger>
            <TabsTrigger value="preview" disabled={generatedFixtures.length === 0}>2. Preview & Adjust</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            {/* Date Range */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" />Date Range</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={schedulingConfig.startDate} onChange={(e) => setSchedulingConfig(p => ({ ...p, startDate: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={schedulingConfig.endDate} onChange={(e) => setSchedulingConfig(p => ({ ...p, endDate: e.target.value }))} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            {/* Available Days */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Available Match Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      variant={schedulingConfig.availableDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Venues & Time Slots */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />Venues & Time Slots</span>
                  <Button size="sm" variant="outline" onClick={addVenue}><Plus className="w-4 h-4 mr-1" />Add Venue</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedulingConfig.venues.map(venue => (
                  <div key={venue.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={venue.name} onChange={(e) => updateVenue(venue.id, 'name', e.target.value)} className="flex-1" />
                      <Button size="icon" variant="ghost" onClick={() => removeVenue(venue.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-2">
                      {venue.slots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-2 text-sm">
                          <Input value={slot.label} onChange={(e) => updateTimeSlot(venue.id, slot.id, 'label', e.target.value)} className="w-24" placeholder="Label" />
                          <Input type="time" value={slot.startTime} onChange={(e) => updateTimeSlot(venue.id, slot.id, 'startTime', e.target.value)} className="w-28" />
                          <span className="text-slate-400">to</span>
                          <Input type="time" value={slot.endTime} onChange={(e) => updateTimeSlot(venue.id, slot.id, 'endTime', e.target.value)} className="w-28" />
                          <Button size="icon" variant="ghost" onClick={() => removeTimeSlot(venue.id, slot.id)} className="text-red-500 h-8 w-8"><X className="w-3 h-3" /></Button>
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => addTimeSlot(venue.id)}><Plus className="w-3 h-3 mr-1" />Add Slot</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Scheduling Options */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Settings2 className="w-4 h-4" />Scheduling Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">Minimum days between team matches</p><p className="text-sm text-slate-500">Rest period for teams</p></div>
                  <Select value={String(schedulingConfig.minDaysBetweenMatches)} onValueChange={(v) => setSchedulingConfig(p => ({ ...p, minDaysBetweenMatches: parseInt(v) }))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{[0, 1, 2, 3, 4, 5, 6, 7].map(n => <SelectItem key={n} value={String(n)}>{n} day{n !== 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">Avoid consecutive days</p><p className="text-sm text-slate-500">Warn if team plays back-to-back</p></div>
                  <Switch checked={schedulingConfig.avoidConsecutiveDays} onCheckedChange={(v) => setSchedulingConfig(p => ({ ...p, avoidConsecutiveDays: v }))} />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to generate {totalMatches} matches</p>
                <p className="text-sm text-slate-500">{approvedTeams.length} teams • {schedulingConfig.venues.length} venue(s) • {schedulingConfig.availableDays.length} day(s)/week</p>
              </div>
              <Button onClick={handleGenerate} disabled={approvedTeams.length < 2}>
                <Wand2 className="w-4 h-4 mr-2" />Generate Fixtures
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <Card className={`border-2 ${conflicts.some(c => c.severity === 'error') ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${conflicts.some(c => c.severity === 'error') ? 'text-red-500' : 'text-amber-500'}`} />
                    <p className="font-medium">{conflicts.length} Scheduling Issue{conflicts.length > 1 ? 's' : ''} Detected</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    {conflicts.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge className={c.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'}>{c.severity}</Badge>
                        <span>{c.message}</span>
                      </div>
                    ))}
                    {conflicts.length > 5 && <p className="text-slate-500">... and {conflicts.length - 5} more</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fixtures List */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Match</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">Venue</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedFixtures.map((fixture, idx) => {
                    const hasConflict = conflicts.some(c => c.matches.includes(idx));
                    const conflictSeverity = conflicts.find(c => c.matches.includes(idx))?.severity;
                    return (
                      <tr key={idx} className={`border-t ${hasConflict ? conflictSeverity === 'error' ? 'bg-red-50' : 'bg-amber-50' : ''}`}>
                        <td className="p-3">{fixture.match_number}</td>
                        <td className="p-3 font-medium">{fixture.team1_name} vs {fixture.team2_name}</td>
                        <td className="p-3">
                          <Input type="date" value={fixture.date} onChange={(e) => updateFixture(idx, 'date', e.target.value)} className="w-36 h-8 text-xs" />
                        </td>
                        <td className="p-3">
                          <Input type="time" value={fixture.startTime} onChange={(e) => updateFixture(idx, 'startTime', e.target.value)} className="w-24 h-8 text-xs" />
                        </td>
                        <td className="p-3">
                          <Select value={fixture.venue} onValueChange={(v) => updateFixture(idx, 'venue', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{schedulingConfig.venues.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-center">
                          {idx < generatedFixtures.length - 1 && (
                            <Button size="sm" variant="ghost" onClick={() => swapFixtures(idx, idx + 1)} className="text-xs">Swap ↓</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('config')}>← Back to Config</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerate}>Regenerate</Button>
                <Button onClick={handleConfirm} disabled={conflicts.some(c => c.severity === 'error')}>
                  <Check className="w-4 h-4 mr-2" />Confirm & Create Fixtures
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}