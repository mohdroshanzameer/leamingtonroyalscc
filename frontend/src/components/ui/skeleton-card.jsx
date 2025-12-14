import React from 'react';

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-2/3"></div>
            <div className="h-2 bg-slate-300 dark:bg-slate-700 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="flex gap-4 p-3 bg-slate-200 dark:bg-slate-800 rounded-t-lg">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-300 dark:bg-slate-700 rounded flex-1"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-slate-100 dark:bg-slate-800/50">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse p-5 rounded-xl bg-slate-200 dark:bg-slate-800">
          <div className="h-5 w-5 bg-slate-300 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}