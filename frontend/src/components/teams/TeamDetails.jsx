import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { 
  Users, MapPin, Mail, Phone, Edit, Trash2, UserPlus, 
  Search, Grid, List, Crown, ArrowLeft 
} from 'lucide-react';
import TeamStats from './TeamStats';
import PlayerCard from './PlayerCard';

export default function TeamDetails({ 
  team, 
  players, 
  matches,
  onBack,
  onEditTeam, 
  onDeleteTeam,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredPlayers = players?.filter(p => {
    const matchesSearch = p.player_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const captain = players?.find(p => p.is_captain);
  const viceCaptain = players?.find(p => p.is_vice_captain);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="text-slate-600 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
      </Button>

      {/* Team Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Logo */}
            {team.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={team.name} 
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100"
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: team.primary_color || '#6366f1' }}
              >
                {team.short_name?.substring(0, 3) || team.name?.substring(0, 3)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-800">{team.name}</h1>
                    {team.is_home_team && (
                      <Badge className="bg-green-100 text-green-700">Home Team</Badge>
                    )}
                    <Badge className={team.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {team.status || 'Active'}
                    </Badge>
                  </div>
                  {team.short_name && <p className="text-slate-500 mt-1">{team.short_name}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onEditTeam}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={onDeleteTeam}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-slate-600">
                {team.home_ground && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {team.home_ground}
                  </span>
                )}
                {team.contact_email && (
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {team.contact_email}
                  </span>
                )}
                {team.contact_phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {team.contact_phone}
                  </span>
                )}
              </div>

              {/* Captain Info */}
              {(captain || viceCaptain) && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                  {captain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-slate-500">Captain:</span>
                      <span className="font-medium">{captain.player_name}</span>
                    </div>
                  )}
                  {viceCaptain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Vice Captain:</span>
                      <span className="font-medium">{viceCaptain.player_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <TeamStats team={team} matches={matches} players={players} />

      {/* Players Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Squad ({players?.length || 0})
            </CardTitle>
            <Button onClick={onAddPlayer} className="bg-teal-600 hover:bg-teal-700">
              <UserPlus className="w-4 h-4 mr-2" /> Add Player
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search players..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {['all', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(role => (
                <Button
                  key={role}
                  variant={roleFilter === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className={`text-xs sm:text-sm px-2 sm:px-3 ${roleFilter === role ? 'bg-teal-600' : ''}`}
                >
                  {role === 'all' ? 'All' : role === 'Wicket-Keeper' ? 'WK' : role === 'All-Rounder' ? 'AR' : role.substring(0, 3)}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Players Grid/List */}
          {filteredPlayers.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {filteredPlayers.map(player => (
                <PlayerCard 
                  key={player.id} 
                  player={player} 
                  compact={viewMode === 'list'}
                  onEdit={onEditPlayer}
                  onDelete={onDeletePlayer}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No players found</p>
              {!searchQuery && roleFilter === 'all' && (
                <Button onClick={onAddPlayer} variant="outline" className="mt-4">
                  <UserPlus className="w-4 h-4 mr-2" /> Add First Player
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {team.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{team.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}