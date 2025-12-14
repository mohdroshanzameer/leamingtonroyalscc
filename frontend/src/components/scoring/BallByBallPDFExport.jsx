import { format } from 'date-fns';
import { CLUB_CONFIG } from '@/components/ClubConfig';

/**
 * Generate a comprehensive professional cricket scorecard PDF with ball-by-ball details
 */
export const generateBallByBallPDF = ({
  match,
  balls,
  innings1Data,
  innings2Data,
  innings1Balls,
  innings2Balls
}) => {
  const printWindow = window.open('', '_blank');
  const html = generateDetailedScorecardHTML({
    match,
    balls,
    innings1Data,
    innings2Data,
    innings1Balls,
    innings2Balls
  });
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

const generateDetailedScorecardHTML = ({
  match,
  innings1Data,
  innings2Data,
  innings1Balls,
  innings2Balls
}) => {
  const clubName = CLUB_CONFIG.name || 'Cricket Club';
  const matchDate = match?.match_date ? format(new Date(match.match_date), 'EEEE, dd MMMM yyyy') : '';
  const matchTime = match?.match_date ? format(new Date(match.match_date), 'h:mm a') : '';
  
  // Group balls by over
  const groupBallsByOver = (balls) => {
    const overs = {};
    balls.forEach(ball => {
      const overNum = ball.over_number || 1;
      if (!overs[overNum]) overs[overNum] = [];
      overs[overNum].push(ball);
    });
    return overs;
  };

  const innings1Overs = groupBallsByOver(innings1Balls || []);
  const innings2Overs = groupBallsByOver(innings2Balls || []);

  // Calculate partnerships
  const calculatePartnerships = (balls) => {
    if (!balls || balls.length === 0) return [];
    
    const partnerships = [];
    let currentPartnership = { runs: 0, balls: 0, batsmen: new Set(), startScore: 0 };
    let totalRuns = 0;
    let wicketCount = 0;
    
    balls.forEach(ball => {
      const ballRuns = (ball.runs || 0) + (ball.extras || 0);
      totalRuns += ballRuns;
      
      if (ball.batsman_name) currentPartnership.batsmen.add(ball.batsman_name);
      if (ball.non_striker_name) currentPartnership.batsmen.add(ball.non_striker_name);
      
      currentPartnership.runs += ballRuns;
      if (ball.extra_type !== 'wide') currentPartnership.balls++;
      
      if (ball.is_wicket) {
        wicketCount++;
        partnerships.push({
          wicket: wicketCount,
          runs: currentPartnership.runs,
          balls: currentPartnership.balls,
          batsmen: Array.from(currentPartnership.batsmen).slice(-2),
          endScore: totalRuns
        });
        currentPartnership = { runs: 0, balls: 0, batsmen: new Set(), startScore: totalRuns };
      }
    });
    
    // Add unbroken partnership
    if (currentPartnership.runs > 0 || currentPartnership.balls > 0) {
      partnerships.push({
        wicket: wicketCount + 1,
        runs: currentPartnership.runs,
        balls: currentPartnership.balls,
        batsmen: Array.from(currentPartnership.batsmen).slice(-2),
        endScore: totalRuns,
        unbroken: true
      });
    }
    
    return partnerships;
  };

  // Calculate innings statistics
  const calculateInningsStats = (balls) => {
    if (!balls || balls.length === 0) return null;
    
    const totalBalls = balls.filter(b => b.extra_type !== 'wide' && b.extra_type !== 'no_ball').length;
    const dots = balls.filter(b => (b.runs || 0) === 0 && !b.extras && !b.is_wicket && b.extra_type !== 'wide' && b.extra_type !== 'no_ball').length;
    const ones = balls.filter(b => (b.runs || 0) === 1 && !b.extras).length;
    const twos = balls.filter(b => (b.runs || 0) === 2 && !b.extras).length;
    const threes = balls.filter(b => (b.runs || 0) === 3 && !b.extras).length;
    const fours = balls.filter(b => b.is_four || (b.runs || 0) === 4).length;
    const sixes = balls.filter(b => b.is_six || (b.runs || 0) === 6).length;
    const wides = balls.filter(b => b.extra_type === 'wide').length;
    const noBalls = balls.filter(b => b.extra_type === 'no_ball').length;
    const byes = balls.filter(b => b.extra_type === 'bye').reduce((sum, b) => sum + (b.extras || 0), 0);
    const legByes = balls.filter(b => b.extra_type === 'leg_bye').reduce((sum, b) => sum + (b.extras || 0), 0);
    const penalties = balls.filter(b => b.extra_type === 'penalty').reduce((sum, b) => sum + (b.extras || 0), 0);
    const boundaryRuns = (fours * 4) + (sixes * 6);
    const totalRuns = balls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    
    return {
      totalBalls,
      dots,
      dotPercentage: totalBalls > 0 ? ((dots / totalBalls) * 100).toFixed(1) : '0.0',
      ones,
      twos,
      threes,
      fours,
      sixes,
      wides,
      noBalls,
      byes,
      legByes,
      penalties,
      boundaryRuns,
      boundaryPercentage: totalRuns > 0 ? ((boundaryRuns / totalRuns) * 100).toFixed(1) : '0.0',
      runDistribution: { dots, ones, twos, threes, fours, sixes }
    };
  };

  // Calculate powerplay stats (first 6 overs)
  const calculatePowerplayStats = (balls) => {
    const ppBalls = balls.filter(b => (b.over_number || 1) <= 6);
    const runs = ppBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = ppBalls.filter(b => b.is_wicket).length;
    const fours = ppBalls.filter(b => b.is_four || (b.runs || 0) === 4).length;
    const sixes = ppBalls.filter(b => b.is_six || (b.runs || 0) === 6).length;
    return { runs, wickets, fours, sixes };
  };

  // Calculate death overs stats (last 4 overs of 20, or last 10 of 50)
  const calculateDeathStats = (balls, totalOvers = 20) => {
    const deathStart = totalOvers <= 20 ? totalOvers - 4 : totalOvers - 10;
    const deathBalls = balls.filter(b => (b.over_number || 1) > deathStart);
    const runs = deathBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = deathBalls.filter(b => b.is_wicket).length;
    return { runs, wickets, overs: deathBalls.length > 0 ? Math.ceil(deathBalls.length / 6) : 0 };
  };

  // Format ball display
  const formatBallDisplay = (ball) => {
    let display = '';
    let cssClass = '';
    
    if (ball.is_wicket) {
      display = 'W';
      cssClass = 'wicket';
    } else if (ball.extra_type === 'wide') {
      display = ball.extras > 1 ? `${ball.extras}Wd` : 'Wd';
      cssClass = 'wide';
    } else if (ball.extra_type === 'no_ball') {
      const total = (ball.runs || 0) + (ball.extras || 1);
      display = total > 1 ? `${total}Nb` : 'Nb';
      cssClass = 'noball';
    } else if (ball.extra_type === 'bye') {
      display = `${ball.extras || 0}B`;
      cssClass = 'bye';
    } else if (ball.extra_type === 'leg_bye') {
      display = `${ball.extras || 0}Lb`;
      cssClass = 'legbye';
    } else if (ball.extra_type === 'penalty') {
      display = `${ball.extras || 0}P`;
      cssClass = 'penalty';
    } else if (ball.is_six || (ball.runs || 0) === 6) {
      display = '6';
      cssClass = 'six';
    } else if (ball.is_four || (ball.runs || 0) === 4) {
      display = '4';
      cssClass = 'four';
    } else if ((ball.runs || 0) === 0) {
      display = '•';
      cssClass = 'dot';
    } else {
      display = String(ball.runs || 0);
      cssClass = 'runs';
    }
    
    return { display, cssClass };
  };

  // Calculate over summary
  const getOverSummary = (overBalls) => {
    const runs = overBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const wickets = overBalls.filter(b => b.is_wicket).length;
    return { runs, wickets };
  };

  // Generate over-by-over breakdown
  const generateOverBreakdown = (overs, inningsData) => {
    if (!overs || Object.keys(overs).length === 0) return '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">No ball data available</td></tr>';
    
    let runningTotal = 0;
    let runningWickets = 0;
    
    return Object.entries(overs).sort((a, b) => Number(a[0]) - Number(b[0])).map(([overNum, overBalls]) => {
      const summary = getOverSummary(overBalls);
      runningTotal += summary.runs;
      runningWickets += summary.wickets;
      const bowler = overBalls[0]?.bowler_name || overBalls[0]?.bowler || 'Unknown';
      
      // Determine if it's a maiden
      const isMaiden = summary.runs === 0 && overBalls.length >= 6;
      
      return `
        <tr class="over-row ${isMaiden ? 'maiden-over' : ''}">
          <td class="over-num">${overNum}</td>
          <td class="bowler-name">${bowler}</td>
          <td class="balls-display">
            ${overBalls.map(ball => {
              const { display, cssClass } = formatBallDisplay(ball);
              return `<span class="ball ${cssClass}">${display}</span>`;
            }).join('')}
          </td>
          <td class="over-runs">${summary.runs}${isMaiden ? ' (M)' : ''}</td>
          <td class="running-total">${runningTotal}/${runningWickets}</td>
        </tr>
      `;
    }).join('');
  };

  // Generate batting card
  const generateBattingCard = (data, balls) => {
    if (!data || !data.batsmen || data.batsmen.length === 0) return '<p class="no-data">No batting data available</p>';
    
    const stats = calculateInningsStats(balls);
    
    return `
      <table class="batting-table">
        <thead>
          <tr>
            <th class="batsman-col">Batsman</th>
            <th>R</th>
            <th>B</th>
            <th>4s</th>
            <th>6s</th>
            <th>SR</th>
          </tr>
        </thead>
        <tbody>
          ${data.batsmen.map(b => {
            const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-';
            const isFifty = b.runs >= 50 && b.runs < 100;
            const isCentury = b.runs >= 100;
            return `
            <tr class="${isCentury ? 'century' : isFifty ? 'fifty' : ''}">
              <td class="batsman-col">
                <strong>${b.name}${!b.isOut ? ' *' : ''}</strong>
                ${isCentury ? ' 💯' : isFifty ? ' ⭐' : ''}
                ${b.dismissal ? `<br><small class="dismissal">${b.dismissal}</small>` : (!b.isOut ? '<br><small class="not-out">not out</small>' : '')}
              </td>
              <td class="runs-col"><strong>${b.runs}</strong></td>
              <td>${b.balls}</td>
              <td class="fours">${b.fours || 0}</td>
              <td class="sixes">${b.sixes || 0}</td>
              <td>${sr}</td>
            </tr>
          `;}).join('')}
          <tr class="dnb-row">
            <td colspan="6" class="dnb-label">
              ${data.batsmen.filter(b => !b.isOut && b.balls === 0).length > 0 ? 
                `<strong>Did Not Bat:</strong> ${data.batsmen.filter(b => !b.isOut && b.balls === 0).map(b => b.name).join(', ')}` : 
                ''}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="extras-row">
            <td><strong>Extras</strong></td>
            <td colspan="5">
              <strong>${data.extras?.total || 0}</strong>
              <span class="extras-detail">
                (W: ${data.extras?.wides || 0}, NB: ${data.extras?.noBalls || 0}, B: ${data.extras?.byes || 0}, LB: ${data.extras?.legByes || 0}${data.extras?.penalty ? `, P: ${data.extras.penalty}` : ''})
              </span>
            </td>
          </tr>
          <tr class="total-row">
            <td><strong>TOTAL</strong></td>
            <td colspan="5">
              <strong>${data.totals?.runs || 0}/${data.totals?.wickets || 0}</strong>
              <span class="overs-detail">(${data.totals?.overs || '0.0'} overs, RR: ${data.totals?.runRate || '0.00'})</span>
            </td>
          </tr>
        </tfoot>
      </table>
      
      ${stats ? `
      <div class="innings-analysis">
        <div class="analysis-row">
          <div class="analysis-item">
            <span class="label">Boundaries</span>
            <span class="value">${stats.fours} × 4s, ${stats.sixes} × 6s = ${stats.boundaryRuns} runs (${stats.boundaryPercentage}%)</span>
          </div>
          <div class="analysis-item">
            <span class="label">Dot Balls</span>
            <span class="value">${stats.dots} (${stats.dotPercentage}%)</span>
          </div>
        </div>
        <div class="analysis-row">
          <div class="analysis-item">
            <span class="label">Run Distribution</span>
            <span class="value">0s: ${stats.dots} | 1s: ${stats.ones} | 2s: ${stats.twos} | 3s: ${stats.threes}</span>
          </div>
        </div>
      </div>
      ` : ''}
    `;
  };

  // Generate bowling card with enhanced stats
  const generateBowlingCard = (data, balls) => {
    if (!data || !data.bowlers || data.bowlers.length === 0) return '<p class="no-data">No bowling data available</p>';
    
    return `
      <table class="bowling-table">
        <thead>
          <tr>
            <th class="bowler-col">Bowler</th>
            <th>O</th>
            <th>M</th>
            <th>R</th>
            <th>W</th>
            <th>Econ</th>
            <th>Dots</th>
            <th>Wd</th>
            <th>Nb</th>
          </tr>
        </thead>
        <tbody>
          ${data.bowlers.map(b => {
            const hasFiveWickets = b.wickets >= 5;
            const hasFourWickets = b.wickets === 4;
            return `
            <tr class="${hasFiveWickets ? 'five-wicket' : hasFourWickets ? 'four-wicket' : ''}">
              <td class="bowler-col">
                <strong>${b.name}</strong>
                ${hasFiveWickets ? ' 🔥' : hasFourWickets ? ' ⭐' : ''}
              </td>
              <td>${b.overs}</td>
              <td>${b.maidens || 0}</td>
              <td>${b.runs}</td>
              <td class="wickets"><strong>${b.wickets}</strong></td>
              <td>${b.economy || '-'}</td>
              <td class="dots-col">${b.dots || 0}</td>
              <td class="extras-col">${b.wides || 0}</td>
              <td class="extras-col">${b.noBalls || 0}</td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>
    `;
  };

  // Generate fall of wickets
  const generateFOW = (data) => {
    if (!data || !data.fallOfWickets || data.fallOfWickets.length === 0) return '';
    
    return `
      <div class="fow-section">
        <strong>Fall of Wickets:</strong>
        <div class="fow-list">
          ${data.fallOfWickets.map(f => `
            <span class="fow-item">${f.score}-${f.wicket} (${f.batsman}, ${f.overs})</span>
          `).join('')}
        </div>
      </div>
    `;
  };

  // Generate partnerships
  const generatePartnerships = (balls) => {
    const partnerships = calculatePartnerships(balls);
    if (partnerships.length === 0) return '';
    
    return `
      <div class="partnerships-section">
        <strong>Partnerships:</strong>
        <table class="partnerships-table">
          <thead>
            <tr>
              <th>Wkt</th>
              <th>Runs</th>
              <th>Balls</th>
              <th>Batsmen</th>
            </tr>
          </thead>
          <tbody>
            ${partnerships.map(p => `
              <tr class="${p.unbroken ? 'unbroken' : ''}">
                <td>${p.wicket}${p.unbroken ? '*' : ''}</td>
                <td class="partnership-runs"><strong>${p.runs}</strong></td>
                <td>${p.balls}</td>
                <td>${p.batsmen.join(' & ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  // Generate phase analysis
  const generatePhaseAnalysis = (balls) => {
    if (!balls || balls.length === 0) return '';
    
    const pp = calculatePowerplayStats(balls);
    const middle = {
      runs: balls.filter(b => (b.over_number || 1) > 6 && (b.over_number || 1) <= 15)
        .reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0),
      wickets: balls.filter(b => (b.over_number || 1) > 6 && (b.over_number || 1) <= 15 && b.is_wicket).length
    };
    const death = calculateDeathStats(balls, 20);
    
    return `
      <div class="phase-analysis">
        <strong>Phase Analysis:</strong>
        <div class="phases">
          <div class="phase powerplay">
            <span class="phase-name">Powerplay (1-6)</span>
            <span class="phase-score">${pp.runs}/${pp.wickets}</span>
            <span class="phase-detail">${pp.fours}×4s, ${pp.sixes}×6s</span>
          </div>
          <div class="phase middle">
            <span class="phase-name">Middle (7-15)</span>
            <span class="phase-score">${middle.runs}/${middle.wickets}</span>
          </div>
          <div class="phase death">
            <span class="phase-name">Death (16-20)</span>
            <span class="phase-score">${death.runs}/${death.wickets}</span>
          </div>
        </div>
      </div>
    `;
  };

  // Calculate match result
  const getMatchResult = () => {
    if (match?.result_summary) return match.result_summary;
    if (!innings1Data?.totals || !innings2Data?.totals) return null;
    
    const inn1Runs = innings1Data.totals.runs;
    const inn2Runs = innings2Data.totals.runs;
    const inn2Wickets = innings2Data.totals.wickets;
    
    if (inn2Runs > inn1Runs) {
      const wicketsRemaining = 10 - inn2Wickets;
      return `${match.team2_name || 'Team 2'} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    } else if (inn1Runs > inn2Runs) {
      return `${match.team1_name || 'Team 1'} won by ${inn1Runs - inn2Runs} runs`;
    } else {
      return 'Match Tied';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Scorecard - ${match?.team1_name || 'Team 1'} vs ${match?.team2_name || 'Team 2'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { 
          size: A4; 
          margin: 12mm;
        }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10px;
          color: #1a1a1a;
          line-height: 1.3;
          background: #fff;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #1e3a5f;
          padding-bottom: 12px;
          margin-bottom: 15px;
        }
        
        .header h1 {
          font-size: 20px;
          color: #1e3a5f;
          margin-bottom: 3px;
          letter-spacing: -0.5px;
        }
        
        .header .teams {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin: 8px 0;
        }
        
        .header .vs {
          color: #888;
          font-weight: normal;
          margin: 0 8px;
        }
        
        .header .match-info {
          color: #666;
          font-size: 11px;
        }
        
        .match-details {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 8px;
          font-size: 10px;
          color: #555;
        }
        
        .match-details span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .toss-info {
          text-align: center;
          padding: 6px;
          background: #f0f4f8;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 10px;
          color: #555;
        }
        
        .innings-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .innings-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
          color: #fff;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: bold;
          border-radius: 4px 4px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .innings-header .score {
          font-size: 18px;
        }
        
        .innings-header .rr {
          font-size: 10px;
          opacity: 0.9;
          font-weight: normal;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          background: #fff;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 6px 8px;
          text-align: center;
        }
        
        th {
          background: #f5f7fa;
          font-weight: 600;
          color: #333;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .batsman-col, .bowler-col {
          text-align: left !important;
          width: 35%;
        }
        
        .dismissal {
          color: #666;
          font-size: 8px;
          font-weight: normal;
        }
        
        .not-out {
          color: #22863a;
          font-size: 8px;
        }
        
        .runs-col {
          font-weight: bold;
          font-size: 12px;
        }
        
        .fours { color: #2563eb; }
        .sixes { color: #7c3aed; }
        .wickets { color: #dc2626; font-size: 12px; }
        .dots-col { color: #666; font-size: 9px; }
        .extras-col { color: #d97706; font-size: 9px; }
        
        .extras-row { background: #f9fafb; }
        .extras-detail { font-size: 9px; color: #666; margin-left: 5px; }
        
        .total-row { background: #e8f5e9; font-size: 11px; }
        .overs-detail { font-size: 9px; color: #666; margin-left: 8px; }
        
        .dnb-row td { text-align: left; font-size: 9px; color: #666; border: none; padding: 4px 8px; }
        
        .fifty td { background: #fef3c7 !important; }
        .century td { background: #fef3c7 !important; }
        .four-wicket td { background: #dbeafe !important; }
        .five-wicket td { background: #dcfce7 !important; }
        
        .innings-analysis {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 8px;
          margin: 8px 0;
        }
        
        .analysis-row {
          display: flex;
          gap: 20px;
          margin-bottom: 4px;
        }
        
        .analysis-item {
          display: flex;
          gap: 6px;
          font-size: 9px;
        }
        
        .analysis-item .label {
          font-weight: 600;
          color: #64748b;
        }
        
        .analysis-item .value {
          color: #334155;
        }
        
        .fow-section {
          padding: 8px;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 4px;
          margin: 8px 0;
          font-size: 9px;
        }
        
        .fow-list {
          margin-top: 4px;
        }
        
        .fow-item {
          display: inline-block;
          background: #fee2e2;
          padding: 2px 6px;
          border-radius: 3px;
          margin: 2px;
          color: #7f1d1d;
        }
        
        .partnerships-section {
          padding: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 4px;
          margin: 8px 0;
        }
        
        .partnerships-table {
          width: 100%;
          margin-top: 6px;
          font-size: 9px;
        }
        
        .partnerships-table th {
          background: #dcfce7;
          padding: 4px 6px;
        }
        
        .partnerships-table td {
          padding: 3px 6px;
        }
        
        .partnership-runs { font-weight: bold; color: #166534; }
        .unbroken td { background: #f0fdf4; font-style: italic; }
        
        .phase-analysis {
          padding: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          margin: 8px 0;
        }
        
        .phases {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }
        
        .phase {
          flex: 1;
          padding: 6px;
          border-radius: 4px;
          text-align: center;
        }
        
        .phase.powerplay { background: #dbeafe; }
        .phase.middle { background: #e0e7ff; }
        .phase.death { background: #fce7f3; }
        
        .phase-name { display: block; font-size: 8px; color: #666; margin-bottom: 2px; }
        .phase-score { display: block; font-weight: bold; font-size: 12px; color: #1e3a5f; }
        .phase-detail { display: block; font-size: 8px; color: #888; }
        
        /* Ball by Ball Section */
        .ball-by-ball {
          margin-top: 15px;
          page-break-before: always;
        }
        
        .ball-by-ball h3 {
          font-size: 12px;
          color: #1e3a5f;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 2px solid #1e3a5f;
        }
        
        .over-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        
        .over-table th {
          background: #1e3a5f;
          color: #fff;
          padding: 5px 6px;
          font-size: 8px;
        }
        
        .over-row td {
          padding: 4px 6px;
          border-bottom: 1px solid #eee;
        }
        
        .over-row:nth-child(even) { background: #f9fafb; }
        .maiden-over td { background: #dcfce7 !important; }
        
        .over-num {
          font-weight: bold;
          width: 35px;
          text-align: center !important;
          color: #1e3a5f;
        }
        
        .bowler-name {
          text-align: left !important;
          width: 100px;
          font-weight: 500;
        }
        
        .balls-display { text-align: left !important; }
        
        .ball {
          display: inline-flex;
          width: 22px;
          height: 22px;
          align-items: center;
          justify-content: center;
          margin: 1px;
          border-radius: 50%;
          font-size: 9px;
          font-weight: bold;
        }
        
        .ball.dot { background: #e5e7eb; color: #6b7280; }
        .ball.runs { background: #dbeafe; color: #1e40af; }
        .ball.four { background: #22c55e; color: #fff; }
        .ball.six { background: #7c3aed; color: #fff; }
        .ball.wicket { background: #ef4444; color: #fff; }
        .ball.wide { background: #fbbf24; color: #78350f; font-size: 7px; }
        .ball.noball { background: #f97316; color: #fff; font-size: 7px; }
        .ball.bye { background: #6b7280; color: #fff; font-size: 8px; }
        .ball.legbye { background: #6b7280; color: #fff; font-size: 7px; }
        .ball.penalty { background: #ef4444; color: #fff; font-size: 7px; }
        
        .over-runs {
          font-weight: bold;
          width: 45px;
          text-align: center !important;
        }
        
        .running-total {
          font-weight: bold;
          width: 60px;
          text-align: center !important;
          color: #1e3a5f;
        }
        
        .result-box {
          margin-top: 15px;
          padding: 12px 15px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #fff;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          border-radius: 6px;
        }
        
        .mom-box {
          margin-top: 8px;
          padding: 8px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 4px;
          text-align: center;
          font-size: 11px;
        }
        
        .mom-box strong { color: #b45309; }
        
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #888;
          font-size: 8px;
        }
        
        .legend {
          margin: 10px 0;
          padding: 8px;
          background: #f5f7fa;
          border-radius: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          font-size: 8px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .legend .ball {
          width: 16px;
          height: 16px;
          font-size: 7px;
        }
        
        .no-data {
          text-align: center;
          padding: 20px;
          color: #888;
          font-style: italic;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .ball-by-ball { page-break-before: always; }
          .innings-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${clubName}</h1>
        <div class="teams">
          ${match?.team1_name || 'Team 1'} <span class="vs">vs</span> ${match?.team2_name || 'Team 2'}
        </div>
        <div class="match-info">
          ${matchDate}${matchTime ? ` • ${matchTime}` : ''}
          ${match?.venue ? ` • ${match.venue}` : ''}
        </div>
        <div class="match-details">
          ${match?.stage ? `<span>📍 ${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}${match.group ? ` - Group ${match.group}` : ''}</span>` : ''}
          ${match?.match_number ? `<span>🎯 Match #${match.match_number}</span>` : ''}
        </div>
      </div>
      
      ${match?.toss_winner ? `
        <div class="toss-info">
          <strong>🪙 Toss:</strong> ${match.toss_winner} won the toss and elected to ${match.toss_decision}
        </div>
      ` : ''}
      
      <!-- First Innings -->
      <div class="innings-section">
        <div class="innings-header">
          <span>🏏 ${match?.team1_name || innings1Data?.battingTeam || 'Team 1'} - 1st Innings</span>
          <span>
            <span class="score">${match?.team1_score || `${innings1Data?.totals?.runs || 0}/${innings1Data?.totals?.wickets || 0}`}</span>
            <span class="rr">(${innings1Data?.totals?.overs || match?.team1_overs || '0.0'} ov, RR: ${innings1Data?.totals?.runRate || '0.00'})</span>
          </span>
        </div>
        ${generateBattingCard(innings1Data, innings1Balls)}
        ${generateBowlingCard({ bowlers: innings2Data?.bowlers || [] }, innings1Balls)}
        ${generateFOW(innings1Data)}
        ${generatePartnerships(innings1Balls)}
        ${generatePhaseAnalysis(innings1Balls)}
      </div>
      
      <!-- Second Innings -->
      <div class="innings-section">
        <div class="innings-header">
          <span>🏏 ${match?.team2_name || innings2Data?.battingTeam || 'Team 2'} - 2nd Innings</span>
          <span>
            <span class="score">${match?.team2_score || `${innings2Data?.totals?.runs || 0}/${innings2Data?.totals?.wickets || 0}`}</span>
            <span class="rr">(${innings2Data?.totals?.overs || match?.team2_overs || '0.0'} ov, RR: ${innings2Data?.totals?.runRate || '0.00'})</span>
          </span>
        </div>
        ${generateBattingCard(innings2Data, innings2Balls)}
        ${generateBowlingCard({ bowlers: innings1Data?.bowlers || [] }, innings2Balls)}
        ${generateFOW(innings2Data)}
        ${generatePartnerships(innings2Balls)}
        ${generatePhaseAnalysis(innings2Balls)}
      </div>
      
      ${getMatchResult() ? `<div class="result-box">🏆 ${getMatchResult()}</div>` : ''}
      
      ${match?.man_of_match ? `
        <div class="mom-box">
          <strong>🌟 Player of the Match:</strong> ${match.man_of_match}
          ${match.mom_performance ? ` (${match.mom_performance})` : ''}
        </div>
      ` : ''}
      
      <!-- Ball by Ball Breakdown -->
      <div class="ball-by-ball">
        <h3>📊 Ball-by-Ball Breakdown - 1st Innings (${match?.team1_name || 'Team 1'})</h3>
        
        <div class="legend">
          <div class="legend-item"><span class="ball dot">•</span> Dot</div>
          <div class="legend-item"><span class="ball runs">1</span> Runs</div>
          <div class="legend-item"><span class="ball four">4</span> Four</div>
          <div class="legend-item"><span class="ball six">6</span> Six</div>
          <div class="legend-item"><span class="ball wicket">W</span> Wicket</div>
          <div class="legend-item"><span class="ball wide">Wd</span> Wide</div>
          <div class="legend-item"><span class="ball noball">Nb</span> No Ball</div>
          <div class="legend-item"><span class="ball bye">B</span> Bye</div>
          <div class="legend-item"><span class="ball legbye">Lb</span> Leg Bye</div>
          <div class="legend-item"><span class="ball penalty">P</span> Penalty</div>
        </div>
        
        <table class="over-table">
          <thead>
            <tr>
              <th>Over</th>
              <th style="text-align:left">Bowler</th>
              <th style="text-align:left">Deliveries</th>
              <th>Runs</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${generateOverBreakdown(innings1Overs, innings1Data)}
          </tbody>
        </table>
        
        <h3 style="margin-top:20px;">📊 Ball-by-Ball Breakdown - 2nd Innings (${match?.team2_name || 'Team 2'})</h3>
        
        <table class="over-table">
          <thead>
            <tr>
              <th>Over</th>
              <th style="text-align:left">Bowler</th>
              <th style="text-align:left">Deliveries</th>
              <th>Runs</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${generateOverBreakdown(innings2Overs, innings2Data)}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        Generated by ${clubName} Cricket Management System • ${format(new Date(), 'dd MMMM yyyy, HH:mm')}
        <br>This is an official match scorecard
      </div>
    </body>
    </html>
  `;
};

export default generateBallByBallPDF;