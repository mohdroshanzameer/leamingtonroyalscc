import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Undo2, SkipForward, Flag, Settings, XCircle, Save } from 'lucide-react';

export default function ActionButtons({ 
  onSwapBatsmen, 
  onUndo, 
  onEndInnings,
  onRetiredHurt,
  canUndo,
  disabled,
  onSettings,
  onAbandon,
  onSave,
  onQuit,
  showLMSBadge
}) {
  return (
    <div className="px-4 space-y-3">
      {/* LMS Badge */}
      {showLMSBadge && (
        <div className="flex justify-center">
          <Badge className="bg-amber-600 text-white">LMS Mode Active</Badge>
        </div>
      )}
      
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onSwapBatsmen}
          disabled={disabled}
          variant="outline"
          className="h-11 border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" /> Swap
        </Button>
        <Button
          onClick={onUndo}
          disabled={!canUndo || disabled}
          variant="outline"
          className="h-11 border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <Undo2 className="w-4 h-4 mr-2" /> Undo
        </Button>
      </div>
      
      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onRetiredHurt}
          disabled={disabled}
          variant="outline"
          className="h-10 border-amber-600/50 text-amber-400 hover:bg-amber-900/30 text-sm"
        >
          <Flag className="w-4 h-4 mr-1" /> Retired
        </Button>
        <Button
          onClick={onEndInnings}
          disabled={disabled}
          variant="outline"
          className="h-10 border-red-600/50 text-red-400 hover:bg-red-900/30 text-sm"
        >
          <SkipForward className="w-4 h-4 mr-1" /> End Innings
        </Button>
      </div>

      {/* Match Control - Save, Settings, Quit, Abandon */}
      <div className="pt-2 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs text-center mb-2">Match Controls</p>
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={onSave}
            variant="outline"
            className="h-12 flex-col gap-0.5 border-green-600/50 text-green-400 hover:bg-green-900/30 text-xs px-1"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </Button>
          <Button
            onClick={onSettings}
            variant="outline"
            className="h-12 flex-col gap-0.5 border-blue-600/50 text-blue-400 hover:bg-blue-900/30 text-xs px-1"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
          <Button
            onClick={onQuit}
            variant="outline"
            className="h-12 flex-col gap-0.5 border-slate-500/50 text-slate-400 hover:bg-slate-700/50 text-xs px-1"
          >
            <XCircle className="w-4 h-4" />
            <span>Quit</span>
          </Button>
          <Button
            onClick={onAbandon}
            variant="outline"
            className="h-12 flex-col gap-0.5 border-orange-600/50 text-orange-400 hover:bg-orange-900/30 text-xs px-1"
          >
            <XCircle className="w-4 h-4" />
            <span>Abandon</span>
          </Button>
        </div>
      </div>
    </div>
  );
}