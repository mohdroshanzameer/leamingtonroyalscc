import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Scorecard({ 
  open, 
  onClose,
  innings1Data,
  innings2Data,
  battingTeam1,
  battingTeam2,
  currentInnings
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Full Scorecard</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={`innings-${currentInnings}`} className="w-full">
          <TabsList className="w-full bg-slate-800">
            <TabsTrigger value="innings-1" className="flex-1 data-[state=active]:bg-emerald-600">
              1st Innings
            </TabsTrigger>
            <TabsTrigger value="innings-2" className="flex-1 data-[state=active]:bg-blue-600">
              2nd Innings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="innings-1" className="mt-4">
            <InningsScorecard 
              data={innings1Data} 
              battingTeam={battingTeam1}
            />
          </TabsContent>
          
          <TabsContent value="innings-2" className="mt-4">
            <InningsScorecard 
              data={innings2Data} 
              battingTeam={battingTeam2}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InningsScorecard({ data, battingTeam }) {
  if (!data || !data.batsmen || data.batsmen.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Innings not started yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[50vh]">
      <div className="space-y-4">
        {/* Batting */}
        <div>
          <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
            🏏 {battingTeam} Batting
          </h4>
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left p-2">Batsman</th>
                  <th className="text-right p-2">R</th>
                  <th className="text-right p-2">B</th>
                  <th className="text-right p-2">4s</th>
                  <th className="text-right p-2">6s</th>
                  <th className="text-right p-2">SR</th>
                </tr>
              </thead>
              <tbody>
                {data.batsmen.map((bat, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 text-white">
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className={bat.isOut ? 'text-slate-400' : 'text-white'}>
                          {bat.name}
                          {bat.isBatting && !bat.isOut && <span className="text-emerald-400 ml-1">*</span>}
                        </span>
                        {bat.dismissal && (
                          <span className="text-[10px] text-slate-500">{bat.dismissal}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-2 font-bold">{bat.runs}</td>
                    <td className="text-right p-2 text-slate-400">{bat.balls}</td>
                    <td className="text-right p-2 text-green-400">{bat.fours}</td>
                    <td className="text-right p-2 text-purple-400">{bat.sixes}</td>
                    <td className="text-right p-2 text-slate-400">
                      {bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Extras */}
          <div className="flex items-center justify-between mt-2 px-2 text-sm">
            <span className="text-slate-400">Extras</span>
            <span className="text-white">
              {data.extras?.total || 0}
              <span className="text-xs text-slate-500 ml-1">
                (W:{data.extras?.wides || 0}, NB:{data.extras?.noBalls || 0}, B:{data.extras?.byes || 0}, LB:{data.extras?.legByes || 0})
              </span>
            </span>
          </div>
          
          {/* Total */}
          <div className="flex items-center justify-between mt-2 px-2 py-2 bg-slate-800 rounded text-base font-bold">
            <span className="text-white">Total</span>
            <span className="text-white">
              {data.total?.runs || 0}/{data.total?.wickets || 0}
              <span className="text-slate-400 font-normal text-sm ml-1">
                ({data.total?.overs || '0.0'} ov)
              </span>
            </span>
          </div>
        </div>

        {/* Bowling */}
        {data.bowlers && data.bowlers.length > 0 && (
          <div>
            <h4 className="text-blue-400 font-semibold mb-2">🎯 Bowling</h4>
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left p-2">Bowler</th>
                    <th className="text-right p-2">O</th>
                    <th className="text-right p-2">M</th>
                    <th className="text-right p-2">R</th>
                    <th className="text-right p-2">W</th>
                    <th className="text-right p-2">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bowlers.map((bowl, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 text-white">
                      <td className="p-2">
                        {bowl.name}
                        {bowl.isBowling && <span className="text-blue-400 ml-1">*</span>}
                      </td>
                      <td className="text-right p-2">{bowl.overs}</td>
                      <td className="text-right p-2 text-slate-400">{bowl.maidens}</td>
                      <td className="text-right p-2">{bowl.runs}</td>
                      <td className="text-right p-2 font-bold text-blue-400">{bowl.wickets}</td>
                      <td className="text-right p-2 text-slate-400">
                        {parseFloat(bowl.overs) > 0 ? (bowl.runs / parseFloat(bowl.overs)).toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fall of Wickets */}
        {data.fallOfWickets && data.fallOfWickets.length > 0 && (
          <div>
            <h4 className="text-red-400 font-semibold mb-2">📉 Fall of Wickets</h4>
            <div className="flex flex-wrap gap-2">
              {data.fallOfWickets.map((fow, idx) => (
                <Badge key={idx} variant="outline" className="border-red-600/50 text-red-300 text-xs">
                  {fow.score}/{fow.wicket} ({fow.batsman}, {fow.overs} ov)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}