import React from 'react';

const EXTRA_CONFIGS = {
  bye: {
    title: 'Byes',
    description: null,
    baseColor: 'bg-orange-600 hover:bg-orange-700',
    fourColor: 'bg-green-600 hover:bg-green-700',
    options: [1, 2, 3, 4],
    showPlus: false,
  },
  leg_bye: {
    title: 'Leg Byes',
    description: null,
    baseColor: 'bg-orange-700 hover:bg-orange-800',
    fourColor: 'bg-green-600 hover:bg-green-700',
    options: [1, 2, 3, 4],
    showPlus: false,
  },
  wide: {
    title: 'Wide',
    description: '1 Wide + additional byes',
    baseColor: 'bg-amber-600 hover:bg-amber-700',
    options: [0, 1, 2, 3],
    extended: [4, 6],
    showPlus: true,
  },
  no_ball: {
    title: 'No Ball',
    description: '1 No Ball + runs off bat',
    baseColor: 'bg-amber-700 hover:bg-amber-800',
    options: [0, 1, 2, 3],
    extended: [4, 6],
    showPlus: true,
  },
};

export default function ExtraRunDialog({ type, open, onClose, onSelect }) {
  if (!open || !type) return null;
  
  const config = EXTRA_CONFIGS[type];
  if (!config) return null;

  const handleSelect = (runs) => {
    onSelect(type, runs);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-w-xs w-full" 
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white text-center font-semibold mb-1">{config.title}</h3>
        {config.description && (
          <p className="text-slate-400 text-xs text-center mb-3">{config.description}</p>
        )}
        <div className="grid grid-cols-4 gap-2">
          {config.options.map(r => (
            <button
              key={r}
              onClick={() => handleSelect(r)}
              className={`h-14 text-xl font-bold rounded-lg text-white ${
                r === 4 && config.fourColor ? config.fourColor : config.baseColor
              }`}
            >
              {config.showPlus ? `+${r}` : r}
            </button>
          ))}
        </div>
        {config.extended && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
              onClick={() => handleSelect(4)} 
              className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
            >
              +4
            </button>
            <button 
              onClick={() => handleSelect(6)} 
              className="h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
            >
              +6
            </button>
          </div>
        )}
      </div>
    </div>
  );
}