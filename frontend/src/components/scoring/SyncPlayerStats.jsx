import { api } from '@/components/api/apiClient';

/**
 * Syncs player stats from match ball-by-ball data to:
 * 1. TournamentPlayer - Tournament-specific stats
 * 2. TeamPlayer - Career/overall stats
 */
export async function syncPlayerStatsFromMatch(matchId, tournamentId) {
  try {
    // Fetch all balls for this match
    const rawBalls = await api.entities.BallByBall.filter({ match_id: matchId });
    if (!rawBalls || rawBalls.length === 0) return;

    // Normalize ball data - handle both flat and nested structures
    const balls = rawBalls.map(b => b.data || b);

    // Calculate stats per player
    const playerStats = {};

    balls.forEach(ball => {
      const batsmanId = ball.batsman_id;
      const bowlerId = ball.bowler_id;
      const batsmanName = ball.batsman_name || ball.batsman;
      const bowlerName = ball.bowler_name || ball.bowler;

      // Initialize batsman stats (keyed by ID)
      if (batsmanId && !playerStats[batsmanId]) {
        playerStats[batsmanId] = {
          id: batsmanId,
          name: batsmanName,
          isBatsman: true,
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          is_out: false,
          highest_score: 0,
        };
      }

      // Initialize bowler stats (keyed by ID)
      if (bowlerId && !playerStats[bowlerId]) {
        playerStats[bowlerId] = {
          id: bowlerId,
          name: bowlerName,
          isBowler: true,
          wickets: 0,
          runs_conceded: 0,
          overs_bowled: 0,
          balls_bowled: 0,
          maidens: 0,
        };
      }

      // Update batsman stats
      if (batsmanId && playerStats[batsmanId]) {
        playerStats[batsmanId].runs += ball.runs || 0;
        if (ball.extra_type !== 'wide') {
          playerStats[batsmanId].balls_faced += 1;
        }
        if (ball.is_four) playerStats[batsmanId].fours += 1;
        if (ball.is_six) playerStats[batsmanId].sixes += 1;
        if (ball.is_wicket && ball.dismissed_batsman_id === batsmanId) {
          playerStats[batsmanId].is_out = true;
        }
      }

      // Update bowler stats
      if (bowlerId && playerStats[bowlerId]) {
        playerStats[bowlerId].isBowler = true;
        // Runs conceded (exclude byes and leg byes)
        if (ball.extra_type !== 'bye' && ball.extra_type !== 'leg_bye') {
          playerStats[bowlerId].runs_conceded += (ball.runs || 0) + (ball.extras || 0);
        }
        // Legal balls
        if (!ball.extra_type || ball.extra_type === 'bye' || ball.extra_type === 'leg_bye' || ball.is_legal_delivery) {
          playerStats[bowlerId].balls_bowled += 1;
        }
        // Wickets (exclude run outs)
        if (ball.is_wicket && ball.wicket_type !== 'run_out') {
          playerStats[bowlerId].wickets += 1;
        }
      }
    });

    // Calculate final batting stats (highest scores, not outs)
    Object.values(playerStats).forEach(p => {
      if (p.isBatsman) {
        p.highest_score = p.runs;
        p.not_out = !p.is_out ? 1 : 0;
        p.fifties = p.runs >= 50 && p.runs < 100 ? 1 : 0;
        p.hundreds = p.runs >= 100 ? 1 : 0;
      }
      if (p.isBowler) {
        p.overs_bowled = Math.floor(p.balls_bowled / 6) + (p.balls_bowled % 6) / 10;
      }
    });

    // Count dot balls for bowlers
    balls.forEach(ball => {
      const bowlerId = ball.bowler_id;
      if (bowlerId && playerStats[bowlerId]) {
        if ((ball.runs || 0) === 0 && !ball.extras && !ball.extra_type) {
          playerStats[bowlerId].dot_balls = (playerStats[bowlerId].dot_balls || 0) + 1;
        }
      }
    });

    // Get tournament match to find team IDs
    const matches = await api.entities.TournamentMatch.filter({ id: matchId });
    const match = matches[0];
    if (!match) return;

    // Sync to TournamentPlayer (if tournament exists)
    if (tournamentId) {
      await syncToTournamentPlayers(tournamentId, playerStats, match);
    }

    // Sync to TeamPlayer (career stats)
    await syncToTeamPlayers(playerStats, match);

    console.log('Player stats synced successfully');
  } catch (error) {
    console.error('Error syncing player stats:', error);
  }
}

