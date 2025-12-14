import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TossScreen({ 
  homeTeamName, 
  awayTeamName, 
  onComplete,
  onBack 
}) {
  const [tossWinner, setTossWinner] = useState(null);

  const handleDecision = (decision) => {
    const battingFirst = decision === 'bat' ? tossWinner : (tossWinner === 'home' ? 'away' : 'home');
    onComplete({
      tossWinner,
      tossDecision: decision,
      battingFirst,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-800/80 border-slate-700 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="text-5xl mb-4">🪙</div>
          <CardTitle className="text-white text-2xl">Toss</CardTitle>
          <p className="text-slate-400 mt-1">{homeTeamName} vs {awayTeamName}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Toss Winner Selection */}
          <div className="text-center">
            <p className="text-slate-300 mb-4 font-medium">Who won the toss?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setTossWinner('home')}
                className={`h-16 text-base font-semibold transition-all ${
                  tossWinner === 'home' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-800' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {homeTeamName}
              </Button>
              <Button
                onClick={() => setTossWinner('away')}
                className={`h-16 text-base font-semibold transition-all ${
                  tossWinner === 'away' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-800' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {awayTeamName}
              </Button>
            </div>
          </div>

          {/* Decision Selection */}
          {tossWinner && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <p className="text-slate-300 mb-4 font-medium">
                <span className="text-amber-400">{tossWinner === 'home' ? homeTeamName : awayTeamName}</span> elected to?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleDecision('bat')}
                  className="h-16 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                >
                  <span className="text-2xl mr-2">🏏</span> Bat First
                </Button>
                <Button
                  onClick={() => handleDecision('bowl')}
                  className="h-16 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <span className="text-2xl mr-2">🎯</span> Bowl First
                </Button>
              </div>
            </div>
          )}

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full text-white bg-slate-700/50 hover:text-white hover:bg-slate-600/50"
          >
            ← Back to Match Selection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}