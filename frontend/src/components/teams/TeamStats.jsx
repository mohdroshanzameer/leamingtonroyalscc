import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, XCircle, Minus, TrendingUp, Users } from 'lucide-react';

export default function TeamStats({ team, matches, players }) {
  // Calculate team statistics - using TournamentMatch schema
  const teamMatches = matches?.filter(m => 
    m.team1_id === team?.id || m.team2_id === team?.id || 
    (team?.is_home_team && m.status === 'completed')
  ) || [];
  
  const stats = {
    played: teamMatches.filter(m => m.status === 'completed').length,
    won: teamMatches.filter(m => m.winner_id === team?.id || (team?.is_home_team && m.winner_name)).length,
    lost: teamMatches.filter(m => m.status === 'completed' && m.winner_id && m.winner_id !== team?.id).length,
    draw: teamMatches.filter(m => m.status === 'completed' && !m.winner_id).length,
    players: players?.length || 0,
  };
  
  stats.winRate = stats.played > 0 ? ((stats.won / stats.played) * 100).toFixed(0) : 0;

  const statCards = [
    { label: 'Matches', value: stats.played, icon: Target, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Won', value: stats.won, icon: Trophy, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Lost', value: stats.lost, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Draw', value: stats.draw, icon: Minus, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Win Rate', value: `${stats.winRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Squad', value: stats.players, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {statCards.map((stat, idx) => (
        <Card key={idx} className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className={`w-8 h-8 mx-auto rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}