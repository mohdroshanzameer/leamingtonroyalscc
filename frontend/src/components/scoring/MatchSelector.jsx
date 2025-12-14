import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Calendar, MapPin, Clock, Users, Plus, Play, RotateCcw } from 'lucide-react';
import QuickTeamDialog from './QuickTeamDialog';

export default function MatchSelector({ matches, onSelect, onTeamCreated, savedStates = [], onResume, onClearBalls }) {
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  
  // Check if match has saved state
  const hasSavedState = (matchId) => savedStates.some(s => s.match_id === matchId);
  const getSavedState = (matchId) => savedStates.find(s => s.match_id === matchId);
  
  // Filter and sort: Live first, then Scheduled sorted by nearest date first
  // TournamentMatch uses: scheduled, live, completed, cancelled, postponed
  const availableMatches = matches
    .filter(m => m.status === 'scheduled' || m.status === 'live' || hasSavedState(m.id))
    .sort((a, b) => {
      // Live matches first
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      // Then sort by date ascending (nearest first)
      return new Date(a.match_date || 0) - new Date(b.match_date || 0);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏏</div>
          <h1 className="text-2xl font-bold text-white mb-2">Live Scoring</h1>
          <p className="text-slate-400">Select a match to start scoring</p>
          
          {/* Quick Create Team Button */}
          <Button
            onClick={() => setShowCreateTeam(true)}
            variant="outline"
            className="mt-4 border-emerald-600 text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50 hover:text-emerald-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Create Team
          </Button>
        </div>

        <div className="space-y-3">
          {availableMatches.map(match => (
            <Card
              key={match.id}
              onClick={() => !hasSavedState(match.id) && onSelect(match)}
              className="cursor-pointer bg-slate-800/70 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={`${
                          match.status === 'live' 
                            ? 'bg-red-500 animate-pulse' 
                            : match.match_date && isToday(parseISO(match.match_date))
                            ? 'bg-green-600 animate-pulse'
                            : match.match_date && isTomorrow(parseISO(match.match_date))
                            ? 'bg-amber-600'
                            : 'bg-emerald-600'
                        } text-white text-xs`}
                      >
                        {match.status === 'live' ? '🔴 LIVE' : match.match_date && isToday(parseISO(match.match_date)) ? '🟢 GO LIVE' : match.match_date && isTomorrow(parseISO(match.match_date)) ? 'Tomorrow' : 'Upcoming'}
                      </Badge>
                      {match.stage && (
                        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                          {match.stage === 'group' ? `Group ${match.group || ''}` : match.stage}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg group-hover:text-emerald-400 transition-colors">
                      {match.team1_name} vs {match.team2_name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {match.match_date && format(new Date(match.match_date), 'dd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {match.match_date && format(new Date(match.match_date), 'HH:mm')}
                      </span>
                    </div>
                    
                    {match.venue && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {match.venue}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {hasSavedState(match.id) ? (
                      <>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResume(match, getSavedState(match.id));
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(match, true); // true = start fresh
                          }}
                          className="text-slate-400 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" /> New
                        </Button>
                      </>
                    ) : (
                      <div className="text-slate-600 group-hover:text-emerald-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {availableMatches.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 opacity-50">📅</div>
              <p className="text-slate-500">No upcoming matches available</p>
              <p className="text-slate-600 text-sm mt-1">Create a match in Admin to start scoring</p>
            </div>
          )}
        </div>
      </div>
      
      <QuickTeamDialog
        open={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onTeamCreated={(team) => {
          onTeamCreated?.(team);
          setShowCreateTeam(false);
        }}
      />
    </div>
  );
}