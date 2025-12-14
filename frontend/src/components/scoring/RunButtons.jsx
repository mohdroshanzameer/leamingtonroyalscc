import React from 'react';
import { Button } from "@/components/ui/button";
import { Keyboard } from 'lucide-react';

export default function RunButtons({ onRun, disabled, isFreeHit }) {
  const runButtons = [
    { value: 0, label: '0', className: 'bg-slate-700 hover:bg-slate-600' },
    { value: 1, label: '1', className: 'bg-slate-700 hover:bg-slate-600' },
    { value: 2, label: '2', className: 'bg-slate-700 hover:bg-slate-600' },
    { value: 3, label: '3', className: 'bg-slate-700 hover:bg-slate-600' },
    { value: 4, label: '4', className: 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400/30' },
    { value: 5, label: '5', className: 'bg-slate-700 hover:bg-slate-600' },
    { value: 6, label: '6', className: 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-400/30' },
  ];

  return (
    <div className="px-4">
      {isFreeHit && (
        <div className="bg-red-600 text-white text-center py-2 rounded-lg mb-3 font-bold animate-pulse flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-full bg-white animate-ping" />
          FREE HIT
          <span className="w-3 h-3 rounded-full bg-white animate-ping" />
        </div>
      )}
      
      {/* Keyboard hint */}
      <div className="flex items-center justify-center gap-1 text-slate-600 text-[10px] mb-2">
        <Keyboard className="w-3 h-3" />
        <span>Press 0-6 for runs, W for wicket, ? for help</span>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {runButtons.map(({ value, label, className }) => (
          <Button
            key={value}
            onClick={() => onRun(value)}
            disabled={disabled}
            className={`h-14 text-xl font-bold rounded-xl shadow-lg transition-transform active:scale-95 ${className}`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}