import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from 'lucide-react';
import QuickAddPlayerDialog from './QuickAddPlayerDialog';

export default function PlayerSelectDialog({ 
  open, 
  onClose, 
  onSelect,
  players = [],
  title = "Select Player",
  excludePlayers = [],
  showStats = false,
  playerStats = {},
  teamId = null,
  teamName = '',
  onPlayerAdded = null,
  // Bowler-specific props
  isBowlerSelect = false,
  bowlerStats = {},        // { bowlerName: { overs: "3.2", completedOvers: 3 } }
  maxOversPerBowler = 0,   // 0 = unlimited
  lastOverBowler = '',     // Bowler who bowled the previous over
}) {
  const [search, setSearch] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  
  // Check if bowler has reached their limit
  const isBowlerAtLimit = (name) => {
    if (!isBowlerSelect || maxOversPerBowler <= 0) return false;
    const stats = bowlerStats[name];
    if (!stats) return false;
    // Parse overs like "3.2" to get completed overs
    const oversStr = stats.overs || '0.0';
    const completedOvers = parseInt(oversStr.split('.')[0]) || 0;
    return completedOvers >= maxOversPerBowler;
  };

  // Check if bowler just completed previous over (can't bowl consecutive)
  const isSameBowlerAsLast = (name) => {
    if (!isBowlerSelect || !lastOverBowler) return false;
    return name === lastOverBowler;
  };

  const filteredPlayers = players.filter(p => {
    const name = p.name || p.player_name || '';
    const isExcluded = excludePlayers.includes(name);
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    return !isExcluded && matchesSearch;
  });

  const handleSelect = (player) => {
    onSelect(player.name || player.player_name);
    setSearch('');
    onClose();
  };

  const getRoleBadge = (role) => {
    const colors = {
      'Batsman': 'bg-green-600',
      'Bowler': 'bg-blue-600',
      'All-Rounder': 'bg-purple-600',
      'Wicket-Keeper': 'bg-amber-600'
    };
    return colors[role] || 'bg-slate-600';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[80vh] [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border-slate-600 pl-9 text-white"
            />
          </div>
          {teamId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAddPlayer(true)}
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
              title="Add new player"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredPlayers.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No players found</p>
          ) : (
            filteredPlayers.map(player => {
              const name = player.name || player.player_name;
              const stats = playerStats[name];
              const bStats = bowlerStats[name];
              const atLimit = isBowlerAtLimit(name);
              const isLastBowler = isSameBowlerAsLast(name);
              const isDisabled = atLimit || isLastBowler;
              
              return (
                <Button
                  key={player.id || name}
                  variant="ghost"
                  onClick={() => !isDisabled && handleSelect(player)}
                  disabled={isDisabled}
                  className={`w-full justify-start h-auto py-3 px-3 text-left ${
                    isDisabled 
                      ? 'bg-slate-800/30 opacity-50 cursor-not-allowed' 
                      : 'bg-slate-800/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isDisabled ? 'bg-slate-600' : 'bg-gradient-to-br from-emerald-600 to-teal-700'
                      }`}>
                        {name?.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDisabled ? 'text-slate-500' : 'text-white'}`}>{name}</p>
                        <div className="flex items-center gap-1">
                          {player.role && (
                            <Badge className={`text-[10px] px-1.5 py-0 ${getRoleBadge(player.role)}`}>
                              {player.role}
                            </Badge>
                          )}
                          {isLastBowler && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-600">
                              Last Over
                            </Badge>
                          )}
                          {atLimit && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-red-600">
                              Limit Reached
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs">
                      {isBowlerSelect && bStats && (
                        <div>
                          <span className="text-blue-400 font-medium">{bStats.wickets || 0}-{bStats.runs || 0}</span>
                          <span className="text-slate-500 ml-1">({bStats.overs || '0.0'})</span>
                        </div>
                      )}
                      {showStats && stats && (
                        <div>
                          <span className="text-emerald-400 font-medium">{stats.runs}</span>
                          <span className="text-slate-500">({stats.balls})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })
          )}
        </div>
        
        {teamId && (
          <QuickAddPlayerDialog
            open={showAddPlayer}
            onClose={() => setShowAddPlayer(false)}
            teamId={teamId}
            teamName={teamName}
            existingPlayers={players}
            onPlayerAdded={(player) => {
              onPlayerAdded?.(player);
              setShowAddPlayer(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}