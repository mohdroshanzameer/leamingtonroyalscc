import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function KnockoutBracket({ matches, teams, tournament }) {
  const semifinals = matches.filter(m => m.stage === 'semifinal');
  const final = matches.find(m => m.stage === 'final');
  const thirdPlace = matches.find(m => m.stage === 'third_place');
  const quarterfinals = matches.filter(m => m.stage === 'quarterfinal');

  const renderMatch = (match, size = 'normal') => {
    if (!match) {
      return (
        <div 
          className={`border-2 border-dashed rounded-lg ${size === 'large' ? 'p-4' : 'p-3'}`}
          style={{ borderColor: colors.border }}
        >
          <p className="text-center text-sm" style={{ color: colors.textMuted }}>TBD</p>
        </div>
      );
    }

    const isCompleted = match.status === 'completed';
    const isLive = match.status === 'live';

    return (
      <div 
        className={`rounded-lg border ${size === 'large' ? 'p-4' : 'p-3'} ${isLive ? 'ring-2 ring-red-500' : ''}`}
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {isLive && (
          <Badge className="bg-red-500 text-white text-xs mb-2 animate-pulse">LIVE</Badge>
        )}
        
        {/* Team 1 */}
        <div 
          className={`flex items-center justify-between py-1.5 px-2 rounded mb-1 ${
            match.winner_name === match.team1_name ? 'bg-green-50 border-l-4 border-green-500' : ''
          }`}
          style={{ backgroundColor: match.winner_name === match.team1_name ? colors.successLight : colors.background }}
        >
          <span className={`font-medium ${size === 'large' ? 'text-sm' : 'text-xs'}`} style={{ color: colors.textPrimary }}>
            {match.team1_name || 'TBD'}
          </span>
          {match.team1_score && (
            <span className={`font-bold ${size === 'large' ? 'text-sm' : 'text-xs'}`} style={{ color: colors.textPrimary }}>
              {match.team1_score}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div 
          className={`flex items-center justify-between py-1.5 px-2 rounded ${
            match.winner_name === match.team2_name ? 'bg-green-50 border-l-4 border-green-500' : ''
          }`}
          style={{ backgroundColor: match.winner_name === match.team2_name ? colors.successLight : colors.background }}
        >
          <span className={`font-medium ${size === 'large' ? 'text-sm' : 'text-xs'}`} style={{ color: colors.textPrimary }}>
            {match.team2_name || 'TBD'}
          </span>
          {match.team2_score && (
            <span className={`font-bold ${size === 'large' ? 'text-sm' : 'text-xs'}`} style={{ color: colors.textPrimary }}>
              {match.team2_score}
            </span>
          )}
        </div>

        {isCompleted && match.winner_name && (
          <div className="mt-2 text-center">
            <span className="text-xs" style={{ color: colors.success }}>
              <Trophy className="w-3 h-3 inline mr-1" />
              {match.winner_name} won
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: colors.textPrimary }}>Knockout Bracket</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex items-center justify-center gap-8">
              {/* Quarterfinals */}
              {quarterfinals.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-center mb-2" style={{ color: colors.textMuted }}>QUARTER FINALS</h4>
                  {quarterfinals.map(match => (
                    <div key={match.id} className="w-48">
                      {renderMatch(match)}
                    </div>
                  ))}
                </div>
              )}

              {/* Semifinals */}
              <div className="space-y-4">
                <h4 className="text-xs font-medium text-center mb-2" style={{ color: colors.textMuted }}>SEMI FINALS</h4>
                {semifinals.length > 0 ? (
                  semifinals.map(match => (
                    <div key={match.id} className="w-48">
                      {renderMatch(match)}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="w-48">{renderMatch(null)}</div>
                    <div className="w-48">{renderMatch(null)}</div>
                  </>
                )}
              </div>

              {/* Final */}
              <div className="space-y-4">
                <h4 className="text-xs font-medium text-center mb-2" style={{ color: colors.primary }}>🏆 FINAL</h4>
                <div className="w-56">
                  {renderMatch(final, 'large')}
                </div>
                
                {/* Third Place */}
                {(thirdPlace || tournament?.format === 'group_knockout') && (
                  <div className="mt-8">
                    <h4 className="text-xs font-medium text-center mb-2" style={{ color: colors.textMuted }}>3RD PLACE</h4>
                    <div className="w-48 mx-auto">
                      {renderMatch(thirdPlace)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Display */}
      {final?.winner_name && (
        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: colors.accent }} />
            <h2 className="text-2xl font-bold text-white mb-1">🎉 Champion 🎉</h2>
            <p className="text-3xl font-bold" style={{ color: colors.accent }}>{final.winner_name}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}