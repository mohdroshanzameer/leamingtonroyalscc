/**
 * Duckworth-Lewis-Stern (DLS) Method Calculator
 * 
 * This implements the Standard Edition of the DLS method.
 * The Professional Edition uses more complex algorithms not publicly available.
 * 
 * Key Concepts:
 * - Resources remaining = f(overs remaining, wickets lost)
 * - Par score and revised targets based on resources available
 */

// DLS Resource Table (Standard Edition - Simplified)
// Resources remaining as percentage based on overs remaining and wickets lost
// Format: resourceTable[wicketsLost][oversRemaining]
const RESOURCE_TABLE = {
  // Wickets lost: 0
  0: {
    50: 100.0, 45: 95.0, 40: 89.3, 35: 82.7, 30: 75.1, 25: 66.5, 
    20: 56.6, 18: 52.4, 16: 48.0, 14: 43.4, 12: 38.6, 10: 33.6,
    8: 28.3, 6: 22.8, 5: 19.9, 4: 16.9, 3: 13.8, 2: 10.5, 1: 6.5, 0: 0
  },
  // Wickets lost: 1
  1: {
    50: 93.4, 45: 89.5, 40: 84.8, 35: 79.0, 30: 72.2, 25: 64.3,
    20: 55.2, 18: 51.2, 16: 47.0, 14: 42.6, 12: 38.0, 10: 33.2,
    8: 28.0, 6: 22.6, 5: 19.7, 4: 16.8, 3: 13.7, 2: 10.4, 1: 6.5, 0: 0
  },
  // Wickets lost: 2
  2: {
    50: 85.1, 45: 82.0, 40: 78.4, 35: 73.6, 30: 67.9, 25: 61.0,
    20: 52.8, 18: 49.2, 16: 45.4, 14: 41.3, 12: 36.9, 10: 32.4,
    8: 27.5, 6: 22.3, 5: 19.5, 4: 16.6, 3: 13.5, 2: 10.3, 1: 6.4, 0: 0
  },
  // Wickets lost: 3
  3: {
    50: 74.9, 45: 72.8, 40: 70.3, 35: 66.8, 30: 62.2, 25: 56.4,
    20: 49.3, 18: 46.2, 16: 42.8, 14: 39.2, 12: 35.2, 10: 31.1,
    8: 26.6, 6: 21.7, 5: 19.0, 4: 16.3, 3: 13.3, 2: 10.2, 1: 6.3, 0: 0
  },
  // Wickets lost: 4
  4: {
    50: 62.7, 45: 61.5, 40: 60.1, 35: 57.9, 30: 54.7, 25: 50.3,
    20: 44.6, 18: 42.0, 16: 39.2, 14: 36.1, 12: 32.7, 10: 29.1,
    8: 25.1, 6: 20.7, 5: 18.2, 4: 15.7, 3: 12.9, 2: 9.9, 1: 6.2, 0: 0
  },
  // Wickets lost: 5
  5: {
    50: 49.0, 45: 48.4, 40: 47.6, 35: 46.4, 30: 44.6, 25: 41.8,
    20: 37.8, 18: 35.9, 16: 33.7, 14: 31.3, 12: 28.6, 10: 25.7,
    8: 22.4, 6: 18.7, 5: 16.6, 4: 14.4, 3: 11.9, 2: 9.3, 1: 5.9, 0: 0
  },
  // Wickets lost: 6
  6: {
    50: 34.9, 45: 34.6, 40: 34.3, 35: 33.8, 30: 33.0, 25: 31.6,
    20: 29.2, 18: 28.0, 16: 26.6, 14: 25.0, 12: 23.2, 10: 21.1,
    8: 18.7, 6: 15.9, 5: 14.2, 4: 12.5, 3: 10.5, 2: 8.3, 1: 5.4, 0: 0
  },
  // Wickets lost: 7
  7: {
    50: 22.0, 45: 21.9, 40: 21.8, 35: 21.6, 30: 21.3, 25: 20.8,
    20: 19.7, 18: 19.1, 16: 18.4, 14: 17.5, 12: 16.4, 10: 15.2,
    8: 13.7, 6: 11.9, 5: 10.8, 4: 9.6, 3: 8.2, 2: 6.6, 1: 4.5, 0: 0
  },
  // Wickets lost: 8
  8: {
    50: 11.9, 45: 11.9, 40: 11.8, 35: 11.8, 30: 11.7, 25: 11.5,
    20: 11.1, 18: 10.9, 16: 10.6, 14: 10.2, 12: 9.7, 10: 9.1,
    8: 8.4, 6: 7.4, 5: 6.8, 4: 6.1, 3: 5.4, 2: 4.5, 1: 3.2, 0: 0
  },
  // Wickets lost: 9
  9: {
    50: 4.7, 45: 4.7, 40: 4.7, 35: 4.7, 30: 4.7, 25: 4.6,
    20: 4.5, 18: 4.5, 16: 4.4, 14: 4.3, 12: 4.2, 10: 4.0,
    8: 3.7, 6: 3.4, 5: 3.1, 4: 2.9, 3: 2.6, 2: 2.2, 1: 1.7, 0: 0
  }
};

