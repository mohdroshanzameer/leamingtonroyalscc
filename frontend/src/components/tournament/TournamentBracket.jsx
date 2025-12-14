import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight } from 'lucide-react';

export default function TournamentBracket({ tournament, matches }) {
  const knockoutMatches = matches.filter(m => ['quarterfinal', 'semifinal', 'third_place', 'final'].includes(m.stage));
  const quarterfinals = knockoutMatches.filter(m => m.stage === 'quarterfinal').sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0));
  const semifinals = knockoutMatches.filter(m => m.stage === 'semifinal').sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0));
  const thirdPlace = knockoutMatches.find(m => m.stage === 'third_place');
  const finalMatch = knockoutMatches.find(m => m.stage === 'final');

  if (knockoutMatches.length === 0) {
    return (
      <Card className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Knockout Stage Not Started</h3>
        <p className="text-slate-500 mt-1">{tournament.format === 'group_knockout' ? 'Complete the group stage first' : 'Create knockout matches to see the bracket'}</p>
      </Card>
    );
  }

  const MatchCard = ({ match, showWinner = false }) => {
    if (!match) return <div className="w-48 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-3 text-center text-slate-400 text-sm">TBD</div>;
    const isCompleted = match.status === 'completed';
    const isLive = match.status === 'live';
    return (
      <div className={`w-48 bg-white border-2 rounded-lg overflow-hidden ${isLive ? 'border-red-500 shadow-lg shadow-red-100' : isCompleted ? 'border-emerald-500' : 'border-slate-200'}`}>
        <div className={`px-3 py-1.5 text-xs font-medium ${isLive ? 'bg-red-500 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{isLive ? '🔴 LIVE' : match.stage?.replace('_', ' ').toUpperCase()}</div>
        <div className="divide-y">
          <TeamRow name={match.team1_name} score={match.team1_score} isWinner={isCompleted && match.winner_name === match.team1_name} />
          <TeamRow name={match.team2_name} score={match.team2_score} isWinner={isCompleted && match.winner_name === match.team2_name} />
        </div>
        {showWinner && isCompleted && match.winner_name && <div className="px-3 py-2 bg-amber-50 border-t text-center"><span className="text-xs text-amber-700 font-medium">🏆 {match.winner_name}</span></div>}
      </div>
    );
  };

  const TeamRow = ({ name, score, isWinner }) => (
    <div className={`flex items-center justify-between px-3 py-2 ${isWinner ? 'bg-emerald-50' : ''}`}>
      <span className={`text-sm truncate ${isWinner ? 'font-bold text-emerald-700' : 'text-slate-700'}`}>{name || 'TBD'}</span>
      {score && <span className={`text-sm font-bold ${isWinner ? 'text-emerald-700' : 'text-slate-500'}`}>{score}</span>}
    </div>
  );

  const Connector = () => <div className="flex items-center px-2"><div className="w-8 h-px bg-slate-300" /><ArrowRight className="w-4 h-4 text-slate-400" /></div>;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Knockout Bracket</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-flex items-center gap-4 min-w-max p-4">
              {quarterfinals.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-500 text-center uppercase">Quarter Finals</h4>
                  <div className="space-y-6">{quarterfinals.map((match) => <MatchCard key={match.id} match={match} />)}</div>
                </div>
              )}
              {quarterfinals.length > 0 && semifinals.length > 0 && <Connector />}
              {semifinals.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-500 text-center uppercase">Semi Finals</h4>
                  <div className="space-y-6">{semifinals.map((match, i) => <div key={match.id} className={i === 0 ? '' : 'mt-12'}><MatchCard match={match} /></div>)}</div>
                </div>
              )}
              {semifinals.length > 0 && (finalMatch || thirdPlace) && <Connector />}
              <div className="space-y-4">
                {finalMatch && <div><h4 className="text-xs font-semibold text-amber-500 text-center uppercase mb-4">🏆 Final</h4><MatchCard match={finalMatch} showWinner /></div>}
                {thirdPlace && <div className="mt-8"><h4 className="text-xs font-semibold text-slate-500 text-center uppercase mb-4">3rd Place</h4><MatchCard match={thirdPlace} /></div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Knockout Matches</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {knockoutMatches.map(match => (
              <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <Badge variant="outline" className="text-xs mb-1">{match.stage?.replace('_', ' ').toUpperCase()}</Badge>
                  <div className="flex items-center gap-2"><span className={match.winner_name === match.team1_name ? 'font-bold' : ''}>{match.team1_name}</span><span className="text-slate-400">vs</span><span className={match.winner_name === match.team2_name ? 'font-bold' : ''}>{match.team2_name}</span></div>
                </div>
                <div className="text-right">
                  {match.status === 'completed' ? <div><span className="text-sm font-medium">{match.team1_score} - {match.team2_score}</span>{match.winner_name && <p className="text-xs text-emerald-600">{match.winner_name} won</p>}</div> : match.status === 'live' ? <Badge className="bg-red-500">LIVE</Badge> : <Badge variant="outline">Scheduled</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}