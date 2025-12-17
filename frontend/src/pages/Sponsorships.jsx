import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Plus, Building2, TrendingUp, Calendar, CreditCard, 
  Send, Trash2, Edit2, ExternalLink, ChevronRight, Shield,
  DollarSign, Clock, CheckCircle, AlertCircle, Users, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { CLUB_CONFIG, getFinanceTheme } from '@/components/ClubConfig';
import { canViewFinance, canManageFinance } from '@/components/RoleAccess';
import ImageSelector from '../components/admin/ImageSelector';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

const colors = getFinanceTheme();

const getLevelConfig = (typeName, sponsorTypes) => {
  const type = sponsorTypes.find(t => t.name === typeName);
  if (type) {
    return {
      color: type.color,
      bg: `${type.color}15`,
      amount: type.suggested_amount
    };
  }
  return { color: colors.textSecondary, bg: colors.surfaceHover, amount: 0 };
};

const formatCurrency = (v) => {
  const num = parseFloat(v) || 0;
  return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function Sponsorships() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSponsorDialog, setShowSponsorDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTypesDialog, setShowTypesDialog] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(u => setUser(u))
      .catch(() => api.auth.redirectToLogin())
      .finally(() => setLoading(false));
  }, []);

  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const allSponsors = await api.entities.Sponsor.list('-created_date');
      return allSponsors.filter(s => !s.is_deleted);
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['sponsorPayments'],
    queryFn: async () => {
      const allPayments = await api.entities.SponsorPayment.list('-payment_date');
      return allPayments.filter(p => !p.is_deleted);
    },
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.entities.Season.list('-created_date'),
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => api.entities.Competition.list('name'),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.entities.Team.list('name'),
  });

  const { data: sponsorTypes = [] } = useQuery({
    queryKey: ['sponsorTypes'],
    queryFn: () => api.entities.SponsorType.filter({ is_active: true }, 'display_order'),
  });

  const createSponsorMutation = useMutation({
    mutationFn: (data) => api.entities.Sponsor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      setShowSponsorDialog(false);
      setEditingSponsor(null);
      toast.success('Sponsor added');
    },
  });

  const updateSponsorMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Sponsor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      setShowSponsorDialog(false);
      setEditingSponsor(null);
      toast.success('Sponsor updated');
    },
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (id) => {
      // Soft delete sponsor
      const currentUser = await api.auth.me().catch(() => null);
      await api.entities.Sponsor.update(id, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser?.email || 'unknown'
      });
      
      // Soft delete all payments for this sponsor
      const sponsorPayments = payments.filter(p => p.sponsor_id === id);
      for (const payment of sponsorPayments) {
        await api.entities.SponsorPayment.update(payment.id, {
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: currentUser?.email || 'unknown'
        });
        
        // Also soft delete the corresponding transaction
        const allTransactions = await api.entities.Transaction.filter({ 
          category_name: 'Sponsorship'
        });
        const matchingTx = allTransactions.find(tx => 
          !tx.is_deleted && tx.reference?.includes(`[SP:${payment.id}]`)
        );
        if (matchingTx) {
          await api.entities.Transaction.update(matchingTx.id, {
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: currentUser?.email || 'unknown'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Sponsor deleted');
    },
  });

  const createPaymentMutation = useMutation({
      mutationFn: async (data) => {
        // Clean data: remove empty strings for UUID fields and agreed_amount
        const cleanData = { ...data };
        delete cleanData.agreed_amount; // No longer stored
        if (cleanData.season_id === '') delete cleanData.season_id;
        if (cleanData.competition_id === '') delete cleanData.competition_id;
        if (cleanData.team_id === '') delete cleanData.team_id;

        const payment = await api.entities.SponsorPayment.create(cleanData);

      // Create Transaction for Finance page ledger with reference to payment
      const sponsor = sponsors.find(s => s.id === data.sponsor_id);
      const currentUser = await api.auth.me().catch(() => null);
      if (sponsor) {
        await api.entities.Transaction.create({
          type: 'Income',
          category_name: 'Sponsorship',
          amount: data.amount,
          description: `Sponsorship - ${sponsor.name} (${data.sponsor_type})`,
          date: data.payment_date,
          reference: `${data.reference || 'No-Ref'} [SP:${payment.id}]`, // Always include payment ID for tracking
          received_from: sponsor.name,
          payment_method: data.payment_method,
          status: 'Completed',
          notes: data.notes,
          created_by: currentUser?.email || 'unknown'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowPaymentDialog(false);
      setSelectedSponsor(null);
      toast.success('Payment recorded');
    },
  });

  const updatePaymentMutation = useMutation({
      mutationFn: async ({ id, data }) => {
        // Clean data: remove empty strings for UUID fields and agreed_amount
        const cleanData = { ...data };
        delete cleanData.agreed_amount; // No longer stored
        if (cleanData.season_id === '') delete cleanData.season_id;
        if (cleanData.competition_id === '') delete cleanData.competition_id;
        if (cleanData.team_id === '') delete cleanData.team_id;

      // Update SponsorPayment
      await api.entities.SponsorPayment.update(id, cleanData);

      // Update corresponding Transaction
      const transactions = await api.entities.Transaction.filter({ 
        category_name: 'Sponsorship' 
      });
      const matchingTx = transactions.find(tx => tx.reference?.includes(`[SP:${id}]`));
      if (matchingTx) {
        const sponsor = sponsors.find(s => s.id === data.sponsor_id);
        await api.entities.Transaction.update(matchingTx.id, {
          amount: data.amount,
          description: `Sponsorship - ${sponsor?.name || data.sponsor_name} (${data.sponsor_type})`,
          date: data.payment_date,
          reference: `${data.reference || 'No-Ref'} [SP:${id}]`,
          received_from: sponsor?.name || data.sponsor_name,
          payment_method: data.payment_method,
          notes: data.notes
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowPaymentDialog(false);
      setEditingPayment(null);
      toast.success('Payment updated');
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId) => {
      // Delete SponsorPayment
      await api.entities.SponsorPayment.delete(paymentId);

      // Soft delete corresponding Transaction (matched by payment ID in reference)
      const allTransactions = await api.entities.Transaction.filter({ 
        category_name: 'Sponsorship'
      });
      // Find transaction that's not already deleted and has this payment ID
      const matchingTx = allTransactions.find(tx => 
        !tx.is_deleted && tx.reference?.includes(`[SP:${paymentId}]`)
      );
      if (matchingTx) {
        const currentUser = await api.auth.me().catch(() => null);
        await api.entities.Transaction.update(matchingTx.id, {
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: currentUser?.email || 'unknown'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Payment deleted');
    },
  });

  // Stats
  const stats = useMemo(() => {
    const activeSponsorIds = new Set(payments.map(p => p.sponsor_id));
    const currentSeason = seasons.find(s => s.status === 'Active');
    const thisSeasonPayments = currentSeason 
      ? payments.filter(p => p.season_id === currentSeason.id)
      : [];

    // Calculate expected: count unique sponsorship deals (one per sponsor+type+level combo per season)
    const uniqueDeals = new Map();
    thisSeasonPayments.forEach(p => {
      const key = `${p.sponsor_id}-${p.sponsor_type}-${p.sponsorship_level}-${p.competition_id || 'none'}-${p.team_id || 'none'}`;
      if (!uniqueDeals.has(key)) {
        uniqueDeals.set(key, p);
      }
    });

    const thisSeasonExpected = Array.from(uniqueDeals.values()).reduce((sum, p) => {
      const type = sponsorTypes.find(t => t.name === p.sponsor_type);
      return sum + (parseFloat(type?.suggested_amount) || 0);
    }, 0);

    const thisSeasonReceived = thisSeasonPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const outstanding = Math.max(0, thisSeasonExpected - thisSeasonReceived);
    
    return { 
      active: activeSponsorIds.size, 
      totalValue: thisSeasonExpected,
      totalPaid: thisSeasonReceived, 
      outstanding, 
      expiringSoon: 0 
    };
  }, [payments, seasons, sponsorTypes]);

  const sendInvoice = async (sponsor) => {
    if (!sponsor.email) {
      toast.error('Sponsor email not available');
      return;
    }

    const emailBody = `
Dear ${sponsor.contact_name || sponsor.name},

Thank you for your continued support of ${CLUB_CONFIG.name}.

Sponsorship Details:
- Type: ${sponsor.sponsor_type}

Best regards,
${CLUB_CONFIG.name}
    `.trim();

    await api.integrations.Core.SendEmail({
      to: sponsor.email,
      subject: `Sponsorship - ${CLUB_CONFIG.name}`,
      body: emailBody
    });

    toast.success(`Email sent to ${sponsor.email}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  if (!user || !canViewFinance(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p style={{ color: colors.textMuted }}>You don't have permission to view sponsorships.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-12" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="sticky top-16 z-30 backdrop-blur-xl" style={{ backgroundColor: `${colors.background}ee`, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, #ffd700 0%, #cd7f32 100%)` }}>
                <Building2 className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Sponsorships</h1>
                <p className="text-xs" style={{ color: colors.textMuted }}>Manage club sponsors & partnerships</p>
              </div>
            </div>
            {canManageFinance(user) && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowTypesDialog(true)}
                  variant="outline"
                  style={{ borderColor: colors.border, color: colors.textSecondary }}
                >
                  Manage Types
                </Button>
                <Button 
                  onClick={() => { setEditingSponsor(null); setShowSponsorDialog(true); }}
                  style={{ background: colors.gradientProfit }}
                  className="text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Sponsor
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.infoLight }}>
                <Users className="w-4 h-4" style={{ color: colors.info }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Active</p>
                <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `#ffd70015` }}>
                <DollarSign className="w-4 h-4" style={{ color: '#ffd700' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>This Season</p>
                <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
                <CheckCircle className="w-4 h-4" style={{ color: colors.profit }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Received</p>
                <p className="text-lg font-bold" style={{ color: colors.textProfit }}>{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.pendingLight }}>
                <Clock className="w-4 h-4" style={{ color: colors.pending }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Outstanding</p>
                <p className="text-lg font-bold" style={{ color: colors.pending }}>{formatCurrency(stats.outstanding)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.lossLight }}>
                <AlertCircle className="w-4 h-4" style={{ color: colors.loss }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Expiring Soon</p>
                <p className="text-lg font-bold" style={{ color: colors.loss }}>{stats.expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsors Grid */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList style={{ backgroundColor: colors.surface }}>
            <TabsTrigger value="all">All Sponsors</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <SponsorGrid 
              sponsors={sponsors}
              payments={payments}
              onEdit={(s) => { setEditingSponsor(s); setShowSponsorDialog(true); }}
              onDelete={(id) => {
                const sponsor = sponsors.find(s => s.id === id);
                const paymentCount = payments.filter(p => p.sponsor_id === id).length;
                const message = paymentCount > 0 
                  ? `This will permanently delete the sponsor "${sponsor?.name}" and soft delete ${paymentCount} associated payment record(s). This action cannot be undone.`
                  : `This will permanently delete the sponsor "${sponsor?.name}". This action cannot be undone.`;
                setConfirmDialog({
                  open: true,
                  title: 'Delete Sponsor',
                  message,
                  onConfirm: () => deleteSponsorMutation.mutate(id),
                  confirmText: 'Delete Sponsor',
                  variant: 'danger'
                });
              }}
              onSendInvoice={sendInvoice}
              onRecordPayment={(s) => { setSelectedSponsor(s); setShowPaymentDialog(true); }}
              canManage={canManageFinance(user)}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsList 
              payments={payments} 
              sponsors={sponsors}
              onEdit={(payment) => {
                const sponsor = sponsors.find(s => s.id === payment.sponsor_id);
                setSelectedSponsor(sponsor);
                setEditingPayment(payment);
                setShowPaymentDialog(true);
              }}
              onDelete={(id) => {
                const payment = payments.find(p => p.id === id);
                setConfirmDialog({
                  open: true,
                  title: 'Delete Payment',
                  message: `This will delete the payment of £${payment?.amount?.toLocaleString() || 0} and remove it from the finance ledger. This action cannot be undone.`,
                  onConfirm: () => deletePaymentMutation.mutate(id),
                  confirmText: 'Delete Payment',
                  variant: 'danger'
                });
              }}
              canManage={canManageFinance(user)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sponsor Dialog */}
      <Dialog open={showSponsorDialog} onOpenChange={setShowSponsorDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
            </DialogTitle>
          </DialogHeader>
          <SponsorForm 
            sponsor={editingSponsor}
            seasons={seasons}
            competitions={competitions}
            teams={teams}
            onSubmit={(data) => {
              if (editingSponsor) {
                updateSponsorMutation.mutate({ id: editingSponsor.id, data });
              } else {
                createSponsorMutation.mutate(data);
              }
            }}
            isLoading={createSponsorMutation.isPending || updateSponsorMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open);
        if (!open) {
          setEditingPayment(null);
          setSelectedSponsor(null);
        }
      }}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              {editingPayment ? 'Edit Payment' : `Record Payment - ${selectedSponsor?.name}`}
            </DialogTitle>
          </DialogHeader>
          <PaymentForm 
            payment={editingPayment}
            sponsor={selectedSponsor}
            seasons={seasons}
            competitions={competitions}
            teams={teams}
            sponsorTypes={sponsorTypes}
            onSubmit={(data) => {
              if (editingPayment) {
                updatePaymentMutation.mutate({ id: editingPayment.id, data });
              } else {
                createPaymentMutation.mutate(data);
              }
            }}
            isLoading={createPaymentMutation.isPending || updatePaymentMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Sponsor Types Manager */}
      <Dialog open={showTypesDialog} onOpenChange={setShowTypesDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>Manage Sponsor Types</DialogTitle>
          </DialogHeader>
          <SponsorTypesManager onShowConfirm={setConfirmDialog} />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant || 'danger'}
      />
    </div>
  );
}

function SponsorTypesManager({ onShowConfirm }) {
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: allTypes = [] } = useQuery({
    queryKey: ['allSponsorTypes'],
    queryFn: () => api.entities.SponsorType.list('display_order'),
  });

  const createTypeMutation = useMutation({
    mutationFn: (data) => api.entities.SponsorType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorTypes'] });
      queryClient.invalidateQueries({ queryKey: ['allSponsorTypes'] });
      setShowForm(false);
      setEditingType(null);
      toast.success('Type added');
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.SponsorType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorTypes'] });
      queryClient.invalidateQueries({ queryKey: ['allSponsorTypes'] });
      setShowForm(false);
      setEditingType(null);
      toast.success('Type updated');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => api.entities.SponsorType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorTypes'] });
      queryClient.invalidateQueries({ queryKey: ['allSponsorTypes'] });
      toast.success('Type deleted');
    },
  });

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button 
          onClick={() => { setEditingType(null); setShowForm(true); }}
          style={{ background: colors.gradientProfit }}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Type
        </Button>
      )}

      {showForm && (
        <Card style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <SponsorTypeForm
              type={editingType}
              onSubmit={(data) => {
                if (editingType) {
                  updateTypeMutation.mutate({ id: editingType.id, data });
                } else {
                  createTypeMutation.mutate(data);
                }
              }}
              onCancel={() => { setShowForm(false); setEditingType(null); }}
              isLoading={createTypeMutation.isPending || updateTypeMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {allTypes.map((type) => (
          <Card key={type.id} style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${type.color}20`, color: type.color }}
                >
                  {type.name[0]}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>{type.name}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Suggested: £{type.suggested_amount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge style={{ 
                  backgroundColor: type.is_active ? colors.profitLight : colors.lossLight,
                  color: type.is_active ? colors.profit : colors.loss
                }}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setEditingType(type); setShowForm(true); }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onShowConfirm({
                      open: true,
                      title: 'Delete Sponsor Type',
                      message: `This will delete the "${type.name}" sponsor type. Any existing sponsorships using this type will remain unchanged.`,
                      onConfirm: () => deleteTypeMutation.mutate(type.id),
                      confirmText: 'Delete Type',
                      variant: 'danger'
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: colors.loss }} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SponsorTypeForm({ type, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: type?.name || '',
    suggested_amount: type?.suggested_amount || 0,
    color: type?.color || '#00d4ff',
    display_order: type?.display_order || 0,
    is_active: type?.is_active !== undefined ? type.is_active : true
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label style={{ color: colors.textSecondary }}>Type Name *</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Platinum, Gold"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Suggested Amount (£) *</Label>
          <Input 
            type="number"
            step="0.01"
            value={formData.suggested_amount} 
            onChange={(e) => setFormData({ ...formData, suggested_amount: parseFloat(e.target.value) || 0 })}
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Color</Label>
          <Input 
            type="color"
            value={formData.color} 
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            style={{ backgroundColor: colors.surface, borderColor: colors.border, height: '40px' }}
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Display Order</Label>
          <Input 
            type="number"
            value={formData.display_order} 
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="w-4 h-4"
        />
        <Label style={{ color: colors.textSecondary }}>Active</Label>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1" style={{ background: colors.gradientProfit }}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {type ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function SponsorGrid({ sponsors, payments, onEdit, onDelete, onSendInvoice, onRecordPayment, canManage }) {
  const { data: sponsorTypes = [] } = useQuery({
    queryKey: ['sponsorTypes'],
    queryFn: () => api.entities.SponsorType.filter({ is_active: true }, 'display_order'),
  });
  if (sponsors.length === 0) {
    return (
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p style={{ color: colors.textMuted }}>No sponsors found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sponsors.map(sponsor => {
      const sponsorPayments = payments.filter(p => p.sponsor_id === sponsor.id);
          const totalPaid = sponsorPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

          // Calculate total agreed: count unique sponsorships and sum their suggested amounts
          const uniqueDeals = new Map();
          sponsorPayments.forEach(p => {
            const key = `${p.season_id || 'none'}-${p.sponsor_type}-${p.sponsorship_level}-${p.competition_id || ''}-${p.team_id || ''}`;
            if (!uniqueDeals.has(key)) {
              uniqueDeals.set(key, p);
            }
          });

          const totalAgreed = Array.from(uniqueDeals.values()).reduce((sum, p) => {
            const type = sponsorTypes.find(t => t.name === p.sponsor_type);
            return sum + (type?.suggested_amount || 0);
          }, 0);
      const latestPayment = sponsorPayments[0]; // Most recent payment
      const levelConfig = latestPayment ? getLevelConfig(latestPayment.sponsor_type, sponsorTypes) : { color: colors.textSecondary, bg: colors.surfaceHover, amount: 0 };

      return (
        <Card 
          key={sponsor.id} 
          className="overflow-hidden transition-all hover:border-opacity-80"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: levelConfig.bg }}>
                    <Building2 className="w-6 h-6" style={{ color: levelConfig.color }} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{sponsor.name}</h3>
                  {latestPayment && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Badge style={{ backgroundColor: levelConfig.bg, color: levelConfig.color }}>
                        {latestPayment.sponsor_type}
                      </Badge>
                      <Badge 
                        style={{ 
                          backgroundColor: latestPayment.sponsorship_level === 'Club' ? '#10b98120' : latestPayment.sponsorship_level === 'League' ? '#3b82f620' : '#8b5cf620',
                          color: latestPayment.sponsorship_level === 'Club' ? '#10b981' : latestPayment.sponsorship_level === 'League' ? '#3b82f6' : '#8b5cf6'
                        }}
                      >
                        {latestPayment.sponsorship_level}
                        {latestPayment.sponsorship_level === 'League' && latestPayment.competition_name && ` • ${latestPayment.competition_name}`}
                        {latestPayment.sponsorship_level === 'Team' && latestPayment.team_name && ` • ${latestPayment.team_name}`}
                      </Badge>
                      {latestPayment.season_name && (
                        <Badge variant="outline" style={{ borderColor: colors.border, color: colors.textMuted }}>
                          {latestPayment.season_name}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.textMuted }}>Total Agreed</span>
                <span className="font-semibold" style={{ color: colors.textSecondary }}>
                  £{parseFloat(totalAgreed || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.textMuted }}>Total Paid</span>
                <span className="font-semibold" style={{ color: colors.textProfit }}>£{(parseFloat(totalPaid) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.textMuted }}>Payments</span>
                <span style={{ color: colors.textSecondary }}>{sponsorPayments.length}</span>
              </div>
              {latestPayment?.description && (
                <p className="text-xs pt-1" style={{ color: colors.textMuted }}>Latest: {latestPayment.description}</p>
              )}
            </div>
            {sponsor.notes && (
              <p className="text-sm mb-4 pt-2" style={{ color: colors.textMuted, borderTop: `1px solid ${colors.border}` }}>{sponsor.notes}</p>
            )}

            {canManage && (
              <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                <Button variant="ghost" size="sm" onClick={() => onEdit(sponsor)} title="Edit Contact Info">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onSendInvoice(sponsor)} title="Send Email">
                  <Send className="w-4 h-4" style={{ color: colors.info }} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onRecordPayment(sponsor)} title="Record Payment">
                  <CreditCard className="w-4 h-4" style={{ color: colors.profit }} />
                </Button>
                {sponsor.website && (
                  <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" title="Visit Website">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="sm" onClick={() => onDelete(sponsor.id)} className="ml-auto" title="Delete Sponsor">
                  <Trash2 className="w-4 h-4" style={{ color: colors.loss }} />
                </Button>
              </div>
            )}
          </div>
        </Card>
      );
      })}
    </div>
  );
}

function SponsorForm({ sponsor, seasons, competitions, teams, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: sponsor?.name || '',
    contact_name: sponsor?.contact_name || '',
    email: sponsor?.email || '',
    phone: sponsor?.phone || '',
    logo_url: sponsor?.logo_url || '',
    website: sponsor?.website || '',
    notes: sponsor?.notes || ''
  });
  const [uploading, setUploading] = useState(false);



  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Image must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Upload to local public/images/sponsors folder
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'sponsors');
      
      const response = await fetch('http://localhost:5000/api/upload-local', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formDataUpload
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const { file_path } = await response.json();
      setFormData({ ...formData, logo_url: file_path });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 pt-2">
      <div className="space-y-3">
        <div>
          <Label style={{ color: colors.textSecondary }}>Company Name *</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label style={{ color: colors.textSecondary }}>Contact Name *</Label>
            <Input 
              value={formData.contact_name} 
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              required
            />
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }}>Phone *</Label>
            <Input 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              required
            />
          </div>
        </div>

        <div>
          <Label style={{ color: colors.textSecondary }}>Email</Label>
          <Input 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>

        <div>
          <Label style={{ color: colors.textSecondary }}>Website URL</Label>
          <Input 
            value={formData.website} 
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://..."
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>

        <div>
          <ImageSelector
            folder="sponsors"
            currentImage={formData.logo_url}
            onSelect={(path) => setFormData({ ...formData, logo_url: path })}
            label="Sponsor Logo"
            aspectRatio="square"
          />
        </div>

        <div>
          <Label style={{ color: colors.textSecondary }}>Notes</Label>
          <Textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="General notes about this sponsor..."
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ background: colors.gradientProfit }}>
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {sponsor ? 'Update Sponsor' : 'Add Sponsor'}
      </Button>
    </form>
  );
}

function PaymentForm({ payment, sponsor, seasons, competitions, teams, sponsorTypes, onSubmit, isLoading }) {
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    api.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    sponsor_id: payment?.sponsor_id || sponsor?.id || '',
    sponsor_name: payment?.sponsor_name || sponsor?.name || '',
    amount: payment?.amount || 0,
    payment_date: payment?.payment_date ? (typeof payment.payment_date === 'string' && payment.payment_date.includes('T') ? payment.payment_date.split('T')[0] : payment.payment_date) : format(new Date(), 'yyyy-MM-dd'),
    season_id: payment?.season_id || seasons[0]?.id || '',
    season_name: payment?.season_name || seasons[0]?.name || '',
    sponsorship_level: payment?.sponsorship_level || 'Club',
    sponsor_type: payment?.sponsor_type || 'Bronze',
    competition_id: payment?.competition_id || '',
    competition_name: payment?.competition_name || '',
    team_id: payment?.team_id || '',
    team_name: payment?.team_name || '',
    payment_method: payment?.payment_method || 'Bank Transfer',
    reference: payment?.reference || '',
    description: payment?.description || '',
    notes: payment?.notes || '',
    created_by: payment?.created_by || ''
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['sponsorPayments'],
    queryFn: () => api.entities.SponsorPayment.list('-payment_date'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for duplicate reference (only when reference is provided)
    if (formData.reference && formData.reference.trim()) {
      const isDuplicate = allPayments.some(p => 
        p.reference && 
        p.reference.toLowerCase().trim() === formData.reference.toLowerCase().trim() &&
        p.id !== payment?.id
      );
      
      if (isDuplicate) {
        toast.error('Reference number already exists. Please use a different reference.');
        return;
      }
    }
    
    const dataToSubmit = {
      ...formData,
      created_by: formData.created_by || currentUser?.email || 'unknown'
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-3">
        {/* Season & Sponsorship Level - TOP */}
        <div>
          <Label style={{ color: colors.textSecondary }}>Season *</Label>
          <Select 
            value={formData.season_id} 
            onValueChange={(seasonId) => {
              const selectedSeason = seasons.find(s => s.id === seasonId);
              setFormData({ 
                ...formData, 
                season_id: seasonId,
                season_name: selectedSeason?.name || ''
              });
            }}
          >
            <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(season => (
                <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label style={{ color: colors.textSecondary }}>Sponsorship Level *</Label>
          <Select 
            value={formData.sponsorship_level} 
            onValueChange={(v) => setFormData({ 
              ...formData, 
              sponsorship_level: v,
              competition_id: v !== 'League' ? '' : formData.competition_id,
              competition_name: v !== 'League' ? '' : formData.competition_name,
              team_id: v !== 'Team' ? '' : formData.team_id,
              team_name: v !== 'Team' ? '' : formData.team_name
            })}
          >
            <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Club">Club Level</SelectItem>
              <SelectItem value="League">League/Competition</SelectItem>
              <SelectItem value="Team">Team Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sponsor Type & Amount Paid - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label style={{ color: colors.textSecondary }}>Sponsor Type *</Label>
            <Select 
              value={formData.sponsor_type} 
              onValueChange={(v) => {
                const selectedType = sponsorTypes.find(t => t.name === v);
                setFormData({ 
                  ...formData, 
                  sponsor_type: v,
                  amount: payment ? formData.amount : (selectedType?.suggested_amount || 0)
                });
              }}
            >
              <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sponsorTypes.map(type => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name} (£{type.suggested_amount?.toLocaleString() || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }}>Amount Paid (£) *</Label>
            <Input 
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''} 
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setFormData({ ...formData, amount: val });
              }}
              placeholder="Actual received"
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              required
            />
          </div>
        </div>

        <div>
          <Label style={{ color: colors.textSecondary }}>Payment Date *</Label>
          <Input 
            type="date"
            value={formData.payment_date} 
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>

        {formData.sponsorship_level === 'League' && (
          <div>
            <Label style={{ color: colors.textSecondary }}>Competition *</Label>
            <Select 
              value={formData.competition_id} 
              onValueChange={(compId) => {
                const selectedComp = competitions.find(c => c.id === compId);
                setFormData({ 
                  ...formData, 
                  competition_id: compId,
                  competition_name: selectedComp?.name || ''
                });
              }}
            >
              <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                <SelectValue placeholder="Select competition" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map(comp => (
                  <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.sponsorship_level === 'Team' && (
          <div>
            <Label style={{ color: colors.textSecondary }}>Team *</Label>
            <Select 
              value={formData.team_id} 
              onValueChange={(teamId) => {
                const selectedTeam = teams.find(t => t.id === teamId);
                setFormData({ 
                  ...formData, 
                  team_id: teamId,
                  team_name: selectedTeam?.name || ''
                });
              }}
            >
              <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label style={{ color: colors.textSecondary }}>Description</Label>
          <Input 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Kit sponsorship for 2024-25 season"
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>

        {/* Payment Method */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label style={{ color: colors.textSecondary }}>Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
              <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ color: colors.textSecondary }}>Reference *</Label>
            <Input 
              value={formData.reference} 
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Bank ref / Receipt no."
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              required
            />
          </div>
        </div>

        <div>
          <Label style={{ color: colors.textSecondary }}>Notes {payment ? '*' : ''}</Label>
          <Textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="Additional notes..."
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required={!!payment}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ background: colors.gradientProfit }}>
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {payment ? 'Update Payment' : 'Record Payment'}
      </Button>
    </form>
  );
}

function PaymentsList({ payments, sponsors, onEdit, onDelete, canManage }) {
  const [filterSponsor, setFilterSponsor] = useState('all');

  const { data: sponsorTypes = [] } = useQuery({
    queryKey: ['sponsorTypes'],
    queryFn: () => api.entities.SponsorType.filter({ is_active: true }, 'display_order'),
  });

  const filteredPayments = filterSponsor === 'all' 
    ? payments 
    : payments.filter(p => p.sponsor_id === filterSponsor);

  if (payments.length === 0) {
    return (
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardContent className="py-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p style={{ color: colors.textMuted }}>No payments recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={filterSponsor} onValueChange={setFilterSponsor}>
          <SelectTrigger className="w-64" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
            <SelectValue placeholder="Filter by sponsor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sponsors</SelectItem>
            {sponsors.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 text-sm" style={{ color: colors.textMuted, paddingTop: '8px' }}>
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </div>

      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardContent className="p-0">
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {filteredPayments.map(payment => {
            const sponsor = sponsors.find(s => s.id === payment.sponsor_id);
            return (
              <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
                    <CreditCard className="w-5 h-5" style={{ color: colors.profit }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{payment.sponsor_name || sponsor?.name}</p>
                      {payment.sponsor_type && (
                        <Badge style={{ 
                          backgroundColor: getLevelConfig(payment.sponsor_type, sponsorTypes).bg,
                          color: getLevelConfig(payment.sponsor_type, sponsorTypes).color
                        }}>
                          {payment.sponsor_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: colors.textMuted }}>
                      <span>{payment.payment_date ? format(parseISO(payment.payment_date), 'dd MMM yyyy') : '-'}</span>
                      <span>•</span>
                      <span>{payment.payment_method}</span>
                      {payment.season_name && (
                        <>
                          <span>•</span>
                          <span>{payment.season_name}</span>
                        </>
                      )}
                      {payment.sponsorship_level && (
                        <>
                          <span>•</span>
                          <span>{payment.sponsorship_level}</span>
                        </>
                      )}
                    </div>
                    {payment.description && (
                      <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{payment.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: colors.textProfit }}>
                      £{(parseFloat(payment.amount) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {payment.reference && (
                      <p className="text-xs" style={{ color: colors.textMuted }}>Ref: {payment.reference}</p>
                    )}
                  </div>
                  {canManage && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEdit(payment)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDelete(payment.id)}
                        style={{ color: colors.loss }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                </div>
                );
                })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}