/**
 * Interpolate resource value for fractional overs
 */
function interpolateResource(wicketsLost, oversRemaining) {
  const wickets = Math.min(9, Math.max(0, wicketsLost));
  const table = RESOURCE_TABLE[wickets];
  
  // Get available over keys sorted
  const overKeys = Object.keys(table).map(Number).sort((a, b) => b - a);
  
  // Find surrounding overs for interpolation
  let lowerOver = 0;
  let upperOver = 50;
  
  for (const ov of overKeys) {
    if (ov <= oversRemaining) {
      lowerOver = ov;
      break;
    }
    upperOver = ov;
  }
  
  if (lowerOver === upperOver) {
    return table[lowerOver];
  }
  
  // Linear interpolation
  const lowerResource = table[lowerOver];
  const upperResource = table[upperOver];
  const fraction = (oversRemaining - lowerOver) / (upperOver - lowerOver);
  
  return lowerResource + (upperResource - lowerResource) * fraction;
}

/**
 * Calculate resources remaining
 * @param {number} oversRemaining - Overs remaining (can be fractional)
 * @param {number} wicketsLost - Wickets lost (0-9)
 * @returns {number} Resources remaining as percentage
 */
export function getResourcesRemaining(oversRemaining, wicketsLost) {
  return interpolateResource(wicketsLost, oversRemaining);
}

/**
 * Calculate resources used
 * @param {number} totalOvers - Total overs in innings
 * @param {number} oversBowled - Overs bowled (can be fractional)
 * @param {number} wicketsLost - Wickets lost
 * @returns {number} Resources used as percentage
 */
export function getResourcesUsed(totalOvers, oversBowled, wicketsLost) {
  const startResources = getResourcesRemaining(totalOvers, 0);
  const currentResources = getResourcesRemaining(totalOvers - oversBowled, wicketsLost);
  return startResources - currentResources;
}

/**
 * Calculate DLS par score at current point
 * @param {number} team1Score - Team 1's total score
 * @param {number} team1Overs - Team 1's overs (original)
 * @param {number} team2OversRemaining - Team 2's remaining overs
 * @param {number} team2WicketsLost - Team 2's wickets lost
 * @param {number} team2TotalOvers - Team 2's total available overs
 * @returns {number} Par score for team 2 at current point
 */
export function calculateParScore(team1Score, team1Overs, team2OversRemaining, team2WicketsLost, team2TotalOvers) {
  // Team 1 resources = 100% (full innings)
  const team1Resources = getResourcesRemaining(team1Overs, 0);
  
  // Team 2 resources at start
  const team2StartResources = getResourcesRemaining(team2TotalOvers, 0);
  
  // Team 2 resources remaining now
  const team2RemainingResources = getResourcesRemaining(team2OversRemaining, team2WicketsLost);
  
  // Team 2 resources used
  const team2UsedResources = team2StartResources - team2RemainingResources;
  
  // Par score = Team1 score × (Team2 resources used / Team1 resources)
  const parScore = Math.round(team1Score * (team2UsedResources / team1Resources));
  
  return parScore;
}

