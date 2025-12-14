import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, FileText, CloudRain } from 'lucide-react';
import { toast } from 'sonner';
import { canViewAdmin } from '../components/RoleAccess';

// Scoring Components
import MatchSelector from '../components/scoring/MatchSelector';
import TossScreen from '../components/scoring/TossScreen';
import ScoringHeader from '../components/scoring/ScoringHeader';
import ScoreDisplay from '../components/scoring/ScoreDisplay';
import BatsmanCard from '../components/scoring/BatsmanCard';
import BowlerCard from '../components/scoring/BowlerCard';
import ThisOver from '../components/scoring/ThisOver';
import RunButtons from '../components/scoring/RunButtons';
import ExtrasButtons from '../components/scoring/ExtrasButtons';
import ActionButtons from '../components/scoring/ActionButtons';
import WicketDialog from '../components/scoring/WicketDialog';
import PlayerSelectDialog from '../components/scoring/PlayerSelectDialog';
import FullScorecard from '../components/scoring/FullScorecard';
import StreamOverlayDialog from '../components/scoring/StreamOverlayDialog';
import DLSDialog from '../components/scoring/DLSDialog';
import { getDLSSituation, parseOvers } from '../components/scoring/DLSCalculator';
import PartnershipCard from '../components/scoring/PartnershipCard';
import Last5Overs from '../components/scoring/Last5Overs';
import BoundaryAnimation from '../components/scoring/BoundaryAnimation';
import KeyboardShortcuts from '../components/scoring/KeyboardShortcuts';
import ConfirmDialog from '../components/scoring/ConfirmDialog';
import RequiredRunsPerOver from '../components/scoring/RequiredRunsPerOver';
import WagonWheel from '../components/scoring/WagonWheel';
import RunRateGraph from '../components/scoring/RunRateGraph';
import WicketAnimation from '../components/scoring/WicketAnimation';
import ShotDirectionPicker from '../components/scoring/ShotDirectionPicker';
import MatchSettingsDialog from '../components/scoring/MatchSettingsDialog';
import ProfileSelector from '../components/scoring/ProfileSelector';
import ExtraRunDialog from '../components/scoring/ExtraRunDialog';
import { syncPlayerStatsFromMatch } from '../components/scoring/SyncPlayerStats';

// Default ICC T20 settings
const DEFAULT_MATCH_SETTINGS = {
  balls_per_over: 6,
  wide_1st_runs: 1,
  wide_1st_legal: false,
  wide_2nd_runs: 1,
  wide_2nd_legal: false,
  wide_3rd_runs: 1,
  wide_3rd_legal: false,
  wide_4th_runs: 1,
  wide_4th_legal: false,
  wide_5th_runs: 1,
  wide_5th_legal: false,
  wide_6th_plus_runs: 1,
  wide_6th_plus_legal: false,
  noball_1st_runs: 1,
  noball_1st_legal: false,
  noball_2nd_runs: 1,
  noball_2nd_legal: false,
  noball_3rd_runs: 1,
  noball_3rd_legal: false,
  noball_4th_runs: 1,
  noball_4th_legal: false,
  noball_5th_runs: 1,
  noball_5th_legal: false,
  noball_6th_plus_runs: 1,
  noball_6th_plus_legal: false,
  free_hit_on_noball: true,
  free_hit_on_wide: false,
  retire_at_score: 0,
  retired_can_return: true,
  last_man_can_play: false,
  powerplay_overs: 6,
  max_overs_per_bowler: 4,
};

// Helper to reset all scoring state
const getInitialScoringState = () => ({
  tossData: null,
  selectedProfile: null, // Full profile object
  innings: 1,
  striker: '',
  nonStriker: '',
  bowler: '',
  isFreeHit: false,
  needNewBowler: false,
  matchSettings: { ...DEFAULT_MATCH_SETTINGS },
  matchProfileName: '',
  retiredBatsmen: [],
});

