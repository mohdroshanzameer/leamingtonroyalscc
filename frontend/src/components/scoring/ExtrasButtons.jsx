import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ExtrasButtons({ onExtra, disabled, wideRuns = 1, noBallRuns = 1, compact = false }) {
  const [showWideDialog, setShowWideDialog] = useState(false);
  const [showNoBallDialog, setShowNoBallDialog] = useState(false);
  const [showByeDialog, setShowByeDialog] = useState(false);
  const [showLegByeDialog, setShowLegByeDialog] = useState(false);

  const handleWide = (additionalRuns) => {
    onExtra('wide', additionalRuns, 0);
    setShowWideDialog(false);
  };

  const handleNoBall = (runsOffBat) => {
    onExtra('no_ball', runsOffBat, runsOffBat);
    setShowNoBallDialog(false);
  };

  const handleBye = (runs) => {
    onExtra('bye', runs, 0);
    setShowByeDialog(false);
  };

  const handleLegBye = (runs) => {
    onExtra('leg_bye', runs, 0);
    setShowLegByeDialog(false);
  };

  if (compact) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1.5">
          <Button 
            onClick={() => setShowWideDialog(true)} 
            disabled={disabled}
            className="h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm"
          >
            Wd+
          </Button>
          <Button 
            onClick={() => setShowNoBallDialog(true)} 
            disabled={disabled}
            className="h-12 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm"
          >
            Nb+
          </Button>
        </div>

        {/* Dialogs remain same */}
        <Dialog open={showWideDialog} onOpenChange={setShowWideDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-white text-center">Wide + Runs</DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm text-center mb-4">1 Wide + additional byes</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(r => (
                <Button key={r} onClick={() => handleWide(r)} className="h-14 text-xl font-bold bg-amber-600 hover:bg-amber-700">+{r}</Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button onClick={() => handleWide(4)} className="h-12 bg-green-600 hover:bg-green-700 font-bold">+4</Button>
              <Button onClick={() => handleWide(6)} className="h-12 bg-purple-600 hover:bg-purple-700 font-bold">+6</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showNoBallDialog} onOpenChange={setShowNoBallDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-white text-center">No Ball + Runs</DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm text-center mb-4">1 No Ball + runs off bat</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(r => (
                <Button key={r} onClick={() => handleNoBall(r)} className="h-14 text-xl font-bold bg-amber-700 hover:bg-amber-800">+{r}</Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button onClick={() => handleNoBall(4)} className="h-12 bg-green-600 hover:bg-green-700 font-bold">+4</Button>
              <Button onClick={() => handleNoBall(6)} className="h-12 bg-purple-600 hover:bg-purple-700 font-bold">+6</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showByeDialog} onOpenChange={setShowByeDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
            <DialogHeader><DialogTitle className="text-white text-center">Byes</DialogTitle></DialogHeader>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <Button key={r} onClick={() => handleBye(r)} className={`h-14 text-xl font-bold ${r === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>{r}</Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showLegByeDialog} onOpenChange={setShowLegByeDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
            <DialogHeader><DialogTitle className="text-white text-center">Leg Byes</DialogTitle></DialogHeader>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <Button key={r} onClick={() => handleLegBye(r)} className={`h-14 text-xl font-bold ${r === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-700 hover:bg-orange-800'}`}>{r}</Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="px-4 space-y-2">
      {/* Primary Extras */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={() => setShowWideDialog(true)} 
          disabled={disabled}
          className="h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
        >
          Wide +
        </Button>
        <Button 
          onClick={() => setShowNoBallDialog(true)} 
          disabled={disabled}
          className="h-12 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl"
        >
          No Ball +
        </Button>
      </div>
      
      {/* Secondary Extras */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={() => setShowByeDialog(true)} 
          disabled={disabled}
          className="h-10 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl text-sm"
        >
          Bye
        </Button>
        <Button 
          onClick={() => setShowLegByeDialog(true)} 
          disabled={disabled}
          className="h-10 bg-orange-700 hover:bg-orange-800 text-white font-medium rounded-xl text-sm"
        >
          Leg Bye
        </Button>
      </div>

      {/* Wide Dialog */}
      <Dialog open={showWideDialog} onOpenChange={setShowWideDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-white text-center">Wide + Runs</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm text-center mb-4">1 Wide + additional byes</p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(r => (
              <Button
                key={r}
                onClick={() => handleWide(r)}
                className="h-14 text-xl font-bold bg-amber-600 hover:bg-amber-700"
              >
                +{r}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button onClick={() => handleWide(4)} className="h-12 bg-green-600 hover:bg-green-700 font-bold">
              +4
            </Button>
            <Button onClick={() => handleWide(6)} className="h-12 bg-purple-600 hover:bg-purple-700 font-bold">
              +6
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Ball Dialog */}
      <Dialog open={showNoBallDialog} onOpenChange={setShowNoBallDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-white text-center">No Ball + Runs</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm text-center mb-4">1 No Ball + runs off bat</p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(r => (
              <Button
                key={r}
                onClick={() => handleNoBall(r)}
                className="h-14 text-xl font-bold bg-amber-700 hover:bg-amber-800"
              >
                +{r}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button onClick={() => handleNoBall(4)} className="h-12 bg-green-600 hover:bg-green-700 font-bold">
              +4
            </Button>
            <Button onClick={() => handleNoBall(6)} className="h-12 bg-purple-600 hover:bg-purple-700 font-bold">
              +6
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bye Dialog */}
      <Dialog open={showByeDialog} onOpenChange={setShowByeDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-white text-center">Byes</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(r => (
              <Button
                key={r}
                onClick={() => handleBye(r)}
                className={`h-14 text-xl font-bold ${r === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {r}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Leg Bye Dialog */}
      <Dialog open={showLegByeDialog} onOpenChange={setShowLegByeDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-white text-center">Leg Byes</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(r => (
              <Button
                key={r}
                onClick={() => handleLegBye(r)}
                className={`h-14 text-xl font-bold ${r === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-700 hover:bg-orange-800'}`}
              >
                {r}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}