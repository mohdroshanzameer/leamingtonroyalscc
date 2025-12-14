import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Trophy, Play, Clock, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { CLUB_CONFIG } from '../ClubConfig';
import EditMatchDialog from './EditMatchDialog';

const { colors } = CLUB_CONFIG.theme;

export default function TournamentFixtures({ matches, teams, tournament, isAdmin, onRefresh }) {
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingMatch, setEditingMatch] = useState(null);

  const filteredMatches = useMemo(() => {
    return matches
      .filter(m => filterStage === 'all' || m.stage === filterStage)
      .filter(m => filterStatus === 'all' || m.status === filterStatus)
      .sort((a, b) => {
        // Sort by date, then by match number
        if (a.match_date && b.match_date) {
          return new Date(a.match_date) - new Date(b.match_date);
        }
        return (a.match_number || 0) - (b.match_number || 0);
      });
  }, [matches, filterStage, filterStatus]);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const groups = {};
    filteredMatches.forEach(match => {
      const dateKey = match.match_date 
        ? format(new Date(match.match_date), 'yyyy-MM-dd')
        : 'TBD';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(match);
    });
    return groups;
  }, [filteredMatches]);

  const stages = [...new Set(matches.map(m => m.stage))];

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
      live: { bg: 'bg-red-100', text: 'text-red-700' },
      completed: { bg: 'bg-green-100', text: 'text-green-700' },
      cancelled: { bg: 'bg-slate-100', text: 'text-slate-700' },
      postponed: { bg: 'bg-amber-100', text: 'text-amber-700' },
    };
    return styles[status] || styles.scheduled;
  };

  const getStageBadge = (stage) => {
    const styles = {
      group: 'bg-blue-500',
      league: 'bg-blue-500',
      quarterfinal: 'bg-purple-500',
      semifinal: 'bg-amber-500',
      third_place: 'bg-slate-500',
      final: 'bg-red-500',
    };
    return styles[stage] || 'bg-slate-500';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-40" style={{ borderColor: colors.border }}>
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => (
              <SelectItem key={s} value={s}>{s?.replace('_', ' ').toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" style={{ borderColor: colors.border }}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Matches grouped by date */}
      {Object.entries(matchesByDate).map(([dateKey, dateMatches]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: colors.textSecondary }}>
            <Calendar className="w-4 h-4" />
            {dateKey === 'TBD' ? 'Date TBD' : format(new Date(dateKey), 'EEEE, dd MMMM yyyy')}
          </h3>
          
          <div className="space-y-2">
            {dateMatches.map(match => {
              const statusStyle = getStatusBadge(match.status);
              return (
                <Card 
                  key={match.id} 
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  className={match.status === 'live' ? 'ring-2 ring-red-500' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStageBadge(match.stage)} text-white`}>
                          {match.stage?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {match.group && (
                          <Badge variant="outline" className="text-xs">Group {match.group}</Badge>
                        )}
                        {match.match_number && (
                          <span className="text-xs" style={{ color: colors.textMuted }}>Match #{match.match_number}</span>
                        )}
                      </div>
                      <Badge className={`${statusStyle.bg} ${statusStyle.text} text-xs`}>
                        {match.status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse" />}
                        {match.status?.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Team 1 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
                          >
                            {match.team1_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: match.winner_name === match.team1_name ? colors.success : colors.textPrimary }}>
                              {match.team1_name}
                              {match.winner_name === match.team1_name && <Trophy className="w-4 h-4 ml-1 inline text-amber-500" />}
                            </p>
                            {match.team1_score && (
                              <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                                {match.team1_score}
                                {match.team1_overs && <span className="text-sm font-normal ml-1" style={{ color: colors.textMuted }}>({match.team1_overs})</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="px-4 text-center">
                        {match.status === 'completed' ? (
                          <span className="text-xs" style={{ color: colors.textMuted }}>vs</span>
                        ) : match.status === 'live' ? (
                          <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">LIVE</div>
                        ) : (
                          <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                            {match.match_date && format(new Date(match.match_date), 'HH:mm')}
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div>
                            <p className="font-semibold" style={{ color: match.winner_name === match.team2_name ? colors.success : colors.textPrimary }}>
                              {match.winner_name === match.team2_name && <Trophy className="w-4 h-4 mr-1 inline text-amber-500" />}
                              {match.team2_name}
                            </p>
                            {match.team2_score && (
                              <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                                {match.team2_score}
                                {match.team2_overs && <span className="text-sm font-normal ml-1" style={{ color: colors.textMuted }}>({match.team2_overs})</span>}
                              </p>
                            )}
                          </div>
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: colors.accent, color: colors.textPrimary }}
                          >
                            {match.team2_name?.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Result */}
                    {match.result_summary && (
                      <p className="text-center text-sm mt-3 font-medium" style={{ color: colors.success }}>
                        {match.result_summary}
                      </p>
                    )}

                    {/* Venue & Admin Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
                      <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
                        {match.venue && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>{match.venue}</span>
                          </>
                        )}
                      </div>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMatch(match)}
                          className="text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {/* Man of the Match */}
                    {match.man_of_match && (
                      <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: colors.accentLight }}>
                        <span style={{ color: colors.textSecondary }}>Man of the Match: </span>
                        <span className="font-medium" style={{ color: colors.textPrimary }}>{match.man_of_match}</span>
                        {match.mom_performance && <span style={{ color: colors.textMuted }}> ({match.mom_performance})</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p style={{ color: colors.textSecondary }}>No matches found</p>
        </div>
      )}

      {/* Edit Match Dialog */}
      {editingMatch && (
        <EditMatchDialog
          open={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
          teams={teams}
          onSaved={() => {
            setEditingMatch(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}