async function syncToTournamentPlayers(tournamentId, playerStats, match) {
  const existingPlayers = await api.entities.TournamentPlayer.filter({ tournament_id: tournamentId });

  for (const [playerId, stats] of Object.entries(playerStats)) {
    // Match by player_id first, fall back to name
    const existing = existingPlayers.find(p => p.player_id === playerId || p.player_name === stats.name);

    if (existing) {
      // Update existing tournament player
      const updates = {
        matches_played: (existing.matches_played || 0) + 1,
        runs_scored: (existing.runs_scored || 0) + (stats.runs || 0),
        balls_faced: (existing.balls_faced || 0) + (stats.balls_faced || 0),
        fours: (existing.fours || 0) + (stats.fours || 0),
        sixes: (existing.sixes || 0) + (stats.sixes || 0),
        not_outs: (existing.not_outs || 0) + (stats.not_out || 0),
        fifties: (existing.fifties || 0) + (stats.fifties || 0),
        hundreds: (existing.hundreds || 0) + (stats.hundreds || 0),
        wickets_taken: (existing.wickets_taken || 0) + (stats.wickets || 0),
        runs_conceded: (existing.runs_conceded || 0) + (stats.runs_conceded || 0),
        overs_bowled: (existing.overs_bowled || 0) + (stats.overs_bowled || 0),
      };

      // Update highest score if this is higher
      if ((stats.runs || 0) > (existing.highest_score || 0)) {
        updates.highest_score = stats.runs;
      }

      // Calculate averages
      const totalInnings = updates.matches_played - updates.not_outs;
      updates.batting_avg = totalInnings > 0 ? (updates.runs_scored / totalInnings).toFixed(2) : 0;
      updates.strike_rate = updates.balls_faced > 0 ? ((updates.runs_scored / updates.balls_faced) * 100).toFixed(2) : 0;
      updates.economy = updates.overs_bowled > 0 ? (updates.runs_conceded / updates.overs_bowled).toFixed(2) : 0;
      updates.bowling_avg = updates.wickets_taken > 0 ? (updates.runs_conceded / updates.wickets_taken).toFixed(2) : 0;

      await api.entities.TournamentPlayer.update(existing.id, updates);
    }
    // If not existing, we could create - but typically players are added when squad is set
  }
}

async function syncToTeamPlayers(playerStats, match) {
  // Get all team players for both teams
  const team1Players = await api.entities.TeamPlayer.filter({ team_id: match.team1_id });
  const team2Players = await api.entities.TeamPlayer.filter({ team_id: match.team2_id });
  const allTeamPlayers = [...team1Players, ...team2Players];

  for (const [playerId, stats] of Object.entries(playerStats)) {
    // Match by ID directly
    const existing = allTeamPlayers.find(p => p.id === playerId);

    if (existing) {
      const updates = {
        matches_played: (existing.matches_played || 0) + 1,
        // Batting stats
        runs_scored: (existing.runs_scored || 0) + (stats.runs || 0),
        balls_faced: (existing.balls_faced || 0) + (stats.balls_faced || 0),
        fours: (existing.fours || 0) + (stats.fours || 0),
        sixes: (existing.sixes || 0) + (stats.sixes || 0),
        not_outs: (existing.not_outs || 0) + (stats.not_out || 0),
        fifties: (existing.fifties || 0) + (stats.fifties || 0),
        hundreds: (existing.hundreds || 0) + (stats.hundreds || 0),
        ducks: (existing.ducks || 0) + (stats.runs === 0 && stats.is_out ? 1 : 0),
        // Bowling stats
        wickets_taken: (existing.wickets_taken || 0) + (stats.wickets || 0),
        overs_bowled: (existing.overs_bowled || 0) + (stats.overs_bowled || 0),
        runs_conceded: (existing.runs_conceded || 0) + (stats.runs_conceded || 0),
        maidens: (existing.maidens || 0) + (stats.maidens || 0),
        dot_balls: (existing.dot_balls || 0) + (stats.dot_balls || 0),
      };

      // Update highest score if this match score is higher
      if ((stats.runs || 0) > (existing.highest_score || 0)) {
        updates.highest_score = stats.runs;
      }

      // Update best bowling (compare by wickets, then by runs)
      if ((stats.wickets || 0) > 0) {
        const currentBestWkts = existing.best_bowling ? parseInt(existing.best_bowling.split('/')[0]) : 0;
        const currentBestRuns = existing.best_bowling ? parseInt(existing.best_bowling.split('/')[1]) : 999;
        if ((stats.wickets || 0) > currentBestWkts || 
            ((stats.wickets || 0) === currentBestWkts && (stats.runs_conceded || 0) < currentBestRuns)) {
          updates.best_bowling = `${stats.wickets}/${stats.runs_conceded || 0}`;
        }
      }

      // Update 4-wicket and 5-wicket hauls
      if ((stats.wickets || 0) >= 5) {
        updates.five_wickets = (existing.five_wickets || 0) + 1;
      } else if ((stats.wickets || 0) >= 4) {
        updates.four_wickets = (existing.four_wickets || 0) + 1;
      }

      await api.entities.TeamPlayer.update(existing.id, updates);
    }
  }
}

