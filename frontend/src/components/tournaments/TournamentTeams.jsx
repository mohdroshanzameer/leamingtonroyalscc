import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '../ClubConfig';

const { colors } = CLUB_CONFIG.theme;

export default function TournamentTeams({ teams, players, tournament, isAdmin, onRefresh }) {
  const [expandedTeam, setExpandedTeam] = useState(null);

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.TournamentTeam.update(id, data),
    onSuccess: () => {
      onRefresh?.();
      toast.success('Team updated');
    },
  });

  const approveTeam = (team) => {
    updateTeamMutation.mutate({ id: team.id, data: { registration_status: 'approved' } });
  };

  const rejectTeam = (team) => {
    updateTeamMutation.mutate({ id: team.id, data: { registration_status: 'rejected' } });
  };

  const pendingTeams = teams.filter(t => t.registration_status === 'pending');
  const approvedTeams = teams.filter(t => t.registration_status === 'approved');
  const rejectedTeams = teams.filter(t => t.registration_status === 'rejected');

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.tournament_team_id === teamId);
  };

  const renderTeamCard = (team, showActions = false) => {
    const teamPlayers = getTeamPlayers(team.id);
    const isExpanded = expandedTeam === team.id;

    return (
      <Card key={team.id} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
              >
                {team.short_name?.charAt(0) || team.team_name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{team.team_name}</h3>
                <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
                  {team.short_name && <span>{team.short_name}</span>}
                  {team.group && <Badge variant="outline" className="text-xs">Group {team.group}</Badge>}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {teamPlayers.length} players
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showActions && isAdmin && (
                <>
                  <Button
                    size="sm"
                    onClick={() => approveTeam(team)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectTeam(team)}
                    className="text-red-500 border-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          {team.matches_played > 0 && (
            <div className="flex gap-4 mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
              <div>
                <span style={{ color: colors.textMuted }}>P: </span>
                <span style={{ color: colors.textPrimary }}>{team.matches_played}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>W: </span>
                <span className="text-green-600">{team.matches_won}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>L: </span>
                <span className="text-red-600">{team.matches_lost}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>Pts: </span>
                <span style={{ color: colors.primary }}>{team.points}</span>
              </div>
              <div>
                <span style={{ color: colors.textMuted }}>NRR: </span>
                <span style={{ color: (team.nrr || 0) >= 0 ? colors.success : colors.danger }}>
                  {(team.nrr || 0) >= 0 ? '+' : ''}{(team.nrr || 0).toFixed(3)}
                </span>
              </div>
            </div>
          )}

          {/* Expanded Players */}
          {isExpanded && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
              <h4 className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Squad</h4>
              {teamPlayers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {teamPlayers.map(player => (
                    <div 
                      key={player.id} 
                      className="p-2 rounded-lg text-sm"
                      style={{ backgroundColor: colors.background }}
                    >
                      <span style={{ color: colors.textPrimary }}>{player.player_name}</span>
                      {player.role && (
                        <Badge variant="outline" className="text-xs ml-2">{player.role}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: colors.textMuted }}>No players registered</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending Registrations */}
      {pendingTeams.length > 0 && isAdmin && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Badge className="bg-amber-500 text-white">{pendingTeams.length}</Badge>
            Pending Registrations
          </h3>
          <div className="space-y-3">
            {pendingTeams.map(team => renderTeamCard(team, true))}
          </div>
        </div>
      )}

      {/* Approved Teams */}
      <div>
        <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
          Registered Teams ({approvedTeams.length}/{tournament?.max_teams || 8})
        </h3>
        {approvedTeams.length > 0 ? (
          <div className="space-y-3">
            {approvedTeams.map(team => renderTeamCard(team))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
            <p style={{ color: colors.textSecondary }}>No teams registered yet</p>
          </div>
        )}
      </div>

      {/* Rejected Teams */}
      {rejectedTeams.length > 0 && isAdmin && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: colors.textMuted }}>
            Rejected ({rejectedTeams.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {rejectedTeams.map(team => renderTeamCard(team))}
          </div>
        </div>
      )}
    </div>
  );
}