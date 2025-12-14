import React, { useEffect, useState } from 'react';

export default function BoundaryAnimation({ type, onComplete }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  const isSix = type === 6;
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className={`animate-bounce ${isSix ? 'text-purple-400' : 'text-green-400'}`}>
        <div className="relative">
          {/* Main number */}
          <span className={`text-[150px] font-black drop-shadow-2xl ${
            isSix ? 'text-purple-500' : 'text-green-500'
          }`} style={{
            textShadow: isSix 
              ? '0 0 60px rgba(168,85,247,0.8), 0 0 120px rgba(168,85,247,0.4)'
              : '0 0 60px rgba(34,197,94,0.8), 0 0 120px rgba(34,197,94,0.4)'
          }}>
            {type}
          </span>
          
          {/* Explosion particles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-4 h-4 rounded-full ${
                  isSix ? 'bg-purple-400' : 'bg-green-400'
                }`}
                style={{
                  animation: 'explode 1s ease-out forwards',
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  opacity: 0.8
                }}
              />
            ))}
          </div>
          
          {/* Label */}
          <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-2xl font-bold uppercase tracking-widest ${
            isSix ? 'text-purple-300' : 'text-green-300'
          }`}>
            {isSix ? '🚀 MAXIMUM!' : '🏏 FOUR!'}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes explode {
          0% { transform: rotate(var(--rotation)) translateY(0); opacity: 1; }
          100% { transform: rotate(var(--rotation)) translateY(-150px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}