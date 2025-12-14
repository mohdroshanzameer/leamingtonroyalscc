import React, { useState, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, Calendar, Trophy, CreditCard, CheckCircle, Target, Zap, Award, 
  User, Pencil, Save, X, Settings, ChevronRight
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { toast } from 'sonner';

import ProfileHeader from '@/components/profile/ProfileHeader';
import StatCard from '@/components/profile/StatCard';
import MatchAvailabilityCard from '@/components/profile/MatchAvailabilityCard';
import PaymentSummaryCard from '@/components/profile/PaymentSummaryCard';
import PlayerStatsCharts from '@/components/profile/PlayerStatsCharts';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

// Custom tabs data
const TABS = [
  { value: 'overview', icon: User, label: 'Overview' },
  { value: 'stats', icon: Target, label: 'Stats' },
  { value: 'matches', icon: Calendar, label: 'Matches' },
  { value: 'payments', icon: CreditCard, label: 'Payments' },
];

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    api.auth.me()
      .then(u => { if (mounted) setUser(u); })
      .catch((err) => {
        if (!mounted) return;
        if (err?.status === 401 || err?.status === 403) return api.auth.redirectToLogin();
        console.error('MyProfile: failed to load current user', err);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Get player data linked to user email
  const { data: players = [] } = useQuery({
    queryKey: ['my-player', user?.email],
    queryFn: async () => {
      const allPlayers = await api.entities.TeamPlayer.list('player_name', 500);
      return allPlayers.filter(p => p.email === user?.email);
    },
    enabled: !!user?.email,
  });

  // Get charges for this player
  const { data: charges = [] } = useQuery({
    queryKey: ['my-charges', players],
    queryFn: async () => {
      if (!players || players.length === 0) return [];
      const allCharges = await api.entities.PlayerCharge.list('-charge_date', 1000);
      const playerIds = players.map(p => p.id);
      return allCharges.filter(c => playerIds.includes(c.player_id) && !c.voided);
    },
    enabled: players.length > 0,
  });

  // Get payments for this player
  const { data: payments = [] } = useQuery({
    queryKey: ['my-payments', players],
    queryFn: async () => {
      if (!players || players.length === 0) return [];
      const allPayments = await api.entities.PlayerPayment.list('-payment_date', 1000);
      const playerIds = players.map(p => p.id);
      // Filter by player and exclude soft-deleted payments
      return allPayments.filter(p => playerIds.includes(p.player_id) && !p.is_deleted);
    },
    enabled: players.length > 0,
    staleTime: 0, // Always fetch fresh data
  });

  // Get allocations for payments
  const { data: allocations = [] } = useQuery({
    queryKey: ['my-allocations', payments],
    queryFn: async () => {
      if (!payments || payments.length === 0) return [];
      const allAllocations = await api.entities.PaymentAllocation.list('-created_date', 500);
      const paymentIds = payments.map(p => p.id);
      return allAllocations.filter(a => paymentIds.includes(a.payment_id));
    },
    enabled: payments.length > 0,
  });

  // Get all matches
  const { data: matches = [] } = useQuery({
    queryKey: ['all-matches'],
    queryFn: () => api.entities.TournamentMatch.list('-match_date', 200),
  });

  // Get upcoming matches
  const upcomingMatches = matches.filter(m => 
    (m.status === 'scheduled' || m.status === 'Upcoming') && m.match_date && new Date(m.match_date) >= new Date()
  ).sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  // Get user's availability for matches
  const { data: myAvailability = [] } = useQuery({
    queryKey: ['my-availability', user?.email],
    queryFn: async () => {
      const all = await api.entities.MatchAvailability.list('-created_date', 200);
      return all.filter(a => a.player_email === user?.email);
    },
    enabled: !!user?.email,
  });

  // Get membership data
  const { data: memberships = [] } = useQuery({
    queryKey: ['my-membership', user?.email, user?.full_name],
    queryFn: async () => {
      const allMemberships = await api.entities.Membership.list('-created_date', 100);
      const byEmail = allMemberships.filter(m => m.email === user?.email);
      if (byEmail.length > 0) return byEmail;
      if (user?.full_name) {
        const byName = allMemberships.filter(m => m.member_name === user?.full_name);
        if (byName.length > 0) return byName;
      }
      return [];
    },
    enabled: !!user?.email,
  });

  // Get all seasons
  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-created_date', 50),
  });

  // Get all competitions (parent competitions only)
  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const all = await api.entities.Competition.list('name', 100);
      return all.filter(c => !c.parent_id);
    },
  });

  // Set default season and competition once data is loaded
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      const activeSeason = seasons.find(s => s.is_current) || seasons[0];
      setSelectedSeason(activeSeason);
    }
  }, [seasons, selectedSeason]);

  // Don't auto-select competition - default to "All"

  // Update profile form when player data loads
  useEffect(() => {
    if (players[0]) {
      setProfileForm({
        phone: players[0].phone || '',
        batting_style: players[0].batting_style || '',
        bowling_style: players[0].bowling_style || '',
        bio: players[0].bio || '',
      });
    }
  }, [players]);

  // Mutation to update player profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (players[0]) {
        return api.entities.TeamPlayer.update(players[0].id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-player'] });
      setEditDialogOpen(false);
      toast.success('Profile updated');
    },
  });

  // Mutation to update availability
  const availabilityMutation = useMutation({
    mutationFn: async ({ matchId, status }) => {
      const existing = myAvailability.find(a => a.match_id === matchId);
      if (existing) {
        return api.entities.MatchAvailability.update(existing.id, { status });
      } else {
        return api.entities.MatchAvailability.create({
          match_id: matchId,
          player_id: players[0]?.id || '',
          player_email: user.email,
          player_name: user.full_name || players[0]?.player_name || 'Player',
          status
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Availability updated');
    },
    onError: (error) => {
      toast.error('Failed to update availability');
      console.error('Availability error:', error);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  if (!user) return null;

  const player = players[0];
  const membership = memberships[0];

  // Calculate totals from ledger
  const totalChargesAmount = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaidAmount = payments.filter(p => p.verified).reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = totalPaidAmount - totalChargesAmount;

  // Get allocated amount per charge
  const getChargeAllocated = (chargeId) => {
    return allocations.filter(a => a.charge_id === chargeId).reduce((sum, a) => sum + (a.amount || 0), 0);
  };

  return (
    <div className="min-h-screen pb-8 pt-0" style={{ backgroundColor: colors.background }}>
      {/* Profile Header with Avatar, Role-based gradient & Stats */}
        <ProfileHeader 
          user={user} 
          player={player} 
          membership={membership}
          onEdit={() => setEditDialogOpen(true)}
        />

      {/* Main Content */}
      <div className="max-w-4xl lg:max-w-6xl mx-auto px-4 lg:px-8 mt-6">
        {/* Custom Tab Buttons */}
        <div 
          className="w-full grid grid-cols-4 rounded-xl p-1.5 mb-6"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 rounded-lg px-2 sm:px-4 py-2.5 flex flex-col items-center gap-1 whitespace-nowrap transition-all ${
                  isActive ? 'text-black' : 'text-slate-500'
                }`}
                style={{
                  backgroundColor: isActive ? '#00d4ff' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] sm:text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {!player ? (
              <div 
                className="rounded-2xl p-8 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <User className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <h3 className="text-lg font-semibold text-white mb-1">No Player Profile</h3>
                <p className="text-sm text-slate-400">Contact admin to link your player profile</p>
              </div>
            ) : (
              <>
                {/* Bio Section */}
                {player.bio && (
                  <div 
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">About</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{player.bio}</p>
                  </div>
                )}

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div 
                    className="rounded-xl p-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Phone</p>
                    <p className="text-sm font-medium text-white truncate">{player.phone || '-'}</p>
                  </div>
                  <div 
                    className="rounded-xl p-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-white">{player.status || 'Active'}</p>
                  </div>
                  <div 
                    className="rounded-xl p-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Jersey</p>
                    <p className="text-sm font-medium text-white">{player.jersey_number || '-'}</p>
                  </div>
                  <div 
                    className="rounded-xl p-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Joined</p>
                    <p className="text-sm font-medium text-white">
                      {player.date_joined ? format(new Date(player.date_joined), 'MMM yyyy') : '-'}
                    </p>
                  </div>
                </div>

                {/* Payment Summary */}
                <PaymentSummaryCard
                  totalCharges={totalChargesAmount}
                  totalPaid={totalPaidAmount}
                  balance={balance}
                  playerId={player?.id}
                  charges={charges}
                  allocations={allocations}
                  onPayNow={() => toast.info('Payment feature coming soon!')}
                />
              </>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {!player ? (
              <div className="text-center py-12 text-slate-500">No stats available</div>
            ) : (
              <>
                {/* Filter Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Season</Label>
                    <Select
                      value={selectedSeason?.id || ''}
                      onValueChange={(value) => {
                        const season = seasons.find(s => s.id === value);
                        setSelectedSeason(season);
                      }}
                    >
                      <SelectTrigger 
                        className="bg-white/5 border-white/10 text-white"
                      >
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map(season => (
                          <SelectItem key={season.id} value={season.id}>
                            {season.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Competition</Label>
                    <Select
                      value={selectedCompetition?.id || 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setSelectedCompetition(null);
                        } else {
                          const comp = competitions.find(c => c.id === value);
                          setSelectedCompetition(comp);
                        }
                      }}
                    >
                      <SelectTrigger 
                        className="bg-white/5 border-white/10 text-white"
                      >
                        <SelectValue placeholder="All Competitions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Competitions</SelectItem>
                        {competitions.map(comp => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.short_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <PlayerStatsCharts 
                  player={player} 
                  selectedSeason={selectedSeason}
                  selectedCompetition={selectedCompetition}
                />
              </>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming matches</p>
              </div>
            ) : (
              upcomingMatches.slice(0, 10).map(match => {
                const availability = myAvailability.find(a => a.match_id === match.id);
                return (
                  <MatchAvailabilityCard
                    key={match.id}
                    match={match}
                    currentStatus={availability?.status}
                    onStatusChange={(status) => availabilityMutation.mutate({ matchId: match.id, status })}
                    isPending={availabilityMutation.isPending}
                  />
                );
              })
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <PaymentSummaryCard
              totalCharges={totalChargesAmount}
              totalPaid={totalPaidAmount}
              balance={balance}
              playerId={player?.id}
              charges={charges}
              allocations={allocations}
              onPayNow={() => toast.info('Payment feature coming soon!')}
            />

            {/* Charges List */}
            {charges.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Charges ({charges.length})
                </h3>
                <div 
                  className="rounded-xl overflow-hidden divide-y divide-white/5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {charges.map((charge) => {
                    const allocated = getChargeAllocated(charge.id);
                    const due = charge.amount - allocated;

                    // Check if there are pending (unverified) payments that mention this charge in notes
                    const chargeDescription = charge.description || charge.charge_type.replace('_', ' ');
                    const hasPendingPayment = payments.some(p => 
                      !p.verified && 
                      p.notes && 
                      p.notes.includes(chargeDescription)
                    );

                    return (
                      <div key={charge.id} className="p-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {charge.description || charge.charge_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {charge.charge_date ? format(new Date(charge.charge_date), 'dd MMM yyyy') : '-'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-bold text-white">{CLUB_CONFIG.finance.currency}{charge.amount}</p>
                          <p className={`text-xs ${hasPendingPayment ? 'text-blue-400' : due > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {hasPendingPayment ? 'Pending' : due > 0 ? `${CLUB_CONFIG.finance.currency}${due} due` : 'Paid'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payments List */}
            {payments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Payments ({payments.length})
                </h3>
                <div 
                  className="rounded-xl overflow-hidden divide-y divide-white/5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {payments.map((payment) => {
                    // Extract match details from notes (format: "notes | For: charge description | Submitted by player")
                    let matchDetails = null;
                    if (payment.notes) {
                      const forMatch = payment.notes.match(/For: ([^|]+)/);
                      if (forMatch) {
                        matchDetails = forMatch[1].trim();
                      }
                    }

                    return (
                      <div key={payment.id} className="p-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {payment.reference || 'Payment'}
                          </p>
                          {matchDetails && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {matchDetails}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>{payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : '-'}</span>
                            {payment.verified ? (
                              <span className="flex items-center gap-0.5 text-emerald-400">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-amber-400">
                                Pending Verification
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-bold text-emerald-400">+{CLUB_CONFIG.finance.currency}{payment.amount}</p>
                          <p className="text-xs text-slate-500">{payment.payment_method || '-'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent 
          className="max-w-md border-0 [&>button]:text-white [&>button]:opacity-70 [&>button:hover]:opacity-100"
          style={{ backgroundColor: '#1e1e1e' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#ffffff' }}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</Label>
              <Input
                value={profileForm.phone || ''}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Enter phone number"
                style={{ backgroundColor: '#2d2d2d', borderColor: '#404040', color: '#ffffff' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batting Style</Label>
              <Select
                value={profileForm.batting_style || ''}
                onValueChange={(value) => setProfileForm({ ...profileForm, batting_style: value })}
              >
                <SelectTrigger style={{ backgroundColor: '#2d2d2d', borderColor: '#404040', color: '#ffffff' }}>
                  <SelectValue placeholder="Select batting style" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#2d2d2d', borderColor: '#404040' }}>
                  <SelectItem value="Right-handed">Right-handed</SelectItem>
                  <SelectItem value="Left-handed">Left-handed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bowling Style</Label>
              <Input
                value={profileForm.bowling_style || ''}
                onChange={(e) => setProfileForm({ ...profileForm, bowling_style: e.target.value })}
                placeholder="e.g., Right-arm medium"
                style={{ backgroundColor: '#2d2d2d', borderColor: '#404040', color: '#ffffff' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</Label>
              <Textarea
                value={profileForm.bio || ''}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
                style={{ backgroundColor: '#2d2d2d', borderColor: '#404040', color: '#ffffff' }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-md font-medium"
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '2px solid #e5e7eb', 
                  color: '#e5e7eb' 
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateProfileMutation.mutate(profileForm)}
                disabled={updateProfileMutation.isPending}
                className="flex-1 py-2.5 px-4 rounded-md font-medium flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#059669', 
                  color: '#ffffff',
                  opacity: updateProfileMutation.isPending ? 0.7 : 1
                }}
              >
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}