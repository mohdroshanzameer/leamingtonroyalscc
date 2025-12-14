import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TournamentPointsTable({ tournament, teams }) {
  const approvedTeams = teams.filter(t => t.registration_status === 'approved');

  const sortedTeams = useMemo(() => {
    return [...approvedTeams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.nrr || 0) - (a.nrr || 0);
    });
  }, [approvedTeams]);

  const groups = useMemo(() => {
    if (tournament.format !== 'group_knockout') return null;
    const groupLetters = [...new Set(approvedTeams.map(t => t.group).filter(Boolean))].sort();
    return groupLetters.map(letter => ({
      name: letter,
      teams: approvedTeams.filter(t => t.group === letter).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.nrr || 0) - (a.nrr || 0);
      })
    }));
  }, [approvedTeams, tournament.format]);

  if (approvedTeams.length === 0) {
    return (
      <Card className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No Teams Yet</h3>
        <p className="text-slate-500 mt-1">Add teams to see the standings</p>
      </Card>
    );
  }

  const PointsTableContent = ({ teamsData, qualifyingPositions = 0 }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="text-left p-3 font-semibold">#</th>
            <th className="text-left p-3 font-semibold">Team</th>
            <th className="text-center p-3 font-semibold">P</th>
            <th className="text-center p-3 font-semibold">W</th>
            <th className="text-center p-3 font-semibold">L</th>
            <th className="text-center p-3 font-semibold">T</th>
            <th className="text-center p-3 font-semibold">NR</th>
            <th className="text-center p-3 font-semibold">Pts</th>
            <th className="text-center p-3 font-semibold">NRR</th>
          </tr>
        </thead>
        <tbody>
          {teamsData.map((team, index) => {
            const position = index + 1;
            const isQualifying = qualifyingPositions > 0 && position <= qualifyingPositions;
            return (
              <tr key={team.id} className={`border-b hover:bg-slate-50 ${isQualifying ? 'bg-emerald-50' : team.is_eliminated ? 'bg-red-50 opacity-60' : ''}`}>
                <td className="p-3">
                  {position <= 3 && !team.is_eliminated ? (
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${position === 1 ? 'bg-amber-500' : position === 2 ? 'bg-slate-400' : 'bg-amber-700'}`}>{position}</span>
                  ) : (
                    <span className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-bold">{position}</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{team.team_name}</span>
                    {isQualifying && <Badge className="bg-emerald-500 text-white text-xs ml-1">Q</Badge>}
                  </div>
                </td>
                <td className="text-center p-3 font-medium">{team.matches_played || 0}</td>
                <td className="text-center p-3 text-emerald-600 font-medium">{team.matches_won || 0}</td>
                <td className="text-center p-3 text-red-600 font-medium">{team.matches_lost || 0}</td>
                <td className="text-center p-3 text-amber-600">{team.matches_tied || 0}</td>
                <td className="text-center p-3 text-slate-500">{team.matches_nr || 0}</td>
                <td className="text-center p-3"><span className="font-bold text-lg">{team.points || 0}</span></td>
                <td className="text-center p-3">
                  <div className="flex items-center justify-center gap-1">
                    {(team.nrr || 0) > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : (team.nrr || 0) < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-slate-400" />}
                    <span className={`font-medium ${(team.nrr || 0) > 0 ? 'text-emerald-600' : (team.nrr || 0) < 0 ? 'text-red-600' : 'text-slate-500'}`}>{(team.nrr || 0) > 0 ? '+' : ''}{(team.nrr || 0).toFixed(3)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (tournament.format === 'group_knockout' && groups && groups.length > 0) {
    return (
      <Tabs defaultValue={groups[0]?.name} className="w-full">
        <TabsList className="mb-4">{groups.map(g => (<TabsTrigger key={g.name} value={g.name}>Group {g.name}</TabsTrigger>))}</TabsList>
        {groups.map(g => (
          <TabsContent key={g.name} value={g.name}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{g.name}</span>Group {g.name} Standings</CardTitle></CardHeader>
              <CardContent className="p-0"><PointsTableContent teamsData={g.teams} qualifyingPositions={tournament.teams_qualify_per_group || 2} /></CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Standings</CardTitle></CardHeader>
      <CardContent className="p-0"><PointsTableContent teamsData={sortedTeams} /></CardContent>
      <div className="p-4 border-t bg-slate-50 text-xs text-slate-500">P = Played, W = Won, L = Lost, T = Tied, NR = No Result, Pts = Points, NRR = Net Run Rate</div>
    </Card>
  );
}