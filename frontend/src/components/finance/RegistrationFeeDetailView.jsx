import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { getFinanceTheme, CLUB_CONFIG } from '../ClubConfig';

const colors = getFinanceTheme();

const statusColors = {
  Active: { bg: '#10b98120', color: '#10b981' },
  Expired: { bg: '#ef444420', color: '#ef4444' },
  Pending: { bg: '#f59e0b20', color: '#f59e0b' },
  Cancelled: { bg: '#6b728020', color: '#6b7280' },
  Suspended: { bg: '#f59e0b20', color: '#f59e0b' },
};

export default function RegistrationFeeDetailView({ onBack, dateRange }) {
  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ['membershipsForFees'],
    queryFn: () => api.entities.Membership.list('-created_date'),
  });

  const { data: playerCharges = [], isLoading: chargesLoading } = useQuery({
    queryKey: ['membershipCharges'],
    queryFn: () => api.entities.PlayerCharge.filter({ charge_type: 'membership' }, '-charge_date'),
  });

  const { data: playerPayments = [] } = useQuery({
    queryKey: ['membershipPayments'],
    queryFn: () => api.entities.PlayerPayment.list('-payment_date'),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['membershipAllocations'],
    queryFn: () => api.entities.PaymentAllocation.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['playersForMembership'],
    queryFn: () => api.entities.TeamPlayer.list('player_name'),
  });

  const isLoading = membershipsLoading || chargesLoading;

  // Get player name helper
  const getPlayerName = (playerId) => players.find(p => p.id === playerId)?.player_name || 'Unknown';
  const getPlayerEmail = (playerId) => players.find(p => p.id === playerId)?.email || '';

  // Calculate payment status for each membership charge
  const enrichedMemberships = useMemo(() => {
    return memberships.map(m => {
      // Find charge for this membership
      const charge = playerCharges.find(c => c.player_id === m.player_id && c.charge_type === 'membership');
      
      // Find allocations to this charge
      const chargeAllocations = charge ? allocations.filter(a => a.charge_id === charge.id) : [];
      const totalPaid = chargeAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
      
      // Get payment details
      const paymentIds = chargeAllocations.map(a => a.payment_id);
      const payments = playerPayments.filter(p => paymentIds.includes(p.id));
      
      const amountOwed = (m.fee_amount || 0) - totalPaid;
      const isPaid = amountOwed <= 0;
      
      return {
        ...m,
        playerName: m.member_name || getPlayerName(m.player_id),
        playerEmail: m.email || getPlayerEmail(m.player_id),
        totalPaid,
        amountOwed: Math.max(0, amountOwed),
        isPaid,
        payments,
        charge
      };
    }).filter(m => {
      if (!dateRange) return true;
      if (!m.start_date) return true;
      const mDate = parseISO(m.start_date);
      return mDate >= dateRange.start && mDate <= dateRange.end;
    });
  }, [memberships, playerCharges, allocations, playerPayments, players, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const totalFees = enrichedMemberships.reduce((sum, m) => sum + (m.fee_amount || 0), 0);
    const totalCollected = enrichedMemberships.reduce((sum, m) => sum + m.totalPaid, 0);
    const totalOutstanding = enrichedMemberships.reduce((sum, m) => sum + m.amountOwed, 0);
    const paidCount = enrichedMemberships.filter(m => m.isPaid).length;
    const unpaidCount = enrichedMemberships.filter(m => !m.isPaid).length;
    
    return { totalFees, totalCollected, totalOutstanding, paidCount, unpaidCount };
  }, [enrichedMemberships]);

  // Group by membership type
  const byType = useMemo(() => {
    const grouped = {};
    enrichedMemberships.forEach(m => {
      const type = m.membership_type || 'Other';
      if (!grouped[type]) {
        grouped[type] = { count: 0, total: 0, collected: 0 };
      }
      grouped[type].count += 1;
      grouped[type].total += m.fee_amount || 0;
      grouped[type].collected += m.totalPaid;
    });
    return Object.entries(grouped).sort((a, b) => b[1].count - a[1].count);
  }, [enrichedMemberships]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Registration Fee Details</h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>Membership & registration payments</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>Collected</p>
          <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
            {CLUB_CONFIG.finance.currency}{stats.totalCollected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{enrichedMemberships.length}</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Members</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
              {CLUB_CONFIG.finance.currency}{stats.totalFees.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Total Fees</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{stats.paidCount}</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Paid</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {CLUB_CONFIG.finance.currency}{stats.totalOutstanding.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: colors.textMuted }}>Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* By Type Summary */}
      {byType.length > 0 && (
        <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: colors.textSecondary }}>By Membership Type</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {byType.map(([type, data]) => (
                <Badge key={type} variant="outline" style={{ borderColor: colors.border, color: colors.textPrimary }}>
                  {type}: {data.count} ({CLUB_CONFIG.finance.currency}{data.collected}/{CLUB_CONFIG.finance.currency}{data.total})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Users className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            Members ({enrichedMemberships.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-[500px] overflow-y-auto" style={{ borderColor: colors.border }}>
            {enrichedMemberships.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: colors.textMuted }}>No memberships found</p>
            ) : (
              enrichedMemberships.map(m => {
                const statusStyle = statusColors[m.status] || statusColors.Pending;
                return (
                  <div key={m.id} className="px-4 py-3 hover:bg-white/[0.02]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{m.playerName}</p>
                          {m.isPaid ? (
                            <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                          ) : (
                            <AlertCircle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                          )}
                          <Badge className="text-[10px]" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                            {m.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]" style={{ borderColor: '#8b5cf640', color: '#8b5cf6' }}>
                            {m.membership_type}
                          </Badge>
                          {m.start_date && (
                            <span className="text-xs" style={{ color: colors.textMuted }}>
                              From: {format(parseISO(m.start_date), 'dd MMM yyyy')}
                            </span>
                          )}
                          {m.expiry_date && (
                            <span className="text-xs" style={{ color: colors.textMuted }}>
                              Expires: {format(parseISO(m.expiry_date), 'dd MMM yyyy')}
                            </span>
                          )}
                        </div>
                        {m.playerEmail && (
                          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                            ✉️ {m.playerEmail} {m.phone ? `• 📞 ${m.phone}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold" style={{ color: '#8b5cf6' }}>
                          {CLUB_CONFIG.finance.currency}{(m.fee_amount || 0).toLocaleString()}
                        </p>
                        {m.totalPaid > 0 && (
                          <p className="text-xs" style={{ color: '#10b981' }}>
                            Paid: {CLUB_CONFIG.finance.currency}{m.totalPaid}
                          </p>
                        )}
                        {m.amountOwed > 0 && (
                          <p className="text-xs" style={{ color: '#f59e0b' }}>
                            Owes: {CLUB_CONFIG.finance.currency}{m.amountOwed}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}