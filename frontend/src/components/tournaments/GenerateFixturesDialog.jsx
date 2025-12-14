import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/components/api/apiClient';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function GenerateFixturesDialog({ open, onClose, tournament, teams, onGenerated }) {
  const [startDate, setStartDate] = useState(tournament?.start_date || '');
  const [matchesPerDay, setMatchesPerDay] = useState(2);
  const [venue, setVenue] = useState(tournament?.venue || '');
  const [shuffleTeams, setShuffleTeams] = useState(true);
  const [homeAway, setHomeAway] = useState(false); // Double round robin

  // Calculate number of matches needed
  const matchCount = useMemo(() => {
    const n = teams.length;
    if (tournament?.format === 'knockout') {
      return n - 1; // n-1 matches for knockout
    } else if (tournament?.format === 'league' || tournament?.format === 'super_league') {
      return homeAway ? n * (n - 1) : (n * (n - 1)) / 2; // Round robin
    } else if (tournament?.format === 'group_knockout') {
      // Group stage matches + knockout
      const groups = tournament.num_groups || 2;
      const teamsPerGroup = Math.ceil(n / groups);
      const groupMatches = groups * (teamsPerGroup * (teamsPerGroup - 1)) / 2;
      const qualifyingTeams = groups * (tournament.teams_qualify_per_group || 2);
      const knockoutMatches = qualifyingTeams - 1;
      return groupMatches + knockoutMatches;
    }
    return 0;
  }, [teams, tournament, homeAway]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      let fixtures = [];
      let teamList = [...teams];
      
      // Shuffle teams if requested
      if (shuffleTeams) {
        teamList = teamList.sort(() => Math.random() - 0.5);
      }

      if (tournament.format === 'knockout') {
        fixtures = generateKnockoutFixtures(teamList);
      } else if (tournament.format === 'league' || tournament.format === 'super_league') {
        fixtures = generateRoundRobinFixtures(teamList, homeAway);
      } else if (tournament.format === 'group_knockout') {
        fixtures = generateGroupKnockoutFixtures(teamList);
      }

      // Assign dates and venues
      let currentDate = new Date(startDate);
      let matchesToday = 0;
      
      for (let i = 0; i < fixtures.length; i++) {
        fixtures[i].match_date = currentDate.toISOString();
        fixtures[i].venue = venue;
        fixtures[i].match_number = i + 1;
        
        matchesToday++;
        if (matchesToday >= matchesPerDay) {
          matchesToday = 0;
          currentDate = addDays(currentDate, 1);
        }
      }

      // Create fixtures in database
      for (const fixture of fixtures) {
        await api.entities.TournamentMatch.create({
          tournament_id: tournament.id,
          ...fixture,
        });
      }

      return fixtures;
    },
    onSuccess: (fixtures) => {
      toast.success(`Generated ${fixtures.length} fixtures`);
      onGenerated?.();
    },
    onError: () => toast.error('Failed to generate fixtures'),
  });

  // Generate round robin fixtures
  const generateRoundRobinFixtures = (teamList, doubleRound = false) => {
    const fixtures = [];
    const n = teamList.length;
    
    // Add a bye if odd number of teams
    const teams = n % 2 === 0 ? [...teamList] : [...teamList, { id: 'bye', team_name: 'BYE' }];
    const numTeams = teams.length;
    const rounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    for (let round = 0; round < rounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = match;
        const away = numTeams - 1 - match;
        
        // Rotate teams (keep first team fixed)
        const homeTeam = teams[round === 0 ? home : (home === 0 ? 0 : ((home + round - 1) % (numTeams - 1)) + 1)];
        const awayTeam = teams[away === 0 ? 0 : ((away + round - 1) % (numTeams - 1)) + 1];

        if (homeTeam.id !== 'bye' && awayTeam.id !== 'bye') {
          fixtures.push({
            team1_id: homeTeam.id,
            team1_name: homeTeam.team_name,
            team2_id: awayTeam.id,
            team2_name: awayTeam.team_name,
            stage: 'league',
            round: round + 1,
            status: 'scheduled',
          });
        }
      }
    }

    // Double round robin (home and away)
    if (doubleRound) {
      const reverseFixtures = fixtures.map(f => ({
        team1_id: f.team2_id,
        team1_name: f.team2_name,
        team2_id: f.team1_id,
        team2_name: f.team1_name,
        stage: 'league',
        round: f.round + rounds,
        status: 'scheduled',
      }));
      fixtures.push(...reverseFixtures);
    }

    return fixtures;
  };

  // Generate knockout fixtures
  const generateKnockoutFixtures = (teamList) => {
    const fixtures = [];
    const n = teamList.length;
    
    // Determine stage based on team count
    let stage = 'quarterfinal';
    if (n <= 2) stage = 'final';
    else if (n <= 4) stage = 'semifinal';
    else if (n <= 8) stage = 'quarterfinal';

    // First round matches
    for (let i = 0; i < Math.floor(n / 2); i++) {
      fixtures.push({
        team1_id: teamList[i * 2].id,
        team1_name: teamList[i * 2].team_name,
        team2_id: teamList[i * 2 + 1]?.id,
        team2_name: teamList[i * 2 + 1]?.team_name || 'BYE',
        stage: stage,
        bracket_position: i + 1,
        status: 'scheduled',
      });
    }

    // Add semifinal placeholders if quarterfinals
    if (stage === 'quarterfinal') {
      fixtures.push(
        { team1_name: 'Winner QF1', team2_name: 'Winner QF2', stage: 'semifinal', bracket_position: 1, status: 'scheduled' },
        { team1_name: 'Winner QF3', team2_name: 'Winner QF4', stage: 'semifinal', bracket_position: 2, status: 'scheduled' }
      );
    }

    // Add final and third place
    if (n >= 4) {
      fixtures.push({ team1_name: 'Winner SF1', team2_name: 'Winner SF2', stage: 'final', bracket_position: 1, status: 'scheduled' });
      fixtures.push({ team1_name: 'Loser SF1', team2_name: 'Loser SF2', stage: 'third_place', bracket_position: 1, status: 'scheduled' });
    } else if (n === 2) {
      fixtures[0].stage = 'final';
    }

    return fixtures;
  };

  // Generate group + knockout fixtures
  const generateGroupKnockoutFixtures = (teamList) => {
    const fixtures = [];
    const numGroups = tournament.num_groups || 2;
    const teamsPerGroup = Math.ceil(teamList.length / numGroups);

    // Assign teams to groups and update database
    const groups = {};
    const groupLetters = ['A', 'B', 'C', 'D'];
    
    teamList.forEach((team, idx) => {
      const groupLetter = groupLetters[idx % numGroups];
      if (!groups[groupLetter]) groups[groupLetter] = [];
      groups[groupLetter].push(team);
      
      // Update team's group in database
      api.entities.TournamentTeam.update(team.id, { group: groupLetter });
    });

    // Generate group stage fixtures
    Object.entries(groups).forEach(([groupLetter, groupTeams]) => {
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          fixtures.push({
            team1_id: groupTeams[i].id,
            team1_name: groupTeams[i].team_name,
            team2_id: groupTeams[j].id,
            team2_name: groupTeams[j].team_name,
            stage: 'group',
            group: groupLetter,
            status: 'scheduled',
          });
        }
      }
    });

    // Add knockout stage placeholders
    const qualifyingTeams = numGroups * (tournament.teams_qualify_per_group || 2);
    if (qualifyingTeams >= 4) {
      fixtures.push(
        { team1_name: 'A1', team2_name: 'B2', stage: 'semifinal', bracket_position: 1, status: 'scheduled' },
        { team1_name: 'B1', team2_name: 'A2', stage: 'semifinal', bracket_position: 2, status: 'scheduled' },
        { team1_name: 'Winner SF1', team2_name: 'Winner SF2', stage: 'final', bracket_position: 1, status: 'scheduled' },
        { team1_name: 'Loser SF1', team2_name: 'Loser SF2', stage: 'third_place', bracket_position: 1, status: 'scheduled' }
      );
    }

    return fixtures;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md [&>button]:hover:bg-slate-200" style={{ backgroundColor: colors.surface }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
            Generate Fixtures
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          {teams.length < 2 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">You need at least 2 teams to generate fixtures</span>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              <strong>{teams.length}</strong> teams • <strong>{matchCount}</strong> matches will be generated
            </p>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ borderColor: colors.border }}
            />
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Matches Per Day</Label>
            <Select value={String(matchesPerDay)} onValueChange={(v) => setMatchesPerDay(parseInt(v))}>
              <SelectTrigger style={{ borderColor: colors.border }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} match{n > 1 ? 'es' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ color: colors.textSecondary }}>Default Venue</Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., Central Ground"
              style={{ borderColor: colors.border }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label style={{ color: colors.textSecondary }}>Shuffle Teams</Label>
            <Switch checked={shuffleTeams} onCheckedChange={setShuffleTeams} />
          </div>

          {(tournament?.format === 'league' || tournament?.format === 'super_league') && (
            <div className="flex items-center justify-between">
              <div>
                <Label style={{ color: colors.textSecondary }}>Home & Away (Double Round Robin)</Label>
                <p className="text-xs" style={{ color: colors.textMuted }}>Each team plays others twice</p>
              </div>
              <Switch checked={homeAway} onCheckedChange={setHomeAway} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <Button variant="outline" onClick={onClose} className="flex-1" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            Cancel
          </Button>
          <Button 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending || teams.length < 2 || !startDate}
            className="flex-1"
            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
          >
            {generateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}