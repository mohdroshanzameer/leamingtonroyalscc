/**
 * Ball Data Processor - Single Source of Truth
 * 
 * This module provides utility functions for processing ball-by-ball data
 * consistently across the app (Scoring, MatchReport, FullScorecard, etc.)
 */

/**
 * Normalize ball data from API - handles both flat and nested structures
 * The API returns balls with data in a nested 'data' object sometimes
 */
export const normalizeBalls = (balls) => {
  if (!balls || !Array.isArray(balls)) return [];
  return balls.map(ball => {
    // If ball has a nested 'data' property, flatten it
    if (ball.data && typeof ball.data === 'object') {
      return { ...ball.data, id: ball.id };
    }
    return ball;
  });
};

/**
 * Sort balls by over and ball number
 */
export const sortBalls = (balls) => {
  return [...balls].sort((a, b) => {
    if (a.over_number !== b.over_number) return a.over_number - b.over_number;
    return a.ball_number - b.ball_number;
  });
};

/**
 * Filter balls by innings
 * Note: balls should already be normalized before calling this
 */
export const getInningsBalls = (balls, innings) => {
  if (!balls || !Array.isArray(balls)) return [];
  return sortBalls(balls.filter(b => b.innings === innings));
};

/**
 * Check if a ball is a legal delivery
 */
export const isLegalDelivery = (ball) => {
  if (!ball.extra_type || ball.extra_type === 'bye' || ball.extra_type === 'leg_bye') {
    return true;
  }
  // Check if wide/no-ball was marked as legal (profile-dependent)
  return ball.is_legal_delivery === true;
};

/**
 * Calculate batting statistics from balls
 * Note: balls should already be normalized before calling this
 */
export const processBattingStats = (balls) => {
  if (!balls || !Array.isArray(balls) || balls.length === 0) return [];
  const batsmen = {};
  const sortedBalls = sortBalls(balls);
  
  sortedBalls.forEach(ball => {
    // Get batsman name (handle different field names)
    const batsmanName = ball.batsman_name || ball.batsman;
    if (!batsmanName) return;
    
    if (!batsmen[batsmanName]) {
      batsmen[batsmanName] = {
        name: batsmanName,
        id: ball.batsman_id || null,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissal: '',
        order: Object.keys(batsmen).length + 1
      };
    }
    
    const batsman = batsmen[batsmanName];
    
    // Count balls faced (not wides)
    if (ball.extra_type !== 'wide') {
      batsman.balls++;
    }
    
    // Add runs scored off bat (not extras)
    const runsOffBat = ball.runs || ball.runs_scored || 0;
    batsman.runs += runsOffBat;
    
    // Count boundaries
    if (ball.is_four || runsOffBat === 4) batsman.fours++;
    if (ball.is_six || runsOffBat === 6) batsman.sixes++;
    
    // Handle dismissal
    if (ball.is_wicket || ball.wicket_type) {
      const dismissedName = ball.dismissed_batsman_name || ball.dismissed_batsman || ball.batsman_out || batsmanName;
      if (batsmen[dismissedName]) {
        batsmen[dismissedName].isOut = true;
        batsmen[dismissedName].dismissal = formatDismissal(ball);
      }
    }
  });
  
  return Object.values(batsmen).sort((a, b) => a.order - b.order);
};

/**
 * Calculate bowling statistics from balls
 * Note: balls should already be normalized before calling this
 */
