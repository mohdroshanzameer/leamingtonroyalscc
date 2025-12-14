import React from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Zap, Award, TrendingUp } from 'lucide-react';

export default function TournamentStats({ tournament }) {
  const { data: players = [] } = useQuery({
    queryKey: ['tournamentPlayers', tournament.id],
    queryFn: () => api.entities.TournamentPlayer.filter({ tournament_id: tournament.id }),
    enabled: !!tournament.id,
  });

  const topRunScorers = [...players].filter(p => p.runs_scored > 0).sort((a, b) => b.runs_scored - a.runs_scored).slice(0, 10);
  const topWicketTakers = [...players].filter(p => p.wickets_taken > 0).sort((a, b) => b.wickets_taken - a.wickets_taken).slice(0, 10);
  const topStrikeRates = [...players].filter(p => p.balls_faced >= 20).sort((a, b) => b.strike_rate - a.strike_rate).slice(0, 10);
  const topEconomy = [...players].filter(p => p.overs_bowled >= 5).sort((a, b) => a.economy - b.economy).slice(0, 10);
  const mostSixes = [...players].filter(p => p.sixes > 0).sort((a, b) => b.sixes - a.sixes).slice(0, 10);
  const hasStats = players.some(p => p.runs_scored > 0 || p.wickets_taken > 0);

  if (!hasStats) {
    return (
      <Card className="text-center py-12">
        <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No Stats Yet</h3>
        <p className="text-slate-500 mt-1">Statistics will appear after matches are played</p>
      </Card>
    );
  }

  const StatCard = ({ title, icon: Icon, iconColor, children }) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Icon className={`w-5 h-5 ${iconColor}`} />{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const LeaderboardRow = ({ rank, player, value, subValue, highlight = false }) => (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${highlight ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? 'bg-amber-500 text-white' : rank === 2 ? 'bg-slate-400 text-white' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{rank}</span>
      <div className="flex-1 min-w-0"><p className="font-medium truncate">{player.player_name}</p><p className="text-xs text-slate-500">{player.team_name}</p></div>
      <div className="text-right"><p className="font-bold text-lg">{value}</p>{subValue && <p className="text-xs text-slate-500">{subValue}</p>}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">{topRunScorers[0]?.runs_scored || 0}</p>
            <p className="text-xs opacity-80">Most Runs</p>
            {topRunScorers[0] && <p className="text-sm font-medium mt-1">{topRunScorers[0].player_name}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">{topWicketTakers[0]?.wickets_taken || 0}</p>
            <p className="text-xs opacity-80">Most Wickets</p>
            {topWicketTakers[0] && <p className="text-sm font-medium mt-1">{topWicketTakers[0].player_name}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">{mostSixes[0]?.sixes || 0}</p>
            <p className="text-xs opacity-80">Most Sixes</p>
            {mostSixes[0] && <p className="text-sm font-medium mt-1">{mostSixes[0].player_name}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">{players.reduce((sum, p) => sum + (p.mom_awards || 0), 0)}</p>
            <p className="text-xs opacity-80">MoM Awards</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batting" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="batting">Batting</TabsTrigger>
          <TabsTrigger value="bowling">Bowling</TabsTrigger>
        </TabsList>
        <TabsContent value="batting">
          <div className="grid md:grid-cols-2 gap-6">
            <StatCard title="Most Runs" icon={Trophy} iconColor="text-amber-500">
              {topRunScorers.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">No data yet</p> : (
                <div className="space-y-1">{topRunScorers.map((p, i) => <LeaderboardRow key={p.id} rank={i + 1} player={p} value={p.runs_scored} subValue={`${p.matches_played}m, SR ${p.strike_rate?.toFixed(1) || '-'}`} highlight={i === 0} />)}</div>
              )}
            </StatCard>
            <StatCard title="Best Strike Rate" icon={Zap} iconColor="text-purple-500">
              {topStrikeRates.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">Min 20 balls faced</p> : (
                <div className="space-y-1">{topStrikeRates.map((p, i) => <LeaderboardRow key={p.id} rank={i + 1} player={p} value={p.strike_rate?.toFixed(1)} subValue={`${p.runs_scored} runs (${p.balls_faced}b)`} highlight={i === 0} />)}</div>
              )}
            </StatCard>
          </div>
        </TabsContent>
        <TabsContent value="bowling">
          <div className="grid md:grid-cols-2 gap-6">
            <StatCard title="Most Wickets" icon={Target} iconColor="text-blue-500">
              {topWicketTakers.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">No data yet</p> : (
                <div className="space-y-1">{topWicketTakers.map((p, i) => <LeaderboardRow key={p.id} rank={i + 1} player={p} value={p.wickets_taken} subValue={`BB: ${p.best_bowling || '-'}, Econ ${p.economy?.toFixed(2) || '-'}`} highlight={i === 0} />)}</div>
              )}
            </StatCard>
            <StatCard title="Best Economy" icon={TrendingUp} iconColor="text-emerald-500">
              {topEconomy.length === 0 ? <p className="text-slate-500 text-sm py-4 text-center">Min 5 overs bowled</p> : (
                <div className="space-y-1">{topEconomy.map((p, i) => <LeaderboardRow key={p.id} rank={i + 1} player={p} value={p.economy?.toFixed(2)} subValue={`${p.wickets_taken}w, ${p.overs_bowled}ov`} highlight={i === 0} />)}</div>
              )}
            </StatCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}