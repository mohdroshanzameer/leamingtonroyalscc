import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Award } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function TournamentStats({ players, matches, tournament }) {
  const [activeTab, setActiveTab] = useState('batting');

  // Top Batsmen
  const topBatsmen = useMemo(() => {
    return [...players]
      .filter(p => p.runs_scored > 0)
      .sort((a, b) => b.runs_scored - a.runs_scored)
      .slice(0, 10);
  }, [players]);

  // Top Bowlers
  const topBowlers = useMemo(() => {
    return [...players]
      .filter(p => p.wickets_taken > 0)
      .sort((a, b) => b.wickets_taken - a.wickets_taken)
      .slice(0, 10);
  }, [players]);

  // Most 6s
  const mostSixes = useMemo(() => {
    return [...players]
      .filter(p => p.sixes > 0)
      .sort((a, b) => b.sixes - a.sixes)
      .slice(0, 5);
  }, [players]);

  // Most 4s
  const mostFours = useMemo(() => {
    return [...players]
      .filter(p => p.fours > 0)
      .sort((a, b) => b.fours - a.fours)
      .slice(0, 5);
  }, [players]);

  // Best Strike Rate (min 20 balls)
  const bestStrikeRate = useMemo(() => {
    return [...players]
      .filter(p => p.balls_faced >= 20 && p.strike_rate > 0)
      .sort((a, b) => b.strike_rate - a.strike_rate)
      .slice(0, 5);
  }, [players]);

  // Best Economy (min 5 overs)
  const bestEconomy = useMemo(() => {
    return [...players]
      .filter(p => p.overs_bowled >= 5 && p.economy > 0)
      .sort((a, b) => a.economy - b.economy)
      .slice(0, 5);
  }, [players]);

  // Most MoM Awards
  const mostMOM = useMemo(() => {
    return [...players]
      .filter(p => p.mom_awards > 0)
      .sort((a, b) => b.mom_awards - a.mom_awards)
      .slice(0, 5);
  }, [players]);

  const renderLeaderboard = (data, columns) => {
    if (data.length === 0) {
      return (
        <p className="text-center py-8" style={{ color: colors.textMuted }}>No data available yet</p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: colors.background }}>
              <th className="text-left p-3 font-medium" style={{ color: colors.textSecondary }}>#</th>
              <th className="text-left p-3 font-medium" style={{ color: colors.textSecondary }}>Player</th>
              {columns.map(col => (
                <th key={col.key} className="text-right p-3 font-medium" style={{ color: colors.textSecondary }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((player, idx) => (
              <tr key={player.id} className="border-t" style={{ borderColor: colors.borderLight }}>
                <td className="p-3" style={{ color: colors.textMuted }}>
                  {idx === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
                  {idx === 1 && <span className="text-slate-400">2</span>}
                  {idx === 2 && <span className="text-amber-700">3</span>}
                  {idx > 2 && idx + 1}
                </td>
                <td className="p-3">
                  <div>
                    <span className="font-medium" style={{ color: colors.textPrimary }}>{player.player_name}</span>
                    <span className="text-xs ml-2" style={{ color: colors.textMuted }}>{player.team_name}</span>
                  </div>
                </td>
                {columns.map(col => (
                  <td key={col.key} className="p-3 text-right font-bold" style={{ color: idx === 0 ? colors.primary : colors.textPrimary }}>
                    {col.format ? col.format(player[col.key]) : player[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList style={{ backgroundColor: colors.surface }}>
          <TabsTrigger value="batting">Batting</TabsTrigger>
          <TabsTrigger value="bowling">Bowling</TabsTrigger>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>

        <TabsContent value="batting" className="mt-4 space-y-4">
          {/* Top Run Scorers */}
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Run Scorers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(topBatsmen, [
                { key: 'matches_played', label: 'M' },
                { key: 'runs_scored', label: 'Runs' },
                { key: 'highest_score', label: 'HS' },
                { key: 'strike_rate', label: 'SR', format: (v) => v?.toFixed(1) || '-' },
              ])}
            </CardContent>
          </Card>

          {/* Most Sixes */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: colors.textPrimary }}>Most Sixes</CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(mostSixes, [{ key: 'sixes', label: '6s' }])}
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: colors.textPrimary }}>Most Fours</CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(mostFours, [{ key: 'fours', label: '4s' }])}
              </CardContent>
            </Card>
          </div>

          {/* Best Strike Rate */}
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: colors.textPrimary }}>Best Strike Rate (min 20 balls)</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(bestStrikeRate, [
                { key: 'runs_scored', label: 'Runs' },
                { key: 'balls_faced', label: 'Balls' },
                { key: 'strike_rate', label: 'SR', format: (v) => v?.toFixed(2) || '-' },
              ])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bowling" className="mt-4 space-y-4">
          {/* Top Wicket Takers */}
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Target className="w-5 h-5 text-purple-500" />
                Top Wicket Takers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(topBowlers, [
                { key: 'matches_played', label: 'M' },
                { key: 'wickets_taken', label: 'Wkts' },
                { key: 'best_bowling', label: 'BB' },
                { key: 'economy', label: 'Econ', format: (v) => v?.toFixed(2) || '-' },
              ])}
            </CardContent>
          </Card>

          {/* Best Economy */}
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: colors.textPrimary }}>Best Economy (min 5 overs)</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(bestEconomy, [
                { key: 'overs_bowled', label: 'Overs' },
                { key: 'runs_conceded', label: 'Runs' },
                { key: 'economy', label: 'Econ', format: (v) => v?.toFixed(2) || '-' },
              ])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="others" className="mt-4 space-y-4">
          {/* Most MoM Awards */}
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Award className="w-5 h-5 text-amber-500" />
                Most Man of the Match Awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(mostMOM, [{ key: 'mom_awards', label: 'Awards' }])}
            </CardContent>
          </Card>

          {/* Tournament Summary */}
          <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <CardHeader className="pb-2">
              <CardTitle style={{ color: colors.textPrimary }}>Tournament Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>{matches.filter(m => m.status === 'completed').length}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Matches Played</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>{players.reduce((sum, p) => sum + (p.runs_scored || 0), 0)}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Total Runs</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>{players.reduce((sum, p) => sum + (p.wickets_taken || 0), 0)}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Total Wickets</p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>{players.reduce((sum, p) => sum + (p.sixes || 0), 0)}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Total Sixes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}