import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WICKET_TYPES = [
  { value: 'bowled', label: 'Bowled', icon: '🏏', bowlerCredit: true },
  { value: 'caught', label: 'Caught', icon: '🙌', bowlerCredit: true, needsFielder: true },
  { value: 'caught_behind', label: 'Caught Behind', icon: '🧤', bowlerCredit: true, needsFielder: true },
  { value: 'caught_and_bowled', label: 'Caught & Bowled', icon: '🎯', bowlerCredit: true },
  { value: 'lbw', label: 'LBW', icon: '🦵', bowlerCredit: true },
  { value: 'stumped', label: 'Stumped', icon: '⚡', bowlerCredit: true, needsFielder: true },
  { value: 'run_out', label: 'Run Out', icon: '🏃', bowlerCredit: false, needsFielder: true, canSelectBatsman: true },
  { value: 'hit_wicket', label: 'Hit Wicket', icon: '💥', bowlerCredit: true },
  { value: 'obstructing_field', label: 'Obstructing Field', icon: '🚫', bowlerCredit: false },
  { value: 'timed_out', label: 'Timed Out', icon: '⏰', bowlerCredit: false },
];

export default function WicketDialog({ 
  open, 
  onClose, 
  onWicket,
  striker,
  nonStriker,
  bowler,
  fieldingTeamPlayers = [],
  isFreeHit
}) {
  const [selectedType, setSelectedType] = useState(null);
  const [fielder, setFielder] = useState('');
  const [dismissedBatsman, setDismissedBatsman] = useState('striker');
  const [runsBeforeWicket, setRunsBeforeWicket] = useState(0);

  const handleConfirm = () => {
    const wicketType = WICKET_TYPES.find(t => t.value === selectedType);
    onWicket({
      type: selectedType,
      fielder: wicketType?.needsFielder ? fielder : null,
      dismissedBatsman: wicketType?.canSelectBatsman ? 
        (dismissedBatsman === 'striker' ? striker : nonStriker) : striker,
      runsBeforeWicket,
      bowlerCredit: wicketType?.bowlerCredit || false
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedType(null);
    setFielder('');
    setDismissedBatsman('striker');
    setRunsBeforeWicket(0);
    onClose();
  };

  const allowedTypes = isFreeHit 
    ? WICKET_TYPES.filter(t => t.value === 'run_out' || t.value === 'obstructing_field')
    : WICKET_TYPES;

  const selectedWicketType = WICKET_TYPES.find(t => t.value === selectedType);

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-sm [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-lg">
            {isFreeHit ? '🔴 Free Hit - Run Out Only' : 'How Out?'}
          </DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {allowedTypes.map(type => (
              <Button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className="h-14 bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-lg">{type.icon}</span>
                <span className="text-xs">{type.label}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-3 bg-red-900/50 rounded-lg">
              <span className="text-2xl">{selectedWicketType?.icon}</span>
              <p className="text-white font-semibold mt-1">{selectedWicketType?.label}</p>
            </div>

            {/* Run Out: Select which batsman */}
            {selectedWicketType?.canSelectBatsman && (
              <div className="space-y-2">
                <Label className="text-slate-300">Who was run out?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setDismissedBatsman('striker')}
                    className={dismissedBatsman === 'striker' ? 'bg-red-600' : 'bg-slate-700'}
                  >
                    {striker} (Striker)
                  </Button>
                  <Button
                    onClick={() => setDismissedBatsman('nonStriker')}
                    className={dismissedBatsman === 'nonStriker' ? 'bg-red-600' : 'bg-slate-700'}
                  >
                    {nonStriker}
                  </Button>
                </div>
              </div>
            )}

            {/* Runs before run out */}
            {selectedType === 'run_out' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Runs completed before wicket</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map(r => (
                    <Button
                      key={r}
                      onClick={() => setRunsBeforeWicket(r)}
                      className={`h-10 ${runsBeforeWicket === r ? 'bg-emerald-600' : 'bg-slate-700'}`}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Fielder selection */}
            {selectedWicketType?.needsFielder && (
              <div className="space-y-2">
                <Label className="text-slate-300">Fielder</Label>
                <Select value={fielder} onValueChange={setFielder}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue placeholder="Select fielder" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {fieldingTeamPlayers.map(p => (
                      <SelectItem key={p.id || p.name} value={p.name || p.player_name}>
                        {p.name || p.player_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedType(null)} className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white">
                Back
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedWicketType?.needsFielder && !fielder}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Wicket
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}