export const processBowlingStats = (balls, ballsPerOver = 6) => {
  if (!balls || !Array.isArray(balls) || balls.length === 0) return [];
  const bowlers = {};
  const overGroups = {};
  const sortedBalls = sortBalls(balls);
  
  sortedBalls.forEach(ball => {
    const bowlerName = ball.bowler_name || ball.bowler;
    if (!bowlerName) return;
    
    if (!bowlers[bowlerName]) {
      bowlers[bowlerName] = {
        name: bowlerName,
        id: ball.bowler_id || null,
        legalBalls: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        dots: 0,
        order: Object.keys(bowlers).length + 1
      };
    }
    
    const bowler = bowlers[bowlerName];
    
    // Track over groups for maidens calculation
    const overKey = `${bowlerName}-${ball.over_number}`;
    if (!overGroups[overKey]) {
      overGroups[overKey] = { bowler: bowlerName, runs: 0, balls: 0 };
    }
    
    // Count legal balls
    const isLegal = isLegalDelivery(ball);
    if (isLegal) {
      bowler.legalBalls++;
      overGroups[overKey].balls++;
    }
    
    // Runs conceded
    if (ball.extra_type === 'wide') {
      bowler.runs += (ball.extras || 1);
      bowler.wides++;
    } else if (ball.extra_type === 'no_ball') {
      bowler.runs += (ball.runs || ball.runs_scored || 0) + (ball.extras || 1);
      bowler.noBalls++;
    } else if (ball.extra_type !== 'bye' && ball.extra_type !== 'leg_bye') {
      // Regular delivery or no extras
      bowler.runs += (ball.runs || ball.runs_scored || 0);
    }
    // Byes and leg byes don't count against bowler
    
    overGroups[overKey].runs += (ball.runs || ball.runs_scored || 0) + (ball.extras || 0);
    
    // Wickets (not run outs)
    if ((ball.is_wicket || ball.wicket_type) && ball.wicket_type !== 'run_out') {
      bowler.wickets++;
    }
    
    // Dot balls
    if ((ball.runs || ball.runs_scored || 0) === 0 && !ball.extras && !(ball.is_wicket || ball.wicket_type)) {
      bowler.dots++;
    }
  });
  
  // Calculate maidens
  Object.values(overGroups).forEach(og => {
    if (og.balls === ballsPerOver && og.runs === 0 && bowlers[og.bowler]) {
      bowlers[og.bowler].maidens++;
    }
  });
  
  // Format overs and calculate economy
  return Object.values(bowlers)
    .sort((a, b) => a.order - b.order)
    .map(b => ({
      ...b,
      overs: `${Math.floor(b.legalBalls / ballsPerOver)}.${b.legalBalls % ballsPerOver}`,
      economy: b.legalBalls > 0 ? ((b.runs / b.legalBalls) * ballsPerOver).toFixed(2) : '0.00'
    }));
};

/**
 * Calculate fall of wickets
 * Note: balls should already be normalized before calling this
 */
export const processFallOfWickets = (balls, ballsPerOver = 6) => {
  if (!balls || !Array.isArray(balls) || balls.length === 0) return [];
  const fow = [];
  let totalRuns = 0;
  let legalBalls = 0;
  
  const sortedBalls = sortBalls(balls);
  
  sortedBalls.forEach(ball => {
    // Add runs from this ball
    totalRuns += (ball.runs || ball.runs_scored || 0) + (ball.extras || 0);
    
    // Count legal balls
    if (isLegalDelivery(ball)) {
      legalBalls++;
    }
    
    // Check for wicket
    if (ball.is_wicket || ball.wicket_type) {
      const oversAtWicket = Math.floor(legalBalls / ballsPerOver);
      const ballsAtWicket = legalBalls % ballsPerOver;
      const dismissedName = ball.dismissed_batsman_name || ball.dismissed_batsman || ball.batsman_out || ball.batsman_name || ball.batsman || 'Unknown';
      
      fow.push({
        wicket: fow.length + 1,
        score: totalRuns,
        batsman: dismissedName,
        overs: `${oversAtWicket}.${ballsAtWicket}`
      });
    }
  });
  
  return fow;
};

/**
 * Calculate extras breakdown
 * Note: balls should already be normalized before calling this
 */
