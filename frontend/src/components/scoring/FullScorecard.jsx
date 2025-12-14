import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Share2, Trophy, Target, CloudRain } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FullScorecard({ 
  open, 
  onClose,
  match,
  balls = [],
  homeTeamName,
  awayTeamName,
  tossData,
  currentInnings = 1,
  ballsPerOver = 6
}) {
  // Process ball data into scorecard format
  const processInningsData = (inningsBalls, battingTeamName, bowlingTeamName) => {
    if (!inningsBalls || inningsBalls.length === 0) return null;

    const sortedBalls = [...inningsBalls].sort((a, b) => {
      if (a.over_number !== b.over_number) return a.over_number - b.over_number;
      return a.ball_number - b.ball_number;
    });

    // Build batsmen stats
    const batsmenMap = new Map();
    const dismissals = [];
    
    sortedBalls.forEach(ball => {
      // Track batsman
      if (!batsmenMap.has(ball.batsman)) {
        batsmenMap.set(ball.batsman, {
          name: ball.batsman,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          dismissal: '',
          order: batsmenMap.size + 1
        });
      }
      
      const batsman = batsmenMap.get(ball.batsman);
      
      // Add runs (not from extras like wides)
      if (ball.extra_type !== 'wide') {
        batsman.balls++;
      }
      batsman.runs += ball.runs || 0;
      if (ball.is_four) batsman.fours++;
      if (ball.is_six) batsman.sixes++;
      
      // Handle wicket
      if (ball.is_wicket) {
        const dismissedName = ball.dismissed_batsman || ball.batsman;
        if (batsmenMap.has(dismissedName)) {
          const dismissed = batsmenMap.get(dismissedName);
          dismissed.isOut = true;
          dismissed.dismissal = formatDismissal(ball);
        }
        
        // Calculate score at fall of wicket
        const legalBallsSoFar = sortedBalls
          .filter((b, idx) => idx <= sortedBalls.indexOf(ball))
          .filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
        const oversAtWicket = Math.floor(legalBallsSoFar.length / ballsPerOver);
        const ballsAtWicket = legalBallsSoFar.length % ballsPerOver;
        const runsAtWicket = sortedBalls
          .filter((b, idx) => idx <= sortedBalls.indexOf(ball))
          .reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
        
        dismissals.push({
          wicket: dismissals.length + 1,
          score: runsAtWicket,
          batsman: dismissedName,
          overs: `${oversAtWicket}.${ballsAtWicket}`
        });
      }
    });

    // Build bowlers stats
    const bowlersMap = new Map();
    sortedBalls.forEach(ball => {
      if (!bowlersMap.has(ball.bowler)) {
        bowlersMap.set(ball.bowler, {
          name: ball.bowler,
          balls: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
          dots: 0,
          order: bowlersMap.size + 1
        });
      }
      
      const bowler = bowlersMap.get(ball.bowler);
      
      // Count legal balls
      if (!ball.extra_type || ball.extra_type === 'bye' || ball.extra_type === 'leg_bye' || ball.is_legal_delivery) {
        bowler.balls++;
      }
      
      // Runs against bowler (not byes/leg byes)
      if (ball.extra_type === 'wide') {
        bowler.runs += ball.extras || 1;
        bowler.wides++;
      } else if (ball.extra_type === 'no_ball') {
        bowler.runs += (ball.runs || 0) + (ball.extras || 1);
        bowler.noBalls++;
      } else if (ball.extra_type === 'bye' || ball.extra_type === 'leg_bye') {
        // Byes don't count against bowler
      } else {
        bowler.runs += ball.runs || 0;
      }
      
      // Wickets (not run outs)
      if (ball.is_wicket && ball.wicket_type !== 'run_out') {
        bowler.wickets++;
      }
      
      // Dot balls
      if ((ball.runs || 0) === 0 && !ball.extras && !ball.is_wicket) {
        bowler.dots++;
      }
    });

    // Calculate maidens
    const overGroups = new Map();
    sortedBalls.forEach(ball => {
      const key = `${ball.bowler}-${ball.over_number}`;
      if (!overGroups.has(key)) {
        overGroups.set(key, { bowler: ball.bowler, runs: 0, balls: 0 });
      }
      const og = overGroups.get(key);
      og.runs += (ball.runs || 0) + (ball.extras || 0);
      if (!ball.extra_type || ball.extra_type === 'bye' || ball.extra_type === 'leg_bye' || ball.is_legal_delivery) {
        og.balls++;
      }
    });
    
    overGroups.forEach(og => {
      if (og.balls === ballsPerOver && og.runs === 0 && bowlersMap.has(og.bowler)) {
        bowlersMap.get(og.bowler).maidens++;
      }
    });

    // Calculate extras
    const extras = {
      wides: sortedBalls.filter(b => b.extra_type === 'wide').reduce((sum, b) => sum + (b.extras || 1), 0),
      noBalls: sortedBalls.filter(b => b.extra_type === 'no_ball').reduce((sum, b) => sum + (b.extras || 1), 0),
      byes: sortedBalls.filter(b => b.extra_type === 'bye').reduce((sum, b) => sum + (b.extras || 0), 0),
      legByes: sortedBalls.filter(b => b.extra_type === 'leg_bye').reduce((sum, b) => sum + (b.extras || 0), 0),
      penalty: 0
    };
    extras.total = extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;

    // Calculate total
    const legalBalls = sortedBalls.filter(b => !b.extra_type || b.extra_type === 'bye' || b.extra_type === 'leg_bye' || b.is_legal_delivery);
    const totalRuns = sortedBalls.reduce((sum, b) => sum + (b.runs || 0) + (b.extras || 0), 0);
    const totalWickets = sortedBalls.filter(b => b.is_wicket).length;
    const overs = Math.floor(legalBalls.length / ballsPerOver);
    const ballsInOver = legalBalls.length % ballsPerOver;

    return {
      battingTeam: battingTeamName,
      bowlingTeam: bowlingTeamName,
      batsmen: Array.from(batsmenMap.values()).sort((a, b) => a.order - b.order),
      bowlers: Array.from(bowlersMap.values())
        .sort((a, b) => a.order - b.order)
        .map(b => ({
          ...b,
          overs: `${Math.floor(b.balls / ballsPerOver)}.${b.balls % ballsPerOver}`
        })),
      extras,
      total: {
        runs: totalRuns,
        wickets: totalWickets,
        overs: `${overs}.${ballsInOver}`
      },
      fallOfWickets: dismissals,
      runRate: legalBalls.length > 0 ? (totalRuns / (legalBalls.length / ballsPerOver)).toFixed(2) : '0.00'
    };
  };

  const formatDismissal = (ball) => {
    const type = ball.wicket_type;
    const fielder = ball.fielder;
    const bowler = ball.bowler;
    
    switch (type) {
      case 'bowled': return `b ${bowler}`;
      case 'caught': return `c ${fielder || '?'} b ${bowler}`;
      case 'caught_behind': return `c †${fielder || 'wk'} b ${bowler}`;
      case 'caught_and_bowled': return `c & b ${bowler}`;
      case 'lbw': return `lbw b ${bowler}`;
      case 'stumped': return `st †${fielder || 'wk'} b ${bowler}`;
      case 'run_out': return `run out (${fielder || '?'})`;
      case 'hit_wicket': return `hit wicket b ${bowler}`;
      case 'obstructing_field': return 'obstructing the field';
      case 'timed_out': return 'timed out';
      case 'retired_hurt': return 'retired hurt';
      case 'retired_out': return 'retired out';
      default: return 'out';
    }
  };

  // Get batting team for each innings based on toss
  const getBattingTeam = (inn) => {
    if (!tossData) return inn === 1 ? homeTeamName : awayTeamName;
    if (inn === 1) return tossData.battingFirst === 'home' ? homeTeamName : awayTeamName;
    return tossData.battingFirst === 'home' ? awayTeamName : homeTeamName;
  };

  const getBowlingTeam = (inn) => {
    if (!tossData) return inn === 1 ? awayTeamName : homeTeamName;
    if (inn === 1) return tossData.battingFirst === 'home' ? awayTeamName : homeTeamName;
    return tossData.battingFirst === 'home' ? homeTeamName : awayTeamName;
  };

  // Normalize balls - handle both flat and nested data structures
  const normalizedBalls = useMemo(() => balls.map(b => b.data || b), [balls]);
  
  const innings1Balls = normalizedBalls.filter(b => b.innings === 1);
  const innings2Balls = normalizedBalls.filter(b => b.innings === 2);
  
  const innings1Data = useMemo(() => 
    processInningsData(innings1Balls, getBattingTeam(1), getBowlingTeam(1)), 
    [innings1Balls, tossData]);
  
  const innings2Data = useMemo(() => 
    processInningsData(innings2Balls, getBattingTeam(2), getBowlingTeam(2)), 
    [innings2Balls, tossData]);

  // Generate match result
  const getMatchResult = () => {
    if (!innings1Data || !innings2Data) return null;
    
    const inn1Runs = innings1Data.total.runs;
    const inn2Runs = innings2Data.total.runs;
    const inn2Wickets = innings2Data.total.wickets;
    const dlsTarget = match?.dls_target;
    const isDLS = match?.is_dls_affected;
    
    // For DLS affected matches
    if (isDLS && dlsTarget) {
      if (inn2Runs >= dlsTarget) {
        return `${innings2Data.battingTeam} won by ${10 - inn2Wickets} wickets (DLS)`;
      } else {
        return `${innings1Data.battingTeam} won by ${dlsTarget - inn2Runs - 1} runs (DLS)`;
      }
    }
    
    if (inn2Runs > inn1Runs) {
      return `${innings2Data.battingTeam} won by ${10 - inn2Wickets} wickets`;
    } else if (inn1Runs > inn2Runs) {
      return `${innings1Data.battingTeam} won by ${inn1Runs - inn2Runs} runs`;
    } else {
      return 'Match Tied';
    }
  };

  // Export as PDF
  const exportPDF = () => {
    // Create printable HTML
    const printWindow = window.open('', '_blank');
    const html = generatePrintHTML();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('Scorecard ready for printing/PDF');
  };

  const generatePrintHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scorecard - ${homeTeamName} vs ${awayTeamName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .match-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #666; }
          .innings { margin-bottom: 30px; page-break-inside: avoid; }
          .innings-header { background: #f0f0f0; padding: 10px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .extras, .total { background: #f9f9f9; }
          .total { font-weight: bold; font-size: 14px; }
          .fow { font-size: 11px; color: #666; margin-top: 10px; }
          .result { text-align: center; font-size: 18px; font-weight: bold; margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${homeTeamName} vs ${awayTeamName}</h1>
          <p>${match?.venue || 'Venue'} • ${match?.match_date ? format(new Date(match.match_date), 'dd MMM yyyy') : ''}</p>
          <p>${match?.match_type || ''} ${match?.overs ? `• ${match.overs} Overs` : ''}</p>
        </div>
        
        ${tossData ? `<p style="text-align:center;margin-bottom:10px;font-size:12px;color:#666;">Toss: ${tossData.tossWinner === 'home' ? homeTeamName : awayTeamName} won and elected to ${tossData.tossDecision}</p>` : ''}
        ${match?.is_dls_affected ? `<p style="text-align:center;margin-bottom:20px;font-size:14px;color:#2563eb;font-weight:bold;">🌧️ DLS Method Applied - Revised Target: ${match.dls_target}</p>` : ''}
        
        ${innings1Data ? generateInningsHTML(innings1Data, 1) : ''}
        ${innings2Data ? generateInningsHTML(innings2Data, 2) : ''}
        
        ${getMatchResult() ? `<div class="result">${getMatchResult()}</div>` : ''}
        
        <p style="text-align:center;margin-top:30px;font-size:10px;color:#999;">Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
      </body>
      </html>
    `;
  };

  const generateInningsHTML = (data, innNum) => {
    return `
      <div class="innings">
        <div class="innings-header">${data.battingTeam} Innings - ${data.total.runs}/${data.total.wickets} (${data.total.overs} ov, RR: ${data.runRate})</div>
        
        <table>
          <thead>
            <tr>
              <th>Batsman</th>
              <th class="text-right">R</th>
              <th class="text-right">B</th>
              <th class="text-right">4s</th>
              <th class="text-right">6s</th>
              <th class="text-right">SR</th>
            </tr>
          </thead>
          <tbody>
            ${data.batsmen.map(b => `
              <tr>
                <td>${b.name}${b.dismissal ? `<br><small style="color:#666">${b.dismissal}</small>` : b.isOut ? '' : ' *'}</td>
                <td class="text-right">${b.runs}</td>
                <td class="text-right">${b.balls}</td>
                <td class="text-right">${b.fours}</td>
                <td class="text-right">${b.sixes}</td>
                <td class="text-right">${b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '-'}</td>
              </tr>
            `).join('')}
            <tr class="extras">
              <td>Extras</td>
              <td colspan="5" class="text-right">${data.extras.total} (W:${data.extras.wides}, NB:${data.extras.noBalls}, B:${data.extras.byes}, LB:${data.extras.legByes})</td>
            </tr>
            <tr class="total">
              <td>TOTAL</td>
              <td colspan="5" class="text-right">${data.total.runs}/${data.total.wickets} (${data.total.overs} ov)</td>
            </tr>
          </tbody>
        </table>
        
        <table>
          <thead>
            <tr>
              <th>Bowler</th>
              <th class="text-right">O</th>
              <th class="text-right">M</th>
              <th class="text-right">R</th>
              <th class="text-right">W</th>
              <th class="text-right">Econ</th>
            </tr>
          </thead>
          <tbody>
            ${data.bowlers.map(b => `
              <tr>
                <td>${b.name}</td>
                <td class="text-right">${b.overs}</td>
                <td class="text-right">${b.maidens}</td>
                <td class="text-right">${b.runs}</td>
                <td class="text-right">${b.wickets}</td>
                <td class="text-right">${parseFloat(b.overs) > 0 ? (b.runs / parseFloat(b.overs)).toFixed(2) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${data.fallOfWickets.length > 0 ? `
          <div class="fow">
            <strong>Fall of Wickets:</strong> ${data.fallOfWickets.map(f => `${f.score}-${f.wicket} (${f.batsman}, ${f.overs} ov)`).join(', ')}
          </div>
        ` : ''}
      </div>
    `;
  };

  // Share scorecard
  const shareScorecard = async () => {
    const text = `${homeTeamName} vs ${awayTeamName}\n` +
      (innings1Data ? `${innings1Data.battingTeam}: ${innings1Data.total.runs}/${innings1Data.total.wickets} (${innings1Data.total.overs} ov)\n` : '') +
      (innings2Data ? `${innings2Data.battingTeam}: ${innings2Data.total.runs}/${innings2Data.total.wickets} (${innings2Data.total.overs} ov)\n` : '') +
      (getMatchResult() || '');
    
    // Try native share first, fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Match Scorecard', text });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }
    
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Scorecard copied to clipboard');
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Scorecard copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] p-0 [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader className="p-4 pb-2 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Full Scorecard
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={shareScorecard} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
          
          {/* Match Header */}
          <div className="text-center mt-2">
            <p className="text-lg text-white font-semibold">{homeTeamName} vs {awayTeamName}</p>
            <p className="text-sm text-slate-400">
              {match?.venue} • {match?.match_date && format(new Date(match.match_date), 'dd MMM yyyy')}
              {match?.overs && ` • ${match.overs} Overs`}
            </p>
            {tossData && (
              <p className="text-xs text-slate-500 mt-1">
                Toss: {tossData.tossWinner === 'home' ? homeTeamName : awayTeamName} won and elected to {tossData.tossDecision}
              </p>
            )}
            {match?.is_dls_affected && (
              <Badge className="mt-2 bg-blue-600/80 text-white">
                <CloudRain className="w-3 h-3 mr-1" />
                DLS Applied - Target: {match.dls_target}
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <Tabs defaultValue={`innings-${currentInnings}`} className="w-full">
          <TabsList className="w-full bg-slate-800 rounded-none">
            <TabsTrigger value="innings-1" className="flex-1 data-[state=active]:bg-emerald-600 rounded-none">
              1st Innings
              {innings1Data && <span className="ml-2 text-xs opacity-80">{innings1Data.total.runs}/{innings1Data.total.wickets}</span>}
            </TabsTrigger>
            <TabsTrigger value="innings-2" className="flex-1 data-[state=active]:bg-blue-600 rounded-none">
              2nd Innings
              {innings2Data && <span className="ml-2 text-xs opacity-80">{innings2Data.total.runs}/{innings2Data.total.wickets}</span>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="innings-1" className="m-0">
            <InningsScorecard data={innings1Data} />
          </TabsContent>
          
          <TabsContent value="innings-2" className="m-0">
            <InningsScorecard data={innings2Data} />
          </TabsContent>
        </Tabs>
        
        {/* Match Result */}
        {getMatchResult() && (
          <div className="p-4 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-t border-slate-700">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-semibold">
              <Trophy className="w-5 h-5" />
              {getMatchResult()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InningsScorecard({ data }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Innings not started yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[50vh]">
      <div className="p-4 space-y-4">
        {/* Innings Summary */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">{data.battingTeam}</h3>
              <p className="text-slate-400 text-sm">vs {data.bowlingTeam}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{data.total.runs}/{data.total.wickets}</div>
              <div className="text-slate-400 text-sm">({data.total.overs} ov, RR: {data.runRate})</div>
            </div>
          </div>
        </div>

        {/* Batting Table */}
        <div>
          <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            🏏 Batting
          </h4>
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left p-2.5">Batsman</th>
                  <th className="text-right p-2.5 w-12">R</th>
                  <th className="text-right p-2.5 w-12">B</th>
                  <th className="text-right p-2.5 w-10">4s</th>
                  <th className="text-right p-2.5 w-10">6s</th>
                  <th className="text-right p-2.5 w-14">SR</th>
                </tr>
              </thead>
              <tbody>
                {data.batsmen.map((bat, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-2.5">
                      <div className="flex flex-col">
                        <span className={`font-medium ${bat.isOut ? 'text-slate-400' : 'text-white'}`}>
                          {bat.name}
                          {!bat.isOut && <span className="text-emerald-400 ml-1">*</span>}
                        </span>
                        {bat.dismissal && (
                          <span className="text-[11px] text-slate-500">{bat.dismissal}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-2.5 font-bold text-white">{bat.runs}</td>
                    <td className="text-right p-2.5 text-slate-400">{bat.balls}</td>
                    <td className="text-right p-2.5 text-green-400">{bat.fours}</td>
                    <td className="text-right p-2.5 text-purple-400">{bat.sixes}</td>
                    <td className="text-right p-2.5 text-slate-400">
                      {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Extras Row */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-t border-slate-700">
              <span className="text-slate-400 text-sm">Extras</span>
              <span className="text-white text-sm">
                <span className="font-semibold">{data.extras.total}</span>
                <span className="text-slate-500 text-xs ml-2">
                  (W:{data.extras.wides}, NB:{data.extras.noBalls}, B:{data.extras.byes}, LB:{data.extras.legByes})
                </span>
              </span>
            </div>
            
            {/* Total Row */}
            <div className="flex items-center justify-between px-3 py-3 bg-emerald-900/30 border-t border-emerald-700/50">
              <span className="text-white font-bold">TOTAL</span>
              <span className="text-white font-bold">
                {data.total.runs}/{data.total.wickets}
                <span className="font-normal text-slate-300 ml-2">({data.total.overs} ov)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bowling Table */}
        <div>
          <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            🎯 Bowling
          </h4>
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 bg-slate-800/80">
                  <th className="text-left p-2.5">Bowler</th>
                  <th className="text-right p-2.5 w-12">O</th>
                  <th className="text-right p-2.5 w-10">M</th>
                  <th className="text-right p-2.5 w-12">R</th>
                  <th className="text-right p-2.5 w-10">W</th>
                  <th className="text-right p-2.5 w-10">Wd</th>
                  <th className="text-right p-2.5 w-10">Nb</th>
                  <th className="text-right p-2.5 w-14">Econ</th>
                </tr>
              </thead>
              <tbody>
                {data.bowlers.map((bowl, idx) => {
                  const economy = parseFloat(bowl.overs) > 0 ? (bowl.runs / parseFloat(bowl.overs)).toFixed(2) : '-';
                  return (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-2.5 text-white font-medium">{bowl.name}</td>
                      <td className="text-right p-2.5 text-slate-300">{bowl.overs}</td>
                      <td className="text-right p-2.5 text-slate-400">{bowl.maidens}</td>
                      <td className="text-right p-2.5 text-slate-300">{bowl.runs}</td>
                      <td className="text-right p-2.5 font-bold text-blue-400">{bowl.wickets}</td>
                      <td className="text-right p-2.5 text-amber-400 text-xs">{bowl.wides}</td>
                      <td className="text-right p-2.5 text-amber-400 text-xs">{bowl.noBalls}</td>
                      <td className="text-right p-2.5 text-slate-400">{economy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fall of Wickets */}
        {data.fallOfWickets.length > 0 && (
          <div>
            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
              📉 Fall of Wickets
            </h4>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {data.fallOfWickets.map((fow, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="border-red-600/50 text-red-300 text-xs py-1"
                  >
                    <span className="font-bold mr-1">{fow.score}-{fow.wicket}</span>
                    <span className="text-red-400/70">({fow.batsman}, {fow.overs})</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}