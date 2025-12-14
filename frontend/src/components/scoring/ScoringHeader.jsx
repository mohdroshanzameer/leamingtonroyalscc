import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Tv, Settings, RotateCcw } from 'lucide-react';

export default function ScoringHeader({ 
  match, 
  battingTeam, 
  bowlingTeam,
  innings,
  onBack, 
  onSettings,
  onStreamOverlay 
}) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-700 -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white font-semibold text-sm">{battingTeam}</span>
              <span className="text-slate-500">vs</span>
              <span className="text-slate-400 text-sm">{bowlingTeam}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <Badge className={`text-[10px] px-1.5 py-0 ${innings === 1 ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                {innings === 1 ? '1ST INNINGS' : '2ND INNINGS'}
              </Badge>
              {match?.match_type && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400">
                  {match.match_type}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onStreamOverlay}
              className="text-red-400 hover:text-red-300 hover:bg-slate-700 h-8 w-8"
            >
              <Tv className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onSettings}
              className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}