export const calculateExtras = (balls) => {
  if (!balls || !Array.isArray(balls)) return { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  
  let wides = 0, noBalls = 0, byes = 0, legByes = 0, penalty = 0;
  
  balls.forEach(ball => {
    const extraRuns = ball.extras || 0;
    switch (ball.extra_type) {
      case 'wide':
        wides += extraRuns || 1;
        break;
      case 'no_ball':
        noBalls += extraRuns || 1;
        break;
      case 'bye':
        byes += extraRuns;
        break;
      case 'leg_bye':
        legByes += extraRuns;
        break;
      case 'penalty':
        penalty += extraRuns;
        break;
    }
  });
  
  return {
    wides,
    noBalls,
    byes,
    legByes,
    penalty,
    total: wides + noBalls + byes + legByes + penalty
  };
};

/**
 * Calculate innings totals
 * Note: balls should already be normalized before calling this
 */
export const calculateInningsTotals = (balls, ballsPerOver = 6) => {
  if (!balls || !Array.isArray(balls) || balls.length === 0) {
    return { runs: 0, wickets: 0, overs: '0.0', legalBalls: 0, runRate: '0.00' };
  }
  
  const totalRuns = balls.reduce((sum, b) => sum + (b.runs || b.runs_scored || 0) + (b.extras || 0), 0);
  const totalWickets = balls.filter(b => b.is_wicket || b.wicket_type).length;
  const legalBalls = balls.filter(b => isLegalDelivery(b));
  const completedOvers = Math.floor(legalBalls.length / ballsPerOver);
  const ballsInOver = legalBalls.length % ballsPerOver;
  const oversString = `${completedOvers}.${ballsInOver}`;
  const runRate = legalBalls.length > 0 ? (totalRuns / (legalBalls.length / ballsPerOver)).toFixed(2) : '0.00';
  
  return {
    runs: totalRuns,
    wickets: totalWickets,
    overs: oversString,
    legalBalls: legalBalls.length,
    runRate
  };
};

/**
 * Format dismissal string
 */
export const formatDismissal = (ball) => {
  const wicketType = ball.wicket_type;
  const bowler = ball.bowler_name || ball.bowler;
  const fielder = ball.fielder_name || ball.fielder;
  
  if (!wicketType) return '';
  
  switch (wicketType) {
    case 'bowled':
      return `b ${bowler}`;
    case 'caught':
      return `c ${fielder || '?'} b ${bowler}`;
    case 'caught_behind':
      return `c †${fielder || 'wk'} b ${bowler}`;
    case 'caught_and_bowled':
      return `c & b ${bowler}`;
    case 'lbw':
      return `lbw b ${bowler}`;
    case 'stumped':
      return `st †${fielder || 'wk'} b ${bowler}`;
    case 'run_out':
      return `run out (${fielder || '?'})`;
    case 'hit_wicket':
      return `hit wicket b ${bowler}`;
    case 'obstructing_field':
      return 'obstructing the field';
    case 'timed_out':
      return 'timed out';
    case 'retired_hurt':
      return 'retired hurt';
    case 'retired_out':
      return 'retired out';
    default:
      return wicketType;
  }
};

/**
 * Get complete processed innings data
 * This is the main function to use for displaying scorecard data
 */
export const getProcessedInningsData = (balls, ballsPerOver = 6) => {
  const normalized = normalizeBalls(balls);
  
  if (!normalized || normalized.length === 0) {
    return null;
  }
  
  return {
    batsmen: processBattingStats(normalized),
    bowlers: processBowlingStats(normalized, ballsPerOver),
    fallOfWickets: processFallOfWickets(normalized, ballsPerOver),
    extras: calculateExtras(normalized),
    totals: calculateInningsTotals(normalized, ballsPerOver)
  };
};

/**
 * Get batsman stats from balls (for live scoring display)
 */
export const getBatsmanStatsFromBalls = (balls, batsmanName) => {
  const normalized = normalizeBalls(balls);
  const batsmanBalls = normalized.filter(b => 
    (b.batsman_name || b.batsman) === batsmanName ||
    b.batsman_id === batsmanName
  );
  
  const runs = batsmanBalls.reduce((sum, b) => sum + (b.runs || b.runs_scored || 0), 0);
  const faced = batsmanBalls.filter(b => b.extra_type !== 'wide').length;
  const fours = batsmanBalls.filter(b => b.is_four || (b.runs || b.runs_scored) === 4).length;
  const sixes = batsmanBalls.filter(b => b.is_six || (b.runs || b.runs_scored) === 6).length;
  
  return { runs, balls: faced, fours, sixes };
};

/**
 * Get bowler stats from balls (for live scoring display)
 */
export const getBowlerStatsFromBalls = (balls, bowlerName, ballsPerOver = 6) => {
  const normalized = normalizeBalls(balls);
  const bowlerBalls = normalized.filter(b => 
    (b.bowler_name || b.bowler) === bowlerName ||
    b.bowler_id === bowlerName
  );
  
  const legalBalls = bowlerBalls.filter(b => isLegalDelivery(b));
  const overs = Math.floor(legalBalls.length / ballsPerOver);
  const remainder = legalBalls.length % ballsPerOver;
  
  let runs = 0;
  bowlerBalls.forEach(b => {
    if (b.extra_type === 'wide' || b.extra_type === 'no_ball') {
      runs += (b.runs || b.runs_scored || 0) + (b.extras || 0);
    } else if (b.extra_type !== 'bye' && b.extra_type !== 'leg_bye') {
      runs += (b.runs || b.runs_scored || 0);
    }
  });
  
  const wickets = bowlerBalls.filter(b => (b.is_wicket || b.wicket_type) && b.wicket_type !== 'run_out').length;
  const dots = bowlerBalls.filter(b => (b.runs || b.runs_scored || 0) === 0 && !b.extras && !(b.is_wicket || b.wicket_type)).length;
  
  return {
    overs: `${overs}.${remainder}`,
    runs,
    wickets,
    dots,
    economy: legalBalls.length > 0 ? ((runs / legalBalls.length) * ballsPerOver).toFixed(2) : '0.00'
  };
};