/**
 * Calculate revised target after interruption
 * @param {number} team1Score - Team 1's score
 * @param {number} team1Overs - Team 1's overs faced
 * @param {number} team2OriginalOvers - Team 2's original overs
 * @param {number} team2RevisedOvers - Team 2's revised overs after interruption
 * @param {number} team2WicketsAtInterruption - Wickets lost at interruption (if during innings)
 * @param {number} team2ScoreAtInterruption - Score at interruption (if during innings)
 * @returns {object} { target, parScore, resourceRatio }
 */
export function calculateRevisedTarget(
  team1Score,
  team1Overs,
  team2OriginalOvers,
  team2RevisedOvers,
  team2WicketsAtInterruption = 0,
  team2ScoreAtInterruption = 0
) {
  // Team 1 resources (assuming full innings)
  const team1Resources = getResourcesRemaining(team1Overs, 0);
  
  // Team 2 original resources
  const team2OriginalResources = getResourcesRemaining(team2OriginalOvers, 0);
  
  // Team 2 revised resources
  const team2RevisedResources = getResourcesRemaining(team2RevisedOvers, team2WicketsAtInterruption);
  
  // Calculate resource ratio
  const resourceRatio = team2RevisedResources / team1Resources;
  
  // If Team 2 has more resources, add runs to target
  // If Team 2 has fewer resources, reduce target proportionally
  let revisedTarget;
  
  if (team2RevisedResources >= team1Resources) {
    // Team 2 has more or equal resources - add runs
    const extraResources = team2RevisedResources - team1Resources;
    const g50 = 245; // Average score in 50 overs (G50 factor)
    const adjustedG50 = g50 * (team1Overs / 50); // Scale for match length
    const additionalRuns = Math.round((extraResources / 100) * adjustedG50);
    revisedTarget = team1Score + 1 + additionalRuns;
  } else {
    // Team 2 has fewer resources - scale target down
    revisedTarget = Math.round(team1Score * resourceRatio) + 1;
  }
  
  return {
    target: revisedTarget,
    parScore: revisedTarget - 1,
    resourceRatio: resourceRatio,
    team1Resources,
    team2RevisedResources
  };
}

/**
 * Calculate current DLS situation during 2nd innings
 * @param {object} params - Match parameters
 * @returns {object} DLS situation { parScore, target, runsAhead, runsBehind }
 */
export function getDLSSituation({
  team1Score,
  team1Overs,
  team2Score,
  team2OversUsed,
  team2WicketsLost,
  team2TotalOvers,
  isReduced = false,
  revisedTarget = null
}) {
  const team2OversRemaining = team2TotalOvers - team2OversUsed;
  
  // Calculate current par score
  const parScore = calculateParScore(
    team1Score,
    team1Overs,
    team2OversRemaining,
    team2WicketsLost,
    team2TotalOvers
  );
  
  // Use revised target if provided, otherwise calculate
  const target = revisedTarget || (team1Score + 1);
  
  // Calculate position relative to par
  const runsAhead = team2Score - parScore;
  
  return {
    parScore,
    target,
    runsAhead,
    runsBehind: -runsAhead,
    team2Score,
    team2OversUsed,
    team2WicketsLost,
    isAbovePar: runsAhead > 0,
    isBelowPar: runsAhead < 0,
    isOnPar: runsAhead === 0
  };
}

/**
 * Format overs (e.g., 10.3 means 10 overs and 3 balls)
 */
export function parseOvers(oversString) {
  if (typeof oversString === 'number') return oversString;
  const parts = String(oversString).split('.');
  const fullOvers = parseInt(parts[0]) || 0;
  const balls = parseInt(parts[1]) || 0;
  return fullOvers + (balls / 6);
}

/**
 * Get DLS method explanation text
 */
export function getDLSExplanation(situation) {
  if (situation.isAbovePar) {
    return `${Math.abs(situation.runsAhead)} runs ahead of DLS par`;
  } else if (situation.isBelowPar) {
    return `${Math.abs(situation.runsBehind)} runs behind DLS par`;
  } else {
    return 'On DLS par score';
  }
}

export default {
  getResourcesRemaining,
  getResourcesUsed,
  calculateParScore,
  calculateRevisedTarget,
  getDLSSituation,
  parseOvers,
  getDLSExplanation
};