/**
 * Aggregates all tournament stats into career stats for a player
 * Call this to recalculate career stats from all tournaments
 */
export async function recalculateCareerStats(teamPlayerId) {
  const teamPlayer = await api.entities.TeamPlayer.filter({ id: teamPlayerId });
  if (!teamPlayer || !teamPlayer[0]) return;

  const player = teamPlayer[0];
  const playerName = player.player_name;

  // Get all tournament player records for this player
  const tournamentPlayers = await api.entities.TournamentPlayer.filter({ player_name: playerName });

  // Aggregate all stats
  const careerStats = {
    matches_played: 0,
    runs_scored: 0,
    balls_faced: 0,
    highest_score: 0,
    not_outs: 0,
    fours: 0,
    sixes: 0,
    fifties: 0,
    hundreds: 0,
    ducks: 0,
    wickets_taken: 0,
    overs_bowled: 0,
    runs_conceded: 0,
    maidens: 0,
    dot_balls: 0,
    four_wickets: 0,
    five_wickets: 0,
    best_bowling: '',
    catches: 0,
    stumpings: 0,
    run_outs: 0,
  };

  tournamentPlayers.forEach(tp => {
    careerStats.matches_played += tp.matches_played || 0;
    careerStats.runs_scored += tp.runs_scored || 0;
    careerStats.balls_faced += tp.balls_faced || 0;
    careerStats.not_outs += tp.not_outs || 0;
    careerStats.fours += tp.fours || 0;
    careerStats.sixes += tp.sixes || 0;
    careerStats.fifties += tp.fifties || 0;
    careerStats.hundreds += tp.hundreds || 0;
    careerStats.wickets_taken += tp.wickets_taken || 0;
    careerStats.overs_bowled += tp.overs_bowled || 0;
    careerStats.runs_conceded += tp.runs_conceded || 0;
    careerStats.catches += tp.catches || 0;
    careerStats.stumpings += tp.stumpings || 0;
    careerStats.run_outs += tp.run_outs || 0;
    
    if ((tp.highest_score || 0) > careerStats.highest_score) {
      careerStats.highest_score = tp.highest_score;
    }
    
    // Best bowling comparison
    if (tp.best_bowling) {
      const currentBestWkts = careerStats.best_bowling ? parseInt(careerStats.best_bowling.split('/')[0]) : 0;
      const currentBestRuns = careerStats.best_bowling ? parseInt(careerStats.best_bowling.split('/')[1]) : 999;
      const newWkts = parseInt(tp.best_bowling.split('/')[0]) || 0;
      const newRuns = parseInt(tp.best_bowling.split('/')[1]) || 0;
      if (newWkts > currentBestWkts || (newWkts === currentBestWkts && newRuns < currentBestRuns)) {
        careerStats.best_bowling = tp.best_bowling;
      }
    }
  });

  await api.entities.TeamPlayer.update(player.id, careerStats);
}