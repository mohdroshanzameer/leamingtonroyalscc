import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudRain, Calculator, AlertTriangle, Check, Info } from 'lucide-react';
import { 
  calculateRevisedTarget, 
  getDLSSituation, 
  getResourcesRemaining,
  parseOvers 
} from './DLSCalculator';

export default function DLSDialog({
  open,
  onClose,
  match,
  innings1Score,
  innings1Overs,
  innings2Score,
  innings2Overs,
  innings2Wickets,
  onApplyDLS,
  currentInnings
}) {
  const [activeTab, setActiveTab] = useState('calculate');
  const [team2RevisedOvers, setTeam2RevisedOvers] = useState(match?.overs || 20);
  const [interruptionOvers, setInterruptionOvers] = useState('');
  const [interruptionWickets, setInterruptionWickets] = useState(0);
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [currentSituation, setCurrentSituation] = useState(null);

  // Calculate current DLS situation when in 2nd innings
  useEffect(() => {
    if (currentInnings === 2 && innings1Score > 0) {
      const situation = getDLSSituation({
        team1Score: innings1Score,
        team1Overs: parseOvers(innings1Overs),
        team2Score: innings2Score,
        team2OversUsed: parseOvers(innings2Overs),
        team2WicketsLost: innings2Wickets,
        team2TotalOvers: match?.dls_team2_overs || match?.overs || 20,
        isReduced: match?.is_dls_affected,
        revisedTarget: match?.dls_target
      });
      setCurrentSituation(situation);
    }
  }, [innings1Score, innings1Overs, innings2Score, innings2Overs, innings2Wickets, match, currentInnings]);

  // Calculate revised target
  const handleCalculate = () => {
    const result = calculateRevisedTarget(
      innings1Score,
      parseOvers(innings1Overs),
      match?.overs || 20,
      team2RevisedOvers,
      parseInt(interruptionWickets) || 0,
      0
    );
    setCalculatedResult(result);
  };

  // Apply DLS to match
  const handleApply = () => {
    if (calculatedResult) {
      onApplyDLS({
        is_dls_affected: true,
        dls_team2_overs: team2RevisedOvers,
        dls_target: calculatedResult.target,
        dls_par_score: calculatedResult.parScore,
        status: 'DLS'
      });
      onClose();
    }
  };

  // Get resource percentage for display
  const getResourceDisplay = (overs, wickets = 0) => {
    const resources = getResourcesRemaining(overs, wickets);
    return resources.toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-400" />
            DLS Method Calculator
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800">
            <TabsTrigger value="calculate" className="flex-1">Calculate Target</TabsTrigger>
            <TabsTrigger value="situation" className="flex-1" disabled={currentInnings !== 2}>
              Current Situation
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex-1">Resource Table</TabsTrigger>
          </TabsList>

          {/* Calculate Target Tab */}
          <TabsContent value="calculate" className="space-y-4 mt-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                1st Innings Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Score:</span>
                  <span className="text-white ml-2 font-bold">{innings1Score || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Overs:</span>
                  <span className="text-white ml-2">{innings1Overs || match?.overs || 20}</span>
                </div>
                <div>
                  <span className="text-slate-400">Resources:</span>
                  <span className="text-emerald-400 ml-2">{getResourceDisplay(parseOvers(innings1Overs) || match?.overs || 20)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-slate-300">Revised Overs for Team 2</Label>
                <Input
                  type="number"
                  value={team2RevisedOvers}
                  onChange={(e) => setTeam2RevisedOvers(parseFloat(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-600 mt-1"
                  min={1}
                  max={match?.overs || 50}
                  step={0.1}
                />
              </div>

              <div>
                <Label className="text-slate-300">Wickets at Interruption (if during innings)</Label>
                <Input
                  type="number"
                  value={interruptionWickets}
                  onChange={(e) => setInterruptionWickets(e.target.value)}
                  className="bg-slate-800 border-slate-600 mt-1"
                  min={0}
                  max={9}
                />
              </div>

              <Button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700">
                <Calculator className="w-4 h-4 mr-2" /> Calculate Revised Target
              </Button>
            </div>

            {calculatedResult && (
              <Card className="bg-gradient-to-r from-blue-900/50 to-slate-800 border-blue-700/50 p-4">
                <h4 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" /> DLS Calculation Result
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase">Revised Target</p>
                    <p className="text-3xl font-bold text-white">{calculatedResult.target}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase">Par Score</p>
                    <p className="text-3xl font-bold text-emerald-400">{calculatedResult.parScore}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded">
                    <p className="text-slate-500 text-xs">Team 1 Resources</p>
                    <p className="text-white font-medium">{calculatedResult.team1Resources.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded">
                    <p className="text-slate-500 text-xs">Team 2 Resources</p>
                    <p className="text-white font-medium">{calculatedResult.team2RevisedResources.toFixed(1)}%</p>
                  </div>
                </div>

                <Button onClick={handleApply} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                  Apply DLS Target to Match
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Current Situation Tab */}
          <TabsContent value="situation" className="space-y-4 mt-4">
            {currentSituation ? (
              <div className="space-y-4">
                <Card className={`p-4 border ${
                  currentSituation.isAbovePar 
                    ? 'bg-emerald-900/30 border-emerald-700/50' 
                    : currentSituation.isBelowPar 
                      ? 'bg-red-900/30 border-red-700/50'
                      : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Current Position</p>
                    <p className={`text-2xl font-bold ${
                      currentSituation.isAbovePar ? 'text-emerald-400' : 
                      currentSituation.isBelowPar ? 'text-red-400' : 'text-white'
                    }`}>
                      {currentSituation.isAbovePar && '+'}
                      {currentSituation.runsAhead} runs {currentSituation.isAbovePar ? 'ahead' : currentSituation.isBelowPar ? 'behind' : 'on par'}
                    </p>
                  </div>
                </Card>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase">Current Score</p>
                    <p className="text-xl font-bold text-white">{currentSituation.team2Score}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase">Par Score</p>
                    <p className="text-xl font-bold text-blue-400">{currentSituation.parScore}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase">Target</p>
                    <p className="text-xl font-bold text-amber-400">{currentSituation.target}</p>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">
                    If match stops now: Team 2 {currentSituation.isAbovePar ? 
                      <span className="text-emerald-400 font-medium">wins by DLS method</span> : 
                      currentSituation.isBelowPar ?
                        <span className="text-red-400 font-medium">loses by DLS method</span> :
                        <span className="text-amber-400 font-medium">match tied</span>
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CloudRain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>DLS situation available during 2nd innings</p>
              </div>
            )}
          </TabsContent>

          {/* Resource Table Tab */}
          <TabsContent value="resources" className="mt-4">
            <div className="bg-slate-800 rounded-lg p-3 mb-3">
              <p className="text-slate-400 text-xs">
                Resources remaining (%) based on overs and wickets. This is the Standard Edition table.
              </p>
            </div>
            
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-800">
                  <tr>
                    <th className="p-1.5 text-left text-slate-400">Overs</th>
                    {[0,1,2,3,4,5,6,7,8,9].map(w => (
                      <th key={w} className="p-1.5 text-center text-slate-400">{w}W</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[20, 18, 16, 14, 12, 10, 8, 6, 5, 4, 3, 2, 1].map(overs => (
                    <tr key={overs} className="border-t border-slate-700/50">
                      <td className="p-1.5 text-slate-300 font-medium">{overs}</td>
                      {[0,1,2,3,4,5,6,7,8,9].map(w => (
                        <td key={w} className="p-1.5 text-center text-slate-400">
                          {getResourceDisplay(overs, w)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-amber-900/30 rounded-lg border border-amber-700/50 mt-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200 text-xs">
            This uses the Standard Edition DLS method. Professional matches use the more complex Professional Edition 
            which requires proprietary calculations.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}