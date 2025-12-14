import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function PointsTable({ teams, tournament }) {
  // Group teams by group letter (if applicable)
  const groupedTeams = useMemo(() => {
    if (tournament?.format === 'group_knockout') {
      const groups = {};
      teams.forEach(t => {
        const g = t.group || 'A';
        if (!groups[g]) groups[g] = [];
        groups[g].push(t);
      });
      // Sort each group by points, then NRR
      Object.keys(groups).forEach(g => {
        groups[g].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return (b.nrr || 0) - (a.nrr || 0);
        });
      });
      return groups;
    }
    // Single table - sort all teams
    return {
      'League': [...teams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.nrr || 0) - (a.nrr || 0);
      })
    };
  }, [teams, tournament]);

  const qualifyCount = tournament?.teams_qualify_per_group || 2;

  return (
    <div className="space-y-6">
      {Object.entries(groupedTeams).map(([groupName, groupTeams]) => (
        <Card key={groupName} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <CardHeader className="pb-3">
            <CardTitle style={{ color: colors.textPrimary }}>
              {tournament?.format === 'group_knockout' ? `Group ${groupName}` : 'Points Table'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: colors.background }}>
                    <th className="text-left p-3 font-medium" style={{ color: colors.textSecondary }}>#</th>
                    <th className="text-left p-3 font-medium" style={{ color: colors.textSecondary }}>Team</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>P</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>W</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>L</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>T</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>NR</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>Pts</th>
                    <th className="text-center p-3 font-medium" style={{ color: colors.textSecondary }}>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {groupTeams.map((team, idx) => {
                    const isQualified = idx < qualifyCount && tournament?.format === 'group_knockout';
                    return (
                      <tr 
                        key={team.id} 
                        className="border-t"
                        style={{ 
                          borderColor: colors.borderLight,
                          backgroundColor: isQualified ? colors.successLight : undefined
                        }}
                      >
                        <td className="p-3 font-medium" style={{ color: colors.textPrimary }}>{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
                            >
                              {team.short_name?.charAt(0) || team.team_name?.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: colors.textPrimary }}>{team.team_name}</span>
                              {isQualified && (
                                <Badge className="ml-2 text-xs bg-green-500 text-white">Q</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center" style={{ color: colors.textSecondary }}>{team.matches_played || 0}</td>
                        <td className="p-3 text-center font-medium text-green-600">{team.matches_won || 0}</td>
                        <td className="p-3 text-center font-medium text-red-600">{team.matches_lost || 0}</td>
                        <td className="p-3 text-center" style={{ color: colors.textSecondary }}>{team.matches_tied || 0}</td>
                        <td className="p-3 text-center" style={{ color: colors.textSecondary }}>{team.matches_nr || 0}</td>
                        <td className="p-3 text-center font-bold" style={{ color: colors.primary }}>{team.points || 0}</td>
                        <td className="p-3 text-center" style={{ color: (team.nrr || 0) >= 0 ? colors.success : colors.danger }}>
                          {(team.nrr || 0) >= 0 ? '+' : ''}{(team.nrr || 0).toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            {tournament?.format === 'group_knockout' && (
              <div className="p-3 border-t" style={{ borderColor: colors.borderLight }}>
                <span className="text-xs" style={{ color: colors.textMuted }}>
                  <Badge className="bg-green-500 text-white text-xs mr-1">Q</Badge>
                  Qualified for knockout stage
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs" style={{ color: colors.textMuted }}>
        <span><strong>P</strong> = Played</span>
        <span><strong>W</strong> = Won</span>
        <span><strong>L</strong> = Lost</span>
        <span><strong>T</strong> = Tied</span>
        <span><strong>NR</strong> = No Result</span>
        <span><strong>Pts</strong> = Points</span>
        <span><strong>NRR</strong> = Net Run Rate</span>
      </div>
    </div>
  );
}