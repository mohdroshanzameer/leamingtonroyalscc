import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Plus, Calendar, Users, Search, ChevronRight, Clock, CheckCircle2, Loader2, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { CLUB_CONFIG } from '../components/ClubConfig';

const { theme, pages } = CLUB_CONFIG;
const { colors } = theme;

const statusConfig = {
  draft: { color: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500', label: 'Draft' },
  registration: { color: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500', label: 'Open' },
  ongoing: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500 animate-pulse', label: 'Live' },
  completed: { color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500', label: 'Done' },
  cancelled: { color: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500', label: 'Cancelled' }
};

const formatLabels = {
  knockout: 'Knockout',
  league: 'League',
  group_knockout: 'Groups + KO',
  super_league: 'Super League'
};

export default function Tournaments() {
  const [search, setSearch] = useState('');

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.entities.Tournament.list('-created_date', 100),
  });

  const draftTournaments = tournaments.filter(t => t.status === 'draft');
  const ongoingTournaments = tournaments.filter(t => t.status === 'ongoing' || t.status === 'registration');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  const filterBySearch = (list) => list.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const TournamentCard = ({ tournament }) => (
    <Link to={createPageUrl(`TournamentView?id=${tournament.id}`)}>
      <Card className="hover:shadow-lg transition-all duration-200 group" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
              {tournament.logo_url ? (
                <img src={tournament.logo_url} alt="" className="w-9 h-9 object-contain" />
              ) : (
                <Trophy className="w-6 h-6" style={{ color: '#1a1a2e' }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate transition-colors" style={{ color: colors.textPrimary }}>
                  {tournament.name}
                </h3>
                <div className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[tournament.status]?.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[tournament.status]?.dot}`} />
                  {statusConfig[tournament.status]?.label}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: colors.textMuted }}>
                <span className="font-medium px-2 py-0.5 rounded text-xs" style={{ backgroundColor: colors.surfaceHover, color: colors.textPrimary }}>{formatLabels[tournament.format]}</span>
                <span>•</span>
                <span>{tournament.overs_per_match} overs</span>
                {tournament.start_date && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(tournament.start_date), 'dd MMM yyyy')}
                    </span>
                  </>
                )}
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {tournament.max_teams} teams
                </span>
              </div>
            </div>

            {/* Mobile Status */}
            <div className={`sm:hidden flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[tournament.status]?.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[tournament.status]?.dot}`} />
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="text-center py-16 sm:py-20">
      <Icon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colors.border }} />
      <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: colors.textSecondary }}>{title}</h3>
      <p className="text-sm sm:text-base" style={{ color: colors.textMuted }}>{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 lg:pt-12 pb-12 sm:pb-20 lg:pb-12" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0">
          <img
            src={pages.fixtures.backgroundImage}
            alt="Cricket Stadium"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: colors.accent }}>
            Tournament Hub
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.textOnDark }}>
            Tournaments
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4 mb-6" style={{ color: colors.textMuted }}>
            Create, manage and track your cricket competitions
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to={createPageUrl('CompetitionManager')}>
              <Button size="sm" style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}>
                <Settings className="w-4 h-4 mr-1.5" /> Manage Competitions
              </Button>
            </Link>
            <Link to={createPageUrl('TournamentCreate')}>
              <Button size="sm" style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}>
                <Plus className="w-4 h-4 mr-1.5" /> Create Tournament
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tournaments */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mb-6 sm:mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
              <Input
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue={draftTournaments.length > 0 ? "drafts" : ongoingTournaments.length > 0 ? "ongoing" : "drafts"} className="w-full">
            <TabsList className="p-1 rounded-full inline-flex mb-6 sm:mb-8 w-full sm:w-auto" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              <TabsTrigger 
                value="drafts" 
                className="rounded-full px-3 sm:px-8 py-2 flex-1 sm:flex-none text-xs sm:text-sm data-[state=active]:bg-[#fb923c] data-[state=active]:text-[#1a1a2e]"
                style={{ color: colors.textSecondary }}
              >
                <Clock className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Drafts</span> ({draftTournaments.length})
              </TabsTrigger>
              <TabsTrigger 
                value="ongoing" 
                className="rounded-full px-3 sm:px-8 py-2 flex-1 sm:flex-none text-xs sm:text-sm data-[state=active]:bg-[#4ade80] data-[state=active]:text-[#1a1a2e]"
                style={{ color: colors.textSecondary }}
              >
                <Trophy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Live</span> ({ongoingTournaments.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="rounded-full px-3 sm:px-8 py-2 flex-1 sm:flex-none text-xs sm:text-sm data-[state=active]:bg-[#4ade80] data-[state=active]:text-[#1a1a2e]"
                style={{ color: colors.textSecondary }}
              >
                <CheckCircle2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Completed</span> ({completedTournaments.length})
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              </div>
            ) : (
              <>
                <TabsContent value="drafts">
                  {filterBySearch(draftTournaments).length === 0 ? (
                    <EmptyState icon={Clock} title="No Draft Tournaments" description="Create a new tournament to get started." />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {filterBySearch(draftTournaments).map(t => <TournamentCard key={t.id} tournament={t} />)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ongoing">
                  {filterBySearch(ongoingTournaments).length === 0 ? (
                    <EmptyState icon={Trophy} title="No Live Tournaments" description="There are no ongoing tournaments at the moment." />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {filterBySearch(ongoingTournaments).map(t => <TournamentCard key={t.id} tournament={t} />)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed">
                  {filterBySearch(completedTournaments).length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="No Completed Tournaments" description="Completed tournaments will appear here." />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {filterBySearch(completedTournaments).map(t => <TournamentCard key={t.id} tournament={t} />)}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>
    </div>
  );
}