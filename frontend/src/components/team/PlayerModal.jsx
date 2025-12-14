import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, ChevronRight, User, TrendingUp, Award, Calendar, MapPin } from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

export default function PlayerModal({ player, open, onClose }) {
  const [activeTab, setActiveTab] = useState('batting');
  
  if (!player) return null;

  const roleColors = {
    'Batsman': 'bg-blue-500',
    'Bowler': 'bg-red-500',
    'All-Rounder': 'bg-purple-500',
    'Wicket-Keeper': 'bg-amber-500',
  };

  // Calculate batting average and strike rate
  const battingAvg = player.matches_played > 0 
    ? (player.runs_scored / Math.max(player.matches_played - (player.not_outs || 0), 1)).toFixed(2) 
    : '0.00';
  const strikeRate = player.balls_faced > 0 
    ? ((player.runs_scored / player.balls_faced) * 100).toFixed(2) 
    : '0.00';

  // Batting stats table data
  const battingStats = [
    { label: 'Matches', value: player.matches_played || 0 },
    { label: 'Innings', value: player.innings_batted || player.matches_played || 0 },
    { label: 'Runs', value: player.runs_scored || 0 },
    { label: 'Balls', value: player.balls_faced || '-' },
    { label: 'Highest', value: player.highest_score || 0 },
    { label: 'Average', value: battingAvg },
    { label: 'SR', value: strikeRate !== '0.00' ? strikeRate : '-' },
    { label: 'Not Outs', value: player.not_outs || 0 },
    { label: '4s', value: player.fours || '-' },
    { label: '6s', value: player.sixes || '-' },
    { label: '50s', value: player.fifties || 0 },
    { label: '100s', value: player.hundreds || 0 },
  ];

  // Bowling stats
  const bowlingAvg = player.wickets_taken > 0 
    ? (player.runs_conceded / player.wickets_taken).toFixed(2) 
    : '-';
  const economy = player.overs_bowled > 0 
    ? (player.runs_conceded / player.overs_bowled).toFixed(2) 
    : '-';
  const bowlingSR = player.wickets_taken > 0 && player.balls_bowled
    ? (player.balls_bowled / player.wickets_taken).toFixed(1) 
    : '-';

  const bowlingStats = [
    { label: 'Matches', value: player.matches_played || 0 },
    { label: 'Innings', value: player.innings_bowled || '-' },
    { label: 'Overs', value: player.overs_bowled || '-' },
    { label: 'Runs', value: player.runs_conceded || '-' },
    { label: 'Wickets', value: player.wickets_taken || 0 },
    { label: 'BBI', value: player.best_bowling || '-' },
    { label: 'Average', value: bowlingAvg },
    { label: 'Economy', value: economy },
    { label: 'SR', value: bowlingSR },
    { label: 'Maidens', value: player.maidens || '-' },
    { label: '4w', value: player.four_wickets || 0 },
    { label: '5w', value: player.five_wickets || 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.background }}>
        {/* Header with player photo and basic info - Cricbuzz style */}
        <div className="flex flex-col sm:flex-row" style={{ backgroundColor: colors.surface }}>
          {/* Player Photo */}
          <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.player_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-4xl font-bold text-emerald-700">
                    {(player.player_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {/* Role indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${roleColors[player.role] || 'bg-slate-500'}`} />
          </div>

          {/* Player Name & Basic Info */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {player.player_name || player.name}
                </h2>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  {player.team_name || 'Leamington Royals'}
                </p>
              </div>
              {(player.is_captain || player.is_vice_captain) && (
                <Badge className="bg-amber-500 text-white">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {player.is_captain ? 'Captain' : 'Vice Captain'}
                </Badge>
              )}
            </div>

            {/* Quick Info Row */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={`${roleColors[player.role]} text-white`}>{player.role}</Badge>
              </div>
              {player.jersey_number && (
                <div className="flex items-center gap-1" style={{ color: colors.textSecondary }}>
                  <span className="font-bold text-lg" style={{ color: colors.primary }}>#{player.jersey_number}</span>
                </div>
              )}
              {player.batting_style && (
                <div style={{ color: colors.textSecondary }}>
                  <span className="font-medium">{player.batting_style}</span> Bat
                </div>
              )}
              {player.bowling_style && (
                <div style={{ color: colors.textSecondary }}>
                  <span className="font-medium">{player.bowling_style}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Form - Like Cricbuzz */}
        <div className="px-5 py-4 border-b" style={{ borderColor: colors.border }}>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textSecondary }}>
            Career Highlights
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>{player.matches_played || 0}</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Matches</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>{player.runs_scored || 0}</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Runs</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>{player.wickets_taken || 0}</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Wickets</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>{player.highest_score || 0}</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>Highest</div>
            </div>
          </div>
        </div>

        {/* Stats Tabs - Cricbuzz Style */}
        <div className="p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full p-1 mb-4" style={{ backgroundColor: colors.surfaceHover }}>
              <TabsTrigger 
                value="batting" 
                className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Batting
              </TabsTrigger>
              <TabsTrigger 
                value="bowling" 
                className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Bowling
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Info
              </TabsTrigger>
            </TabsList>

            {/* Batting Stats Table */}
            <TabsContent value="batting" className="mt-0">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: colors.border }}>
                <div className="px-4 py-3 font-semibold text-sm" style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}>
                  Batting Career Summary
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-px" style={{ backgroundColor: colors.border }}>
                  {battingStats.map((stat, idx) => (
                    <div key={idx} className="p-3 text-center" style={{ backgroundColor: colors.surface }}>
                      <div className="text-xs mb-1" style={{ color: colors.textMuted }}>{stat.label}</div>
                      <div className="font-bold" style={{ color: colors.textPrimary }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Bowling Stats Table */}
            <TabsContent value="bowling" className="mt-0">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: colors.border }}>
                <div className="px-4 py-3 font-semibold text-sm" style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}>
                  Bowling Career Summary
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-px" style={{ backgroundColor: colors.border }}>
                  {bowlingStats.map((stat, idx) => (
                    <div key={idx} className="p-3 text-center" style={{ backgroundColor: colors.surface }}>
                      <div className="text-xs mb-1" style={{ color: colors.textMuted }}>{stat.label}</div>
                      <div className="font-bold" style={{ color: colors.textPrimary }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Personal Info */}
            <TabsContent value="info" className="mt-0">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: colors.border }}>
                <div className="px-4 py-3 font-semibold text-sm" style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}>
                  Personal Information
                </div>
                <div className="p-4 space-y-4" style={{ backgroundColor: colors.surface }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs mb-1" style={{ color: colors.textMuted }}>Role</div>
                      <div className="font-medium" style={{ color: colors.textPrimary }}>{player.role}</div>
                    </div>
                    {player.batting_style && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: colors.textMuted }}>Batting Style</div>
                        <div className="font-medium" style={{ color: colors.textPrimary }}>{player.batting_style}</div>
                      </div>
                    )}
                    {player.bowling_style && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: colors.textMuted }}>Bowling Style</div>
                        <div className="font-medium" style={{ color: colors.textPrimary }}>{player.bowling_style}</div>
                      </div>
                    )}
                    {player.jersey_number && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: colors.textMuted }}>Jersey Number</div>
                        <div className="font-medium" style={{ color: colors.textPrimary }}>#{player.jersey_number}</div>
                      </div>
                    )}
                    {player.date_joined && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: colors.textMuted }}>Joined</div>
                        <div className="font-medium" style={{ color: colors.textPrimary }}>{player.date_joined}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs mb-1" style={{ color: colors.textMuted }}>Status</div>
                      <Badge className={player.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                        {player.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                  
                  {player.bio && (
                    <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                      <div className="text-xs mb-2" style={{ color: colors.textMuted }}>About</div>
                      <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>{player.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}