export default function Scoring() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Match selection - separate from scoring state
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [isReady, setIsReady] = useState(false); // Only true after data is loaded/cleared
  const [isClearing, setIsClearing] = useState(false);
  
  // Scoring state - all in one object for clean resets
  const [scoringState, setScoringState] = useState(getInitialScoringState());
  
  // Destructure for easy access
  const { tossData, selectedProfile, innings, striker, nonStriker, bowler, isFreeHit, needNewBowler, matchSettings, matchProfileName, retiredBatsmen } = scoringState;
  
  // UI State (dialogs, animations - these don't need to persist)
  const [showPlayerDialog, setShowPlayerDialog] = useState(null);
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showStreamOverlay, setShowStreamOverlay] = useState(false);
  const [showDLSDialog, setShowDLSDialog] = useState(false);
  const [showConfirmEndInnings, setShowConfirmEndInnings] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [boundaryAnimation, setBoundaryAnimation] = useState(null);
  const [wicketAnimation, setWicketAnimation] = useState(null);
  const [pendingBoundary, setPendingBoundary] = useState(null);
  const [showMatchSettings, setShowMatchSettings] = useState(false);
  const [showExtraDialog, setShowExtraDialog] = useState(null); // 'bye' | 'leg_bye' | 'wide' | 'no_ball' | null
  const [showMatchSummary, setShowMatchSummary] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Helper to update scoring state
  const updateScoringState = useCallback((updates) => {
    setScoringState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    let mounted = true;
    api.auth.me()
      .then(u => { if (mounted) setUser(u); })
      .catch((err) => {
        if (!mounted) return;
        if (err?.status === 401 || err?.status === 403) return api.auth.redirectToLogin();
        console.error('Scoring: failed to load current user', err);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Data Queries
  // Use TournamentMatch instead of Match
  const { data: matches = [] } = useQuery({
    queryKey: ['scoringMatches'],
    queryFn: () => api.entities.TournamentMatch.list('match_date', 200),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['scoringTeams'],
    queryFn: () => api.entities.Team.list('name', 100),
  });

  // Get selected match object from ID
  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return null;
    return matches.find(m => m.id === selectedMatchId) || null;
  }, [selectedMatchId, matches]);

  // Use team1_id/team2_id from TournamentMatch, or fall back to team name matching
  const homeTeamId = selectedMatch?.team1_id || 
    teams.find(t => t.name === selectedMatch?.team1_name || t.short_name === selectedMatch?.team1_name)?.id;
  const awayTeamId = selectedMatch?.team2_id || 
    teams.find(t => t.name === selectedMatch?.team2_name || t.short_name === selectedMatch?.team2_name)?.id;

  const { data: homeTeamPlayers = [] } = useQuery({
    queryKey: ['homeTeamPlayers', homeTeamId],
    queryFn: () => api.entities.TeamPlayer.filter({ team_id: homeTeamId }, 'player_name', 100),
    enabled: !!homeTeamId,
  });

  const { data: awayTeamPlayers = [] } = useQuery({
    queryKey: ['awayTeamPlayers', awayTeamId],
    queryFn: () => api.entities.TeamPlayer.filter({ team_id: awayTeamId }, 'player_name', 100),
    enabled: !!awayTeamId,
  });

  // CRITICAL: Only fetch balls when ready (after clearing is complete)
  const { data: balls = [], refetch: refetchBalls } = useQuery({
    queryKey: ['matchBalls', selectedMatchId],
    queryFn: async () => {
      if (!selectedMatchId) return [];
      const result = await api.entities.BallByBall.filter({ match_id: selectedMatchId }, 'created_date', 1000);
      return result || [];
    },
    enabled: !!selectedMatchId && isReady,
    refetchInterval: 3000,
  });

  // Saved match states
  const { data: savedStates = [], refetch: refetchStates } = useQuery({
    queryKey: ['matchStates'],
    queryFn: () => api.entities.MatchState.list('-updated_date', 100),
  });

  // Mutations
  const addBallMutation = useMutation({
    mutationFn: (data) => api.entities.BallByBall.create(data),
    onSuccess: (result) => {
      refetchBalls();
      // If this was a boundary scored off the bat (not extras), prompt for shot direction
      // Only show for runs = 4 or 6, NOT for byes/leg-byes/wides that happen to be 4 runs
      const isOffTheBat = result && (result.runs === 4 || result.runs === 6);
      if (isOffTheBat) {
        setPendingBoundary({ runs: result.runs, ballId: result.id });
      }
      // Auto-save state after each ball
      setTimeout(() => saveCurrentState(), 100);
    },
  });

  const updateBallMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.BallByBall.update(id, data),
    onSuccess: () => refetchBalls(),
  });

  // Match state mutations
  const saveMatchStateMutation = useMutation({
    mutationFn: async (stateData) => {
      const existing = savedStates.find(s => s.match_id === selectedMatch?.id);
      if (existing) {
        return api.entities.MatchState.update(existing.id, stateData);
      } else {
        return api.entities.MatchState.create(stateData);
      }
    },
    onSuccess: () => refetchStates(),
  });

  const deleteMatchStateMutation = useMutation({
    mutationFn: (id) => api.entities.MatchState.delete(id),
    onSuccess: () => refetchStates(),
  });

  const updateMatchMutation = useMutation({
    mutationFn: (data) => api.entities.TournamentMatch.update(selectedMatch.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoringMatches'] });
    },
  });

  // Auto-save match state after each ball
  const saveCurrentState = useCallback(() => {
    if (!selectedMatchId || !tossData) return;
    
    const stateData = {
      match_id: selectedMatchId,
      innings,
      striker,
      non_striker: nonStriker,
      bowler,
      toss_winner: tossData.tossWinner,
      toss_decision: tossData.tossDecision,
      batting_first: tossData.battingFirst,
      is_free_hit: isFreeHit,
      match_settings: JSON.stringify({ ...matchSettings, profileName: matchProfileName }),
    };
    
    saveMatchStateMutation.mutate(stateData);
  }, [selectedMatchId, tossData, innings, striker, nonStriker, bowler, isFreeHit, matchSettings, matchProfileName]);

  // Check if free hit should apply
  const shouldApplyFreeHit = useCallback(() => {
    if (matchSettings.lms_enabled) {
      return matchSettings.lms_free_hit !== false;
    }
    return matchSettings.free_hit_on_noball !== false;
  }, [matchSettings]);

  // Update match status to live when scoring starts (TournamentMatch uses lowercase)
  useEffect(() => {
    if (selectedMatch && tossData && selectedMatch.status !== 'live') {
      updateMatchMutation.mutate({ status: 'live' });
    }
  }, [selectedMatch?.id, tossData]);

  const deleteBallMutation = useMutation({
    mutationFn: (id) => api.entities.BallByBall.delete(id),
    onSuccess: () => {
      refetchBalls();
      toast.success('Ball undone');
      // Save state after undo
      setTimeout(() => saveCurrentState(), 100);
    },
  });

  // Derived Data
  // TournamentMatch uses team1/team2 instead of home/away
  // Try to find team by ID first, then fall back to name matching
  const homeTeam = teams.find(t => t.id === selectedMatch?.team1_id) || 
    teams.find(t => t.name === selectedMatch?.team1_name || t.short_name === selectedMatch?.team1_name);
  const awayTeam = teams.find(t => t.id === selectedMatch?.team2_id) ||
    teams.find(t => t.name === selectedMatch?.team2_name || t.short_name === selectedMatch?.team2_name);
  const homeTeamName = homeTeam?.short_name || homeTeam?.name || selectedMatch?.team1_name || 'Team 1';
  const awayTeamName = awayTeam?.short_name || awayTeam?.name || selectedMatch?.team2_name || 'Team 2';

  // Determine batting/bowling teams based on toss
  const getBattingTeam = (inn) => {
    if (!tossData) return 'home';
    if (inn === 1) return tossData.battingFirst;
    return tossData.battingFirst === 'home' ? 'away' : 'home';
  };

  const battingTeamKey = getBattingTeam(innings);
  const bowlingTeamKey = battingTeamKey === 'home' ? 'away' : 'home';
  
  const battingTeamName = battingTeamKey === 'home' ? homeTeamName : awayTeamName;
  const bowlingTeamName = bowlingTeamKey === 'home' ? homeTeamName : awayTeamName;
  
  const battingTeamPlayers = battingTeamKey === 'home' ? homeTeamPlayers : awayTeamPlayers;
  const bowlingTeamPlayers = bowlingTeamKey === 'home' ? homeTeamPlayers : awayTeamPlayers;

  // Filter balls for current innings - only for selected match
  const inningsBalls = useMemo(() => {
    if (!selectedMatchId || !isReady) return [];
    return balls
      .filter(b => b.innings === innings && b.match_id === selectedMatchId)
      .sort((a, b) => {
        if (a.over_number !== b.over_number) return a.over_number - b.over_number;
        return a.ball_number - b.ball_number;
      });
  }, [balls, innings, selectedMatchId, isReady]);

  // Get balls per over from settings (default 6)
  const ballsPerOver = matchSettings.balls_per_over || 6;

  // Count occurrences of wide/no-ball in current innings
  const getExtraCount = useCallback((type) => {
    return inningsBalls.filter(b => b.extra_type === type).length + 1; // +1 for current
  }, [inningsBalls]);

  // Get effective extra runs based on settings and occurrence count
  const getExtraRuns = useCallback((type) => {
    const count = getExtraCount(type);
    const prefix = type === 'wide' ? 'wide' : 'noball';
    
    // Get runs based on occurrence (1st, 2nd, 3rd, 4th, 5th, 6th+)
    let runsKey;
    if (count === 1) runsKey = `${prefix}_1st_runs`;
    else if (count === 2) runsKey = `${prefix}_2nd_runs`;
    else if (count === 3) runsKey = `${prefix}_3rd_runs`;
    else if (count === 4) runsKey = `${prefix}_4th_runs`;
    else if (count === 5) runsKey = `${prefix}_5th_runs`;
    else runsKey = `${prefix}_6th_plus_runs`;
    
    return matchSettings[runsKey] ?? 1;
  }, [matchSettings, getExtraCount]);

  // Check if extra should count as legal ball
  const isExtraLegal = useCallback((type) => {
    const count = getExtraCount(type);
    const prefix = type === 'wide' ? 'wide' : 'noball';
    
    let legalKey;
    if (count === 1) legalKey = `${prefix}_1st_legal`;
    else if (count === 2) legalKey = `${prefix}_2nd_legal`;
    else if (count === 3) legalKey = `${prefix}_3rd_legal`;
    else if (count === 4) legalKey = `${prefix}_4th_legal`;
    else if (count === 5) legalKey = `${prefix}_5th_legal`;
    else legalKey = `${prefix}_6th_plus_legal`;
    
    return matchSettings[legalKey] ?? false;
  }, [matchSettings, getExtraCount]);

  // Calculate legal balls (for over counting) - considering profile settings for legal extras
  const legalBalls = inningsBalls.filter(b => {
    if (!b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye') return true;
    // Check if wide/no-ball should count as legal based on profile settings
    if (b.extra_type === 'wide' || b.extra_type === 'no_ball') {
      // This would need the occurrence count, handled in recordBall
      return b.is_legal_delivery || false;
    }
    return false;
  });
  
  const completedOvers = Math.floor(legalBalls.length / ballsPerOver);
  const ballsInCurrentOver = legalBalls.length % ballsPerOver;
  const currentOverNumber = completedOvers + 1;
  // Use profile's total_overs if available, otherwise fall back to match overs
const maxOvers = matchSettings.total_overs || selectedMatch?.overs || 20;

  // Current over balls for display
  const currentOverBalls = inningsBalls.filter(b => b.over_number === currentOverNumber);

  // Score calculations
  const totalRuns = inningsBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
  const totalWickets = inningsBalls.filter(b => b.is_wicket).length;
  const runRate = legalBalls.length > 0 ? (totalRuns / (legalBalls.length / ballsPerOver)) : 0;

  // 2nd innings calculations - only for current match
  const innings1Balls = useMemo(() => {
    if (!selectedMatchId || !isReady) return [];
    return balls.filter(b => b.innings === 1 && b.match_id === selectedMatchId);
  }, [balls, selectedMatchId, isReady]);
  const innings1Total = innings1Balls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
  const innings1LegalBalls = innings1Balls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
  const innings1Overs = Math.floor(innings1LegalBalls.length / ballsPerOver) + (innings1LegalBalls.length % ballsPerOver) / (ballsPerOver <= 6 ? 10 : ballsPerOver);
  
  // DLS calculations
  const isDLSAffected = selectedMatch?.is_dls_affected || false;
  const dlsTarget = selectedMatch?.dls_target;
  const target = innings === 2 ? (dlsTarget || innings1Total + 1) : null;
  const runsNeeded = target ? target - totalRuns : null;
  const ballsRemaining = maxOvers * ballsPerOver - legalBalls.length;
  const requiredRunRate = runsNeeded && ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / ballsPerOver)) : null;

  // DLS par score calculation
  const dlsSituation = innings === 2 && innings1Total > 0 ? getDLSSituation({
    team1Score: innings1Total,
    team1Overs: innings1Overs || maxOvers,
    team2Score: totalRuns,
    team2OversUsed: completedOvers + ballsInCurrentOver / ballsPerOver,
    team2WicketsLost: totalWickets,
    team2TotalOvers: selectedMatch?.dls_team2_overs || maxOvers,
    isReduced: isDLSAffected,
    revisedTarget: dlsTarget
  }) : null;

  // Batsman stats helper - matches by name OR id for reliability
  const getBatsmanStats = useCallback((nameOrId) => {
    const batBalls = inningsBalls.filter(b => 
      b.batsman_id === nameOrId || 
      b.batsman_name === nameOrId || 
      b.batsman === nameOrId
    );
    const runs = batBalls.reduce((sum, b) => sum + (b.runs || 0), 0);
    const faced = batBalls.filter(b => b.extra_type !== 'wide').length;
    const fours = batBalls.filter(b => b.is_four).length;
    const sixes = batBalls.filter(b => b.is_six).length;
    return { runs, balls: faced, fours, sixes };
  }, [inningsBalls]);

  // Bowler stats helper
      const getBowlerStats = useCallback((name) => {
        const bowlBalls = inningsBalls.filter(b => b.bowler === name);
        const legal = bowlBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
        const overs = Math.floor(legal.length / ballsPerOver);
        const remainder = legal.length % ballsPerOver;

        const runs = bowlBalls.reduce((sum, b) => {
          let r = b.runs || 0;
          if (b.extra_type === 'wide' || b.extra_type === 'no_ball') r += b.extras || 0;
          return sum + r;
        }, 0);

        const wickets = bowlBalls.filter(b => b.is_wicket && b.wicket_type !== 'run_out').length;
        const dotBalls = bowlBalls.filter(b => (b.runs || 0) === 0 && !b.extras && !b.is_wicket).length;
        const maidens = 0; // Calculate later

        return { overs: `${overs}.${remainder}`, runs, wickets, maidens, dotBalls };
      }, [inningsBalls, ballsPerOver]);

  // Get all bowler stats for bowler selection dialog
  const getAllBowlerStats = useCallback(() => {
    const stats = {};
    const bowlers = [...new Set(inningsBalls.map(b => b.bowler).filter(Boolean))];
    bowlers.forEach(name => {
      stats[name] = getBowlerStats(name);
    });
    return stats;
  }, [inningsBalls, getBowlerStats]);

  // Get the bowler who bowled the last completed over
  const getLastOverBowler = useCallback(() => {
    if (completedOvers === 0) return '';
    // Find balls from the previous over
    const previousOverBalls = inningsBalls.filter(b => b.over_number === completedOvers);
    if (previousOverBalls.length > 0) {
      return previousOverBalls[0].bowler || '';
    }
    return '';
  }, [inningsBalls, completedOvers]);

      // Partnership calculation
      const getPartnershipStats = useCallback(() => {
        if (!striker || !nonStriker) return null;

        // Find last wicket index
        const lastWicketIdx = inningsBalls.reduce((lastIdx, ball, idx) => 
          ball.is_wicket ? idx : lastIdx, -1);

        // Get balls since last wicket
        const partnershipBalls = inningsBalls.slice(lastWicketIdx + 1);

        const runs = partnershipBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
        const balls = partnershipBalls.filter(b => b.extra_type !== 'wide').length;

        const batsman1Runs = partnershipBalls
          .filter(b => b.batsman === striker)
          .reduce((sum, b) => sum + (b.runs || 0), 0);
        const batsman2Runs = partnershipBalls
          .filter(b => b.batsman === nonStriker)
          .reduce((sum, b) => sum + (b.runs || 0), 0);

        return { runs, balls, batsman1Runs, batsman2Runs };
      }, [inningsBalls, striker, nonStriker]);

  // Record a ball
      const recordBall = (runs, extras = 0, extraType = '', wicketData = null, isLegalDelivery = null) => {
        if (!striker || !nonStriker || !bowler) {
          toast.error('Please select all players first');
          return;
        }

        // Free hit validation
        if (isFreeHit && wicketData && wicketData.type !== 'run_out') {
          toast.error('Only run out allowed on free hit!');
          return;
        }

        // Build display value
        let displayValue = '';
        if (wicketData) {
          displayValue = 'W';
        } else if (extraType === 'wide') {
          displayValue = extras > 1 ? `${extras}Wd` : 'Wd';
        } else if (extraType === 'no_ball') {
          const total = runs + extras;
          displayValue = total > 1 ? `${total}Nb` : 'Nb';
        } else if (extraType === 'bye') {
          displayValue = `${extras}B`;
        } else if (extraType === 'leg_bye') {
          displayValue = `${extras}Lb`;
        } else {
          displayValue = String(runs);
        }

        // Find player IDs
        const strikerPlayer = battingTeamPlayers.find(p => p.player_name === striker);
        const nonStrikerPlayer = battingTeamPlayers.find(p => p.player_name === nonStriker);
        const bowlerPlayer = bowlingTeamPlayers.find(p => p.player_name === bowler);
        const fielderPlayer = wicketData?.fielder ? bowlingTeamPlayers.find(p => p.player_name === wicketData.fielder) : null;
        const dismissedPlayer = wicketData?.dismissedBatsman ? battingTeamPlayers.find(p => p.player_name === wicketData.dismissedBatsman) : null;

        const ballData = {
          match_id: selectedMatchId,
          innings: innings,
          over_number: currentOverNumber,
          ball_number: ballsInCurrentOver + 1,
          // Names (legacy)
          batsman: striker,
          non_striker: nonStriker,
          bowler: bowler,
          // IDs for stats lookup
          batsman_id: strikerPlayer?.id || null,
          batsman_name: striker,
          non_striker_id: nonStrikerPlayer?.id || null,
          non_striker_name: nonStriker,
          bowler_id: bowlerPlayer?.id || null,
          bowler_name: bowler,
          runs: runs,
          extras: extras,
          extra_type: extraType,
          is_wicket: !!wicketData,
          wicket_type: wicketData?.type || '',
          dismissed_batsman: wicketData?.dismissedBatsman || '',
          dismissed_batsman_id: dismissedPlayer?.id || null,
          dismissed_batsman_name: wicketData?.dismissedBatsman || '',
          fielder: wicketData?.fielder || '',
          fielder_id: fielderPlayer?.id || null,
          fielder_name: wicketData?.fielder || '',
          is_four: runs === 4 || (extraType === 'bye' || extraType === 'leg_bye' || extraType === 'wide') && extras === 4,
          is_six: runs === 6 || (extraType === 'wide') && extras >= 6,
          is_free_hit: isFreeHit,
          display_value: displayValue,
          is_legal_delivery: isLegalDelivery,
        };

        addBallMutation.mutate(ballData);

        // Show boundary animation for 4s and 6s
        if (runs === 4 || runs === 6) {
          setBoundaryAnimation(runs);
        }

    // Handle free hit - only update if needed, preserve other state
    if (extraType === 'no_ball' && shouldApplyFreeHit()) {
      setScoringState(prev => ({ ...prev, isFreeHit: true }));
      toast.info('🔴 FREE HIT next ball!', { duration: 3000 });
    } else if (extraType !== 'wide' && extraType !== 'no_ball') {
      // Only reset free hit on legal deliveries (not extras)
      setScoringState(prev => ({ ...prev, isFreeHit: false }));
    }

    // Check LMS retire rule after ball
    if (matchSettings.lms_enabled && matchSettings.lms_retire_at > 0) {
      setTimeout(() => {
        const strikerStats = getBatsmanStats(striker);
        if (strikerStats.runs >= matchSettings.lms_retire_at && !wicketData) {
          toast.warning(`${striker} has reached ${matchSettings.lms_retire_at} runs - must retire!`, { duration: 4000 });
          updateScoringState({ retiredBatsmen: [...retiredBatsmen, striker], striker: '' });
        }
      }, 500);
    }

    // Check over completion first - use ballsPerOver from settings
    const isLegalBall = !extraType || extraType === 'bye' || extraType === 'leg_bye' || 
      ((extraType === 'wide' || extraType === 'no_ball') && isExtraLegal(extraType));
    const isOverComplete = isLegalBall && ballsInCurrentOver + 1 === ballsPerOver;

    // Batsmen rotation logic
    let runsForRotation = 0;
    if (extraType === 'wide') {
      runsForRotation = extras > 1 ? extras - 1 : 0;
    } else if (extraType === 'no_ball') {
      runsForRotation = runs;
    } else if (extraType === 'bye' || extraType === 'leg_bye') {
      runsForRotation = extras;
    } else {
      runsForRotation = runs;
    }

    // Add runs from wicket (e.g., completed runs before run out)
    if (wicketData?.runsBeforeWicket) {
      runsForRotation += wicketData.runsBeforeWicket;
    }

    // Calculate net rotations: odd runs = 1 swap, over complete = 1 swap
    // If both happen, they cancel out (no swap needed)
    const shouldSwapForRuns = runsForRotation % 2 === 1;
    const shouldSwapForOver = isOverComplete;
    const netSwap = shouldSwapForRuns !== shouldSwapForOver; // XOR - swap only if one but not both

    // Only clear bowler and swap batsmen on over complete for LEGAL balls
    if (isOverComplete) {
      if (netSwap) {
        setScoringState(prev => ({ ...prev, striker: prev.nonStriker, nonStriker: prev.striker, bowler: '', needNewBowler: true }));
      } else {
        setScoringState(prev => ({ ...prev, bowler: '', needNewBowler: true }));
      }
      toast.info('Over complete! Select new bowler');
    } else if (shouldSwapForRuns) {
      // Only swap for runs, don't touch bowler
      setScoringState(prev => ({ ...prev, striker: prev.nonStriker, nonStriker: prev.striker }));
    }

    // Handle wicket - need new batsman
    if (wicketData) {
      // Show wicket animation
      setWicketAnimation({
        wicketType: wicketData.type,
        dismissedBatsman: wicketData.dismissedBatsman || striker,
        bowler: bowler,
      });

      if (wicketData.dismissedBatsman === nonStriker) {
        setScoringState(prev => ({ ...prev, nonStriker: '', isFreeHit: false }));
      } else {
        setScoringState(prev => ({ ...prev, striker: '', isFreeHit: false }));
      }
      
      // Check all out
      if (totalWickets + 1 >= 10) {
        toast.success('All out! Innings complete');
      }
    }

    // Check innings completion
    if (isLegalBall && legalBalls.length + 1 >= maxOvers * ballsPerOver) {
      toast.success('Innings complete!');
    }
  };

  // Handle run button click
  const handleRun = (runs) => {
    recordBall(runs);
  };

  // Handle extras with settings-aware runs
  const handleExtra = (type, additionalRuns, runsOffBat = 0) => {
    const baseExtras = getExtraRuns(type);
    const isLegal = isExtraLegal(type);
    
    if (type === 'wide') {
      // Wide: base extra runs + additional byes
      recordBall(0, baseExtras + additionalRuns, type, null, isLegal);
    } else if (type === 'no_ball') {
      // No ball: base extra runs + runs off bat (runs off bat go to batsman)
      recordBall(runsOffBat, baseExtras, type, null, isLegal);
    } else {
      // Bye/Leg bye: just the runs
      recordBall(0, additionalRuns, type, null, true);
    }
  };

  // Handle wicket
  const handleWicket = (wicketData) => {
    recordBall(wicketData.runsBeforeWicket || 0, 0, '', wicketData);
  };

  // Swap batsmen
  const swapBatsmen = () => {
    updateScoringState({ striker: nonStriker, nonStriker: striker });
  };

  // Undo last ball - restore state properly
  const undoLastBall = () => {
    if (inningsBalls.length > 0) {
      const lastBall = inningsBalls[inningsBalls.length - 1];
      
      // The lastBall stores who was batting WHEN the ball was bowled
      // We need to restore to that exact state
      let restoredStriker = lastBall.batsman_name || lastBall.batsman;
      let restoredNonStriker = lastBall.non_striker_name || lastBall.non_striker;
      
      // Restore free hit state - check if the ball BEFORE the last one was a no-ball
      let restoredFreeHit = false;
      if (inningsBalls.length > 1) {
        const previousBall = inningsBalls[inningsBalls.length - 2];
        restoredFreeHit = previousBall.extra_type === 'no_ball' && shouldApplyFreeHit();
      }
      
      // Check if we need to restore bowler (if over was just completed after this ball)
      const legalBallsCount = inningsBalls.filter(b => 
        !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery
      ).length;
      const wasLastBallLegal = !lastBall.extra_type || lastBall.extra_type === 'bye' || lastBall.extra_type === 'leg_bye' || lastBall.is_legal_delivery;
      const wasOverJustCompleted = wasLastBallLegal && legalBallsCount % ballsPerOver === 0 && legalBallsCount > 0;
      
      const updates = {
        striker: restoredStriker,
        nonStriker: restoredNonStriker,
        isFreeHit: restoredFreeHit,
      };
      
      // If over was just completed by this ball, restore the bowler
      if (wasOverJustCompleted) {
        updates.bowler = lastBall.bowler_name || lastBall.bowler;
        updates.needNewBowler = false;
      }
      
      updateScoringState(updates);
      deleteBallMutation.mutate(lastBall.id);
    }
  };

  // End innings
      const endInnings = () => {
        setShowConfirmEndInnings(true);
      };

      const confirmEndInnings = async () => {
        setShowConfirmEndInnings(false);
        if (innings === 1) {
          updateScoringState({ innings: 2, striker: '', nonStriker: '', bowler: '', isFreeHit: false, needNewBowler: false });
          toast.success(`1st Innings: ${totalRuns}/${totalWickets}. Target: ${totalRuns + 1}`);
        } else {
          // Mark match as completed - using TournamentMatch fields
          const battingFirstTeam = tossData?.battingFirst === 'home' ? homeTeamName : awayTeamName;
          const battingSecondTeam = tossData?.battingFirst === 'home' ? awayTeamName : homeTeamName;
          const inn1Wickets = innings1Balls.filter(b => b.is_wicket).length;

          let winnerName = '';
          let resultSummary = '';

          if (totalRuns > innings1Total) {
            winnerName = battingSecondTeam;
            resultSummary = `${battingSecondTeam} won by ${10 - totalWickets} wicket${10 - totalWickets !== 1 ? 's' : ''}`;
          } else if (totalRuns < innings1Total) {
            winnerName = battingFirstTeam;
            resultSummary = `${battingFirstTeam} won by ${innings1Total - totalRuns} run${innings1Total - totalRuns !== 1 ? 's' : ''}`;
          } else {
            resultSummary = 'Match Tied';
          }

          // TournamentMatch schema fields
          await updateMatchMutation.mutateAsync({
            status: 'completed',
            winner_name: winnerName,
            winner_id: winnerName === homeTeamName ? selectedMatch?.team1_id : selectedMatch?.team2_id,
            result_summary: resultSummary,
            team1_score: tossData?.battingFirst === 'home' ? `${innings1Total}/${inn1Wickets}` : `${totalRuns}/${totalWickets}`,
            team2_score: tossData?.battingFirst === 'home' ? `${totalRuns}/${totalWickets}` : `${innings1Total}/${inn1Wickets}`,
          });

          // Sync player stats to TournamentPlayer and TeamPlayer
          await syncPlayerStatsFromMatch(selectedMatch.id, selectedMatch.tournament_id);
          toast.success('Player stats synced!');

          // Show match summary
          setShowMatchSummary(true);
        }
      };

  // Retired hurt
  const retiredHurt = () => {
    if (striker) {
      updateScoringState({ retiredBatsmen: [...retiredBatsmen, striker], striker: '' });
    }
    setShowPlayerDialog('striker');
  };

  // Abandon match - TournamentMatch uses 'cancelled'
  const abandonMatch = () => {
    updateMatchMutation.mutate({ status: 'cancelled' });
    toast.success('Match marked as cancelled');
    resetMatch();
  };

  // Resume match from saved state
  const resumeMatch = (match, state) => {
    setSelectedMatchId(match.id);
    setIsReady(true);
    let parsedSettings = { ...DEFAULT_MATCH_SETTINGS };
    let profileName = 'ICC T20';
    if (state.match_settings) {
      try {
        parsedSettings = JSON.parse(state.match_settings);
        profileName = parsedSettings.profileName || 'ICC T20';
      } catch (e) {}
    }
    updateScoringState({
      tossData: {
        tossWinner: state.toss_winner,
        tossDecision: state.toss_decision,
        battingFirst: state.batting_first,
      },
      selectedProfile: { name: profileName }, // Skip profile selection
      innings: state.innings || 1,
      striker: state.striker || '',
      nonStriker: state.non_striker || '',
      bowler: state.bowler || '',
      isFreeHit: state.is_free_hit || false,
      matchSettings: parsedSettings,
      matchProfileName: profileName,
    });
    toast.success('Match resumed');
  };

  // Reset match - go back to match selection
  const resetMatch = () => {
    setSelectedMatchId(null);
    setIsReady(false);
    setScoringState(getInitialScoringState());
  };

  // Confirm reset from dialog
  const confirmResetMatch = () => {
    setShowConfirmReset(false);
    resetMatch();
  };

  // Player selection handler
  const handlePlayerSelect = (name) => {
    if (showPlayerDialog === 'striker') {
      updateScoringState({ striker: name });
    } else if (showPlayerDialog === 'nonStriker') {
      updateScoringState({ nonStriker: name });
    } else if (showPlayerDialog === 'bowler') {
      updateScoringState({ bowler: name, needNewBowler: false });
    }
    setShowPlayerDialog(null);
  };

  // Get excluded players for selection
  const getExcludedPlayers = () => {
    const excluded = [];
    if (showPlayerDialog === 'striker' && nonStriker) excluded.push(nonStriker);
    if (showPlayerDialog === 'nonStriker' && striker) excluded.push(striker);
    // Add dismissed batsmen - check both name fields
    const dismissedBatsmen = inningsBalls
      .filter(b => b.is_wicket)
      .map(b => b.dismissed_batsman_name || b.dismissed_batsman || b.batsman_name || b.batsman)
      .filter(Boolean);
    // Add retired batsmen (unless LMS allows return)
    const retiredExclusions = matchSettings.lms_retire_can_return ? [] : retiredBatsmen;
    return [...excluded, ...dismissedBatsmen, ...retiredExclusions];
  };

  // Loading state
  if (loading || isClearing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
          {isClearing && <p className="text-slate-400 text-sm">Clearing previous match data...</p>}
        </div>
      </div>
    );
  }

  // Auth check
  if (!user || !canViewAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 pt-20">
        <Card className="max-w-md bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only admins can access live scoring.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Delete all balls for a match
  const clearMatchBalls = async (matchId) => {
    // Fetch balls directly from API to ensure we get all balls for this match
    const matchBalls = await api.entities.BallByBall.filter({ match_id: matchId }, 'created_date', 5000);
    for (const ball of matchBalls) {
      await api.entities.BallByBall.delete(ball.id);
    }
    // Also delete saved state
    const matchState = await api.entities.MatchState.filter({ match_id: matchId }, 'created_date', 50);
    for (const state of matchState) {
      await api.entities.MatchState.delete(state.id);
    }
    // Also delete innings scores
    const inningsScores = await api.entities.InningsScore.filter({ match_id: matchId }, 'created_date', 50);
    for (const score of inningsScores) {
      await api.entities.InningsScore.delete(score.id);
    }
  };

  // Reset state when selecting a new match
  const handleSelectMatch = async (match, startFresh = false) => {
    // Clear all local state first
    setScoringState(getInitialScoringState());
    setIsReady(false);
    
    // ALWAYS clear balls when starting a new match (not resuming)
    // This ensures we don't show old data from previous sessions
    setIsClearing(true);
    
    // Remove cached data first
    queryClient.removeQueries({ queryKey: ['matchBalls', match.id] });
    
    if (startFresh) {
      toast.info('Clearing previous match data...');
      await clearMatchBalls(match.id);
      queryClient.removeQueries({ queryKey: ['matchStates'] });
      await refetchStates();
    }
    
    setIsClearing(false);
    setIsReady(true);
    
    // Set selected match
    setSelectedMatchId(match.id);
  };

  // Match Selection Screen - show with normal layout
          if (!selectedMatch) {
            return (
              <div className="pt-20 lg:pt-4">
              <MatchSelector 
                matches={matches} 
                onSelect={handleSelectMatch}
                onTeamCreated={() => queryClient.invalidateQueries({ queryKey: ['scoringTeams'] })}
                savedStates={savedStates}
                onResume={resumeMatch}
              />
              </div>
            );
          }

  // Profile Selection Screen - BEFORE toss
  if (!selectedProfile) {
    return (
      <div className="pt-20 lg:pt-4">
        <ProfileSelector
          onSelect={(profile) => {
            // Build match settings from profile
            const settings = {
              total_overs: profile.total_overs || 20,
              balls_per_over: profile.balls_per_over || 6,
              wide_1st_runs: profile.wide_1st_runs ?? 1,
              wide_1st_legal: profile.wide_1st_legal ?? false,
              wide_2nd_runs: profile.wide_2nd_runs ?? 1,
              wide_2nd_legal: profile.wide_2nd_legal ?? false,
              wide_3rd_runs: profile.wide_3rd_runs ?? 1,
              wide_3rd_legal: profile.wide_3rd_legal ?? false,
              wide_4th_runs: profile.wide_4th_runs ?? 1,
              wide_4th_legal: profile.wide_4th_legal ?? false,
              wide_5th_runs: profile.wide_5th_runs ?? 1,
              wide_5th_legal: profile.wide_5th_legal ?? false,
              wide_6th_plus_runs: profile.wide_6th_plus_runs ?? 1,
              wide_6th_plus_legal: profile.wide_6th_plus_legal ?? false,
              noball_1st_runs: profile.noball_1st_runs ?? 1,
              noball_1st_legal: profile.noball_1st_legal ?? false,
              noball_2nd_runs: profile.noball_2nd_runs ?? 1,
              noball_2nd_legal: profile.noball_2nd_legal ?? false,
              noball_3rd_runs: profile.noball_3rd_runs ?? 1,
              noball_3rd_legal: profile.noball_3rd_legal ?? false,
              noball_4th_runs: profile.noball_4th_runs ?? 1,
              noball_4th_legal: profile.noball_4th_legal ?? false,
              noball_5th_runs: profile.noball_5th_runs ?? 1,
              noball_5th_legal: profile.noball_5th_legal ?? false,
              noball_6th_plus_runs: profile.noball_6th_plus_runs ?? 1,
              noball_6th_plus_legal: profile.noball_6th_plus_legal ?? false,
              free_hit_on_noball: profile.free_hit_on_noball ?? true,
              free_hit_on_wide: profile.free_hit_on_wide ?? false,
              retire_at_score: profile.retire_at_score ?? 0,
              retired_can_return: profile.retired_can_return ?? true,
              last_man_can_play: profile.last_man_can_play ?? false,
              powerplay_overs: profile.powerplay_overs ?? 6,
              max_overs_per_bowler: profile.max_overs_per_bowler ?? 4,
            };
            updateScoringState({ 
              selectedProfile: profile,
              matchSettings: settings,
              matchProfileName: profile.name,
            });
          }}
          onBack={() => {
            setSelectedMatchId(null);
            setIsReady(false);
          }}
        />
      </div>
    );
  }

  // Toss Screen - show with normal layout
  if (!tossData) {
    return (
      <div className="pt-20 lg:pt-4">
      <TossScreen
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        onComplete={(data) => updateScoringState({ 
          tossData: { tossWinner: data.tossWinner, tossDecision: data.tossDecision, battingFirst: data.battingFirst },
        })}
        onBack={() => {
          updateScoringState({ selectedProfile: null, matchSettings: { ...DEFAULT_MATCH_SETTINGS }, matchProfileName: '' });
        }}
      />
      </div>
    );
  }

  // Main Scoring Interface - HIDE header/footer for full screen
      const strikerStats = striker ? getBatsmanStats(striker) : null;
      const nonStrikerStats = nonStriker ? getBatsmanStats(nonStriker) : null;
      const bowlerStats = bowler ? getBowlerStats(bowler) : null;
      const partnershipStats = getPartnershipStats();

  return (
        <div className="min-h-screen bg-slate-950">
          {/* Hide header/footer when live scoring */}
          <style>{`header, footer { display: none !important; }`}</style>
          
          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts
            onRun={handleRun}
            onWicket={() => setShowWicketDialog(true)}
            onWide={() => handleExtra('wide', 1)}
            onNoBall={() => handleExtra('no_ball', 1)}
            onUndo={undoLastBall}
            onSwap={swapBatsmen}
            disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler}
          />

          {/* Animations */}
          {boundaryAnimation && <BoundaryAnimation type={boundaryAnimation} onComplete={() => setBoundaryAnimation(null)} />}
          {wicketAnimation && <WicketAnimation wicketType={wicketAnimation.wicketType} dismissedBatsman={wicketAnimation.dismissedBatsman} bowler={wicketAnimation.bowler} onComplete={() => setWicketAnimation(null)} />}

          {/* Compact Header - Fixed at top */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-red-600 to-red-700 px-3 py-2">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <button type="button" onClick={() => setShowConfirmReset(true)} className="text-white/80 text-xs px-2 py-1">← Back</button>
              <div className="text-center">
                <div className="text-white font-semibold text-xs">{battingTeamName} vs {bowlingTeamName}</div>
                <div className="text-white/70 text-[10px]">{innings === 1 ? '1st' : '2nd'} Inn</div>
              </div>
              <div className="flex items-center gap-2">
                {innings === 2 && dlsSituation?.parScore && (
                  <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-medium">
                    DLS: {dlsSituation.parScore}
                  </span>
                )}
                <button onClick={() => setShowScorecard(true)} className="text-white/80 text-xs">📊</button>
              </div>
            </div>
          </div>

          <div className="max-w-lg mx-auto px-2 pt-12 pb-2">
            {/* MAIN SCORE */}
            <div className="bg-slate-900 rounded-xl p-3 text-center border border-slate-800">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">{totalRuns}</span>
                <span className="text-2xl text-slate-400">/{totalWickets}</span>
                <span className="text-base text-slate-500 ml-1">({completedOvers}.{ballsInCurrentOver}/{maxOvers})</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="text-slate-400">CRR: <span className="text-white font-medium">{runRate.toFixed(2)}</span></span>
                {innings === 2 && target && (
                  <>
                    <span className="text-slate-400">Need: <span className="text-amber-400 font-medium">{runsNeeded}</span></span>
                    <span className="text-slate-400">RRR: <span className="text-red-400 font-medium">{requiredRunRate?.toFixed(2) || '-'}</span></span>
                  </>
                )}
              </div>
              {innings === 2 && target && runsNeeded > 0 && (
                <div className="mt-1 text-center">
                  <span className={`text-sm font-semibold ${runsNeeded <= ballsRemaining ? 'text-emerald-400' : 'text-red-400'}`}>
                    {runsNeeded} runs needed from {Math.floor(ballsRemaining / ballsPerOver)}.{ballsRemaining % ballsPerOver} overs ({ballsRemaining} balls)
                  </span>
                </div>
              )}
              {isFreeHit && (
                <div className="mt-1 inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  🔴 FREE HIT
                </div>
              )}
            </div>

            {/* This Over */}
            <div className="bg-slate-900/50 rounded-lg p-1.5 mt-1.5 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">Over {currentOverNumber}</span>
                <div className="flex gap-0.5">
                  {currentOverBalls.map((ball, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ball.is_wicket ? 'bg-red-600 text-white' :
                      ball.is_six ? 'bg-purple-600 text-white' :
                      ball.is_four ? 'bg-green-600 text-white' :
                      ball.extra_type ? 'bg-amber-600 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {ball.display_value || ball.runs}
                    </div>
                  ))}
                  {Array(Math.max(0, ballsPerOver - currentOverBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery).length)).fill(0).map((_, i) => (
                    <div key={`empty-${i}`} className="w-6 h-6 rounded-full border border-slate-700 border-dashed" />
                  ))}
                </div>
                <span className="text-slate-400 text-[10px] font-medium">{currentOverBalls.reduce((s, b) => s + (b.runs || 0) + (b.extras || 0), 0)}r</span>
              </div>
            </div>

            {/* Batsmen & Bowler */}
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <div onClick={() => setShowPlayerDialog('striker')} className={`rounded-lg p-2 cursor-pointer ${striker ? 'bg-emerald-900/40 border border-emerald-600/50' : 'bg-slate-800/50 border border-dashed border-slate-600'}`}>
                {striker ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-emerald-400 font-bold text-xs">*</span>
                        <span className="text-white text-xs font-medium truncate">{striker.split(' ')[0]}</span>
                      </div>
                      <div className="text-emerald-400/60 text-[9px]">{strikerStats?.fours || 0}×4 • {strikerStats?.sixes || 0}×6</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-lg font-bold">{strikerStats?.runs || 0}</div>
                      <div className="text-slate-500 text-[9px]">({strikerStats?.balls || 0})</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[10px] text-center">+ Striker</div>
                )}
              </div>
              <div onClick={() => setShowPlayerDialog('nonStriker')} className={`rounded-lg p-2 cursor-pointer ${nonStriker ? 'bg-slate-800/70 border border-slate-700' : 'bg-slate-800/50 border border-dashed border-slate-600'}`}>
                {nonStriker ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300 text-xs font-medium truncate">{nonStriker.split(' ')[0]}</span>
                      <div className="text-slate-500 text-[9px]">{nonStrikerStats?.fours || 0}×4 • {nonStrikerStats?.sixes || 0}×6</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-200 text-lg font-bold">{nonStrikerStats?.runs || 0}</div>
                      <div className="text-slate-500 text-[9px]">({nonStrikerStats?.balls || 0})</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[10px] text-center">+ Non-Striker</div>
                )}
              </div>
            </div>
            <div onClick={() => setShowPlayerDialog('bowler')} className={`rounded-lg p-2 mt-1.5 cursor-pointer ${bowler ? 'bg-blue-900/30 border border-blue-700/50' : needNewBowler ? 'bg-amber-900/30 border border-amber-500/50 animate-pulse' : 'bg-slate-800/50 border border-dashed border-slate-600'}`}>
              {bowler ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-400 text-xs">🎯</span>
                    <span className="text-white text-xs font-medium">{bowler}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white font-bold">{bowlerStats?.wickets || 0}-{bowlerStats?.runs || 0}</span>
                    <span className="text-slate-500">({bowlerStats?.overs || '0.0'})</span>
                  </div>
                </div>
              ) : (
                <div className={`text-[10px] text-center ${needNewBowler ? 'text-amber-300' : 'text-slate-500'}`}>
                  {needNewBowler ? '⚾ Select Bowler' : '+ Bowler'}
                </div>
              )}
            </div>

            {/* RUN BUTTONS */}
            <div className="grid grid-cols-7 gap-1 mt-2">
              {[0, 1, 2, 3, 4, 5, 6].map(run => (
                <button
                  key={run}
                  onClick={() => handleRun(run)}
                  disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler}
                  className={`h-12 rounded-lg font-bold text-lg transition-all active:scale-95 disabled:opacity-50 ${
                    run === 4 ? 'bg-green-600 hover:bg-green-500 text-white' :
                    run === 6 ? 'bg-purple-600 hover:bg-purple-500 text-white' :
                    run === 0 ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' :
                    'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {run}
                </button>
              ))}
            </div>

            {/* EXTRAS + WICKET - Row 1 */}
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              <button onClick={() => setShowExtraDialog('wide')} disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler} className="h-10 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs disabled:opacity-50">WD</button>
              <button onClick={() => setShowExtraDialog('no_ball')} disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler} className="h-10 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs disabled:opacity-50">NB</button>
              <button onClick={() => setShowExtraDialog('bye')} disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler} className="h-10 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold text-xs disabled:opacity-50">BYE</button>
              <button onClick={() => setShowExtraDialog('leg_bye')} disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler} className="h-10 bg-orange-700 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs disabled:opacity-50">LB</button>
            </div>
            {/* WICKET + RUN OUT */}
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button onClick={() => setShowWicketDialog(true)} disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler || isFreeHit} className="h-10 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs disabled:opacity-50">
                OUT
              </button>
              <button onClick={() => { setShowWicketDialog(true); }} disabled={addBallMutation.isPending || !striker || !nonStriker || !bowler} className="h-10 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold text-xs disabled:opacity-50">
                RUN OUT
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-5 gap-1 mt-1.5">
              <button onClick={swapBatsmen} className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-medium">⇄ Swap</button>
              <button onClick={undoLastBall} disabled={inningsBalls.length === 0} className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-medium disabled:opacity-50">↩ Undo</button>
              <button onClick={endInnings} className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-medium">End</button>
              <button onClick={() => setShowMatchSettings(true)} className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-medium">⚙</button>
              <button onClick={() => { saveCurrentState(); toast.success('Saved!'); }} className="h-8 bg-emerald-800 hover:bg-emerald-700 text-emerald-300 rounded text-[10px] font-medium">💾</button>
            </div>
          </div>

      {/* Player Selection Dialog */}
          <PlayerSelectDialog
                    open={!!showPlayerDialog}
                    onClose={() => setShowPlayerDialog(null)}
                    onSelect={handlePlayerSelect}
                    players={showPlayerDialog === 'bowler' 
                      ? bowlingTeamPlayers.map(p => ({ id: p.id, name: p.player_name, role: p.role }))
                      : battingTeamPlayers.map(p => ({ id: p.id, name: p.player_name, role: p.role }))
                    }
                    title={`Select ${showPlayerDialog === 'striker' ? 'Striker' : showPlayerDialog === 'nonStriker' ? 'Non-Striker' : 'Bowler'}`}
                    excludePlayers={getExcludedPlayers()}
                    teamId={showPlayerDialog === 'bowler' 
                      ? (bowlingTeamKey === 'home' ? selectedMatch?.team1_id : selectedMatch?.team2_id)
                      : (battingTeamKey === 'home' ? selectedMatch?.team1_id : selectedMatch?.team2_id)
                    }
                    teamName={showPlayerDialog === 'bowler' ? bowlingTeamName : battingTeamName}
                    onPlayerAdded={() => {
                      queryClient.invalidateQueries({ queryKey: ['homeTeamPlayers'] });
                      queryClient.invalidateQueries({ queryKey: ['awayTeamPlayers'] });
                    }}
                    // Bowler-specific props
                    isBowlerSelect={showPlayerDialog === 'bowler'}
                    bowlerStats={showPlayerDialog === 'bowler' ? getAllBowlerStats() : {}}
                    maxOversPerBowler={matchSettings.max_overs_per_bowler || 0}
                    lastOverBowler={getLastOverBowler()}
                    // Batsman-specific props - show stats when selecting batsmen
                    showStats={showPlayerDialog !== 'bowler'}
                    playerStats={showPlayerDialog !== 'bowler' ? (() => {
                      const stats = {};
                      battingTeamPlayers.forEach(p => {
                        stats[p.player_name] = getBatsmanStats(p.player_name);
                      });
                      return stats;
                    })() : {}}
                  />

      {/* Wicket Dialog */}
      <WicketDialog
        open={showWicketDialog}
        onClose={() => setShowWicketDialog(false)}
        onWicket={handleWicket}
        striker={striker}
        nonStriker={nonStriker}
        bowler={bowler}
        fieldingTeamPlayers={bowlingTeamPlayers.map(p => ({ id: p.id, name: p.player_name }))}
        isFreeHit={isFreeHit}
      />

      {/* Full Scorecard Dialog */}
      <FullScorecard
        open={showScorecard}
        onClose={() => setShowScorecard(false)}
        match={selectedMatch}
        balls={balls}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        tossData={tossData}
        currentInnings={innings}
        ballsPerOver={ballsPerOver}
      />

      {/* Stream Overlay Dialog */}
      <StreamOverlayDialog
        open={showStreamOverlay}
        onClose={() => setShowStreamOverlay(false)}
        matchId={selectedMatch?.id}
      />

      {/* DLS Dialog */}
              <DLSDialog
                open={showDLSDialog}
                onClose={() => setShowDLSDialog(false)}
                match={selectedMatch}
                innings1Score={innings1Total}
                innings1Overs={innings1Overs}
                innings2Score={totalRuns}
                innings2Overs={completedOvers + ballsInCurrentOver / 10}
                innings2Wickets={totalWickets}
                currentInnings={innings}
                onApplyDLS={(dlsData) => {
                  updateMatchMutation.mutate(dlsData);
                }}
              />

              {/* Confirm End Innings Dialog */}
              {showConfirmEndInnings && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full text-center">
                    {innings === 1 ? (
                      <>
                        <div className="text-4xl mb-3">🏏</div>
                        <h2 className="text-xl font-bold text-white mb-2">End 1st Innings?</h2>
                        <div className="bg-slate-800 rounded-lg p-3 mb-4">
                          <p className="text-2xl font-bold text-white">{totalRuns}/{totalWickets}</p>
                          <p className="text-slate-400 text-sm">({completedOvers}.{ballsInCurrentOver} overs)</p>
                        </div>
                        <p className="text-amber-400 text-sm mb-4">
                          Target for {tossData?.battingFirst === 'home' ? awayTeamName : homeTeamName}: <span className="font-bold">{totalRuns + 1}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-3">🏆</div>
                        <h2 className="text-xl font-bold text-white mb-2">End Match?</h2>
                        <div className="bg-slate-800 rounded-lg p-3 mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">{tossData?.battingFirst === 'home' ? homeTeamName : awayTeamName}</span>
                            <span className="text-white font-medium">{innings1Total}/{innings1Balls.filter(b => b.is_wicket).length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">{tossData?.battingFirst === 'home' ? awayTeamName : homeTeamName}</span>
                            <span className="text-white font-medium">{totalRuns}/{totalWickets}</span>
                          </div>
                        </div>
                        <p className={`text-sm mb-4 font-semibold ${totalRuns > innings1Total ? 'text-emerald-400' : totalRuns < innings1Total ? 'text-red-400' : 'text-amber-400'}`}>
                          {totalRuns > innings1Total 
                            ? `${tossData?.battingFirst === 'home' ? awayTeamName : homeTeamName} wins by ${10 - totalWickets} wicket${10 - totalWickets !== 1 ? 's' : ''}!`
                            : totalRuns < innings1Total 
                            ? `${tossData?.battingFirst === 'home' ? homeTeamName : awayTeamName} wins by ${innings1Total - totalRuns} run${innings1Total - totalRuns !== 1 ? 's' : ''}!`
                            : 'Match Tied!'}
                        </p>
                      </>
                    )}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowConfirmEndInnings(false)}
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        Go Back
                      </Button>
                      <Button
                        onClick={confirmEndInnings}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {innings === 1 ? 'End Innings' : 'End Match'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Reset Match Dialog */}
              <ConfirmDialog
                open={showConfirmReset}
                onClose={() => setShowConfirmReset(false)}
                onConfirm={confirmResetMatch}
                title="Leave Match?"
                description="Are you sure you want to leave this match? You can resume later by selecting the same match."
                confirmText="Leave"
                variant="danger"
              />

              {/* Shot Direction Picker for 4s and 6s */}
              <ShotDirectionPicker
                open={!!pendingBoundary}
                onClose={() => setPendingBoundary(null)}
                onSelect={(zone) => {
                  if (pendingBoundary && zone) {
                    updateBallMutation.mutate({
                      id: pendingBoundary.ballId,
                      data: { wagon_wheel_zone: zone }
                    });
                  }
                  setPendingBoundary(null);
                }}
                runs={pendingBoundary?.runs || 4}
                batsmanName={striker}
                existingShots={inningsBalls.filter(b => b.batsman === striker && (b.is_four || b.is_six))}
              />

              {/* Match Settings Dialog */}
              <MatchSettingsDialog
                open={showMatchSettings}
                onClose={() => setShowMatchSettings(false)}
                settings={matchSettings}
                profileName={matchProfileName}
                onSave={(settings, profileName) => {
                  updateScoringState({ matchSettings: settings });
                  saveCurrentState();
                  toast.success('Rules updated!');
                }}
              />

              {/* Extra Run Dialog (Bye, Leg Bye, Wide, No Ball) */}
              <ExtraRunDialog
                type={showExtraDialog}
                open={!!showExtraDialog}
                onClose={() => setShowExtraDialog(null)}
                onSelect={(type, runs) => {
                  if (type === 'wide') {
                    handleExtra('wide', runs);
                  } else if (type === 'no_ball') {
                    handleExtra('no_ball', runs, runs);
                  } else {
                    handleExtra(type, runs, 0);
                  }
                }}
              />

              {/* Match Summary Dialog */}
              {showMatchSummary && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full text-center">
                    <div className="text-4xl mb-3">🏆</div>
                    <h2 className="text-xl font-bold text-white mb-3">Match Complete!</h2>
                    
                    {/* Result */}
                    {(() => {
                      const inn1Score = innings1Total;
                      const inn2Score = totalRuns;
                      const inn2Wickets = totalWickets;
                      const inn1Wickets = innings1Balls.filter(b => b.is_wicket).length;
                      const battingFirstTeam = tossData?.battingFirst === 'home' ? homeTeamName : awayTeamName;
                      const battingSecondTeam = tossData?.battingFirst === 'home' ? awayTeamName : homeTeamName;
                      
                      let resultText = '';
                      let resultColor = 'text-amber-400';
                      
                      if (inn2Score > inn1Score) {
                        const wicketsLeft = 10 - inn2Wickets;
                        resultText = `${battingSecondTeam} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
                        resultColor = 'text-emerald-400';
                      } else if (inn1Score > inn2Score) {
                        const runsDiff = inn1Score - inn2Score;
                        resultText = `${battingFirstTeam} won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
                        resultColor = 'text-emerald-400';
                      } else {
                        resultText = 'Match Tied!';
                        resultColor = 'text-amber-400';
                      }
                      
                      return (
                        <>
                          <p className={`text-base font-bold mb-3 ${resultColor}`}>{resultText}</p>
                          <div className="bg-slate-800 rounded-lg p-3 mb-4">
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-300 text-sm">{battingFirstTeam}</span>
                              <span className="text-white font-bold">{inn1Score}/{inn1Wickets}</span>
                            </div>
                            <div className="border-t border-slate-700 my-1"></div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-300 text-sm">{battingSecondTeam}</span>
                              <span className="text-white font-bold">{inn2Score}/{inn2Wickets}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowScorecard(true)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        📊 Scorecard
                      </Button>
                      <Button
                        onClick={() => {
                          setShowMatchSummary(false);
                          resetMatch();
                        }}
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }