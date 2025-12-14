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

const colors = getFinanceTheme();

const LEVEL_CONFIG = {
  Platinum: { color: '#e5e4e2', bg: '#e5e4e215', amount: 5000 },
  Gold: { color: '#ffd700', bg: '#ffd70015', amount: 2500 },
  Silver: { color: '#c0c0c0', bg: '#c0c0c015', amount: 1000 },
  Bronze: { color: '#cd7f32', bg: '#cd7f3215', amount: 500 },
  'Match Day': { color: colors.info, bg: colors.infoLight, amount: 250 },
  Kit: { color: colors.chart3, bg: `${colors.chart3}15`, amount: 1500 },
  Other: { color: colors.textSecondary, bg: colors.surfaceHover, amount: 0 }
};

export default function Sponsorships() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSponsorDialog, setShowSponsorDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(u => setUser(u))
      .catch((err) => {
        if (err?.status === 401 || err?.status === 403) return api.auth.redirectToLogin();
        console.error('Sponsorships: failed to load current user', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.entities.Sponsor.list('-created_date'),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['sponsorPayments'],
    queryFn: () => api.entities.SponsorPayment.list('-payment_date'),
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
    mutationFn: (id) => api.entities.Sponsor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Sponsor deleted');
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data) => {
      await api.entities.SponsorPayment.create(data);
      // Update sponsor amount_paid
      const sponsor = sponsors.find(s => s.id === data.sponsor_id);
      if (sponsor) {
        await api.entities.Sponsor.update(sponsor.id, {
          amount_paid: (sponsor.amount_paid || 0) + data.amount
        });
        
        // Create a Transaction record for club income
        await api.entities.Transaction.create({
          type: 'Income',
          category_name: 'Sponsorship',
          amount: data.amount,
          description: `Sponsorship payment - ${sponsor.company_name} (${sponsor.sponsorship_level})`,
          date: data.payment_date,
          reference: data.reference,
          received_from: sponsor.company_name,
          payment_method: data.payment_method,
          status: 'Completed',
          notes: data.notes
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

  // Stats
  const stats = useMemo(() => {
    const active = sponsors.filter(s => s.status === 'Active');
    const totalValue = active.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalPaid = active.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
    const outstanding = totalValue - totalPaid;
    const expiringSoon = active.filter(s => 
      s.end_date && isBefore(parseISO(s.end_date), addDays(new Date(), 30))
    ).length;

    return { active: active.length, totalValue, totalPaid, outstanding, expiringSoon };
  }, [sponsors]);

  const sendInvoice = async (sponsor) => {
    if (!sponsor.email) {
      toast.error('Sponsor email not available');
      return;
    }

    const outstanding = (sponsor.amount || 0) - (sponsor.amount_paid || 0);
    const emailBody = `
Dear ${sponsor.contact_name || sponsor.company_name},

Thank you for your continued support of ${CLUB_CONFIG.name}.

Sponsorship Details:
- Level: ${sponsor.sponsorship_level}
- Total Amount: £${sponsor.amount}
- Amount Paid: £${sponsor.amount_paid || 0}
- Outstanding: £${outstanding}
- Period: ${sponsor.start_date ? format(parseISO(sponsor.start_date), 'dd MMM yyyy') : 'N/A'} - ${sponsor.end_date ? format(parseISO(sponsor.end_date), 'dd MMM yyyy') : 'N/A'}

${sponsor.benefits ? `Benefits Included:\n${sponsor.benefits}\n` : ''}

Please arrange payment at your earliest convenience.

Best regards,
${CLUB_CONFIG.name}
    `.trim();

    await api.integrations.Core.SendEmail({
      to: sponsor.email,
      subject: `Sponsorship Invoice - ${CLUB_CONFIG.name}`,
      body: emailBody
    });

    toast.success(`Invoice sent to ${sponsor.email}`);
  };

  const formatCurrency = (v) => `£${v?.toLocaleString() || 0}`;

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
              <Button 
                onClick={() => { setEditingSponsor(null); setShowSponsorDialog(true); }}
                style={{ background: colors.gradientProfit }}
                className="text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Sponsor
              </Button>
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
                <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Total Value</p>
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
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList style={{ backgroundColor: colors.surface }}>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="all">All Sponsors</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <SponsorGrid 
              sponsors={sponsors.filter(s => s.status === 'Active')}
              onEdit={(s) => { setEditingSponsor(s); setShowSponsorDialog(true); }}
              onDelete={(id) => deleteSponsorMutation.mutate(id)}
              onSendInvoice={sendInvoice}
              onRecordPayment={(s) => { setSelectedSponsor(s); setShowPaymentDialog(true); }}
              canManage={canManageFinance(user)}
            />
          </TabsContent>

          <TabsContent value="all">
            <SponsorGrid 
              sponsors={sponsors}
              onEdit={(s) => { setEditingSponsor(s); setShowSponsorDialog(true); }}
              onDelete={(id) => deleteSponsorMutation.mutate(id)}
              onSendInvoice={sendInvoice}
              onRecordPayment={(s) => { setSelectedSponsor(s); setShowPaymentDialog(true); }}
              canManage={canManageFinance(user)}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsList payments={payments} sponsors={sponsors} />
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
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              Record Payment - {selectedSponsor?.company_name}
            </DialogTitle>
          </DialogHeader>
          <PaymentForm 
            sponsor={selectedSponsor}
            onSubmit={(data) => createPaymentMutation.mutate(data)}
            isLoading={createPaymentMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SponsorGrid({ sponsors, onEdit, onDelete, onSendInvoice, onRecordPayment, canManage }) {
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
        const levelConfig = LEVEL_CONFIG[sponsor.sponsorship_level] || LEVEL_CONFIG.Other;
        const outstanding = (sponsor.amount || 0) - (sponsor.amount_paid || 0);
        const paidPercent = sponsor.amount ? ((sponsor.amount_paid || 0) / sponsor.amount * 100) : 0;

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
                    <img src={sponsor.logo_url} alt={sponsor.company_name} className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: levelConfig.bg }}>
                      <Building2 className="w-6 h-6" style={{ color: levelConfig.color }} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{sponsor.company_name}</h3>
                    <Badge style={{ backgroundColor: levelConfig.bg, color: levelConfig.color }}>
                      {sponsor.sponsorship_level}
                    </Badge>
                  </div>
                </div>
                <Badge style={{ 
                  backgroundColor: sponsor.status === 'Active' ? colors.profitLight : colors.pendingLight,
                  color: sponsor.status === 'Active' ? colors.profit : colors.pending
                }}>
                  {sponsor.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textMuted }}>Value</span>
                  <span className="font-semibold" style={{ color: colors.textPrimary }}>£{sponsor.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textMuted }}>Paid</span>
                  <span style={{ color: colors.textProfit }}>£{(sponsor.amount_paid || 0).toLocaleString()}</span>
                </div>
                {outstanding > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textMuted }}>Outstanding</span>
                    <span style={{ color: colors.pending }}>£{outstanding.toLocaleString()}</span>
                  </div>
                )}
                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceHover }}>
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(paidPercent, 100)}%`, backgroundColor: colors.profit }}
                  />
                </div>
              </div>

              {sponsor.end_date && (
                <div className="flex items-center gap-2 text-xs mb-4" style={{ color: colors.textMuted }}>
                  <Calendar className="w-3 h-3" />
                  Expires: {format(parseISO(sponsor.end_date), 'dd MMM yyyy')}
                </div>
              )}

              {canManage && (
                <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(sponsor)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {outstanding > 0 && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onSendInvoice(sponsor)} title="Send Invoice">
                        <Send className="w-4 h-4" style={{ color: colors.info }} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onRecordPayment(sponsor)} title="Record Payment">
                        <CreditCard className="w-4 h-4" style={{ color: colors.profit }} />
                      </Button>
                    </>
                  )}
                  {sponsor.website_url && (
                    <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onDelete(sponsor.id)} className="ml-auto">
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

function SponsorForm({ sponsor, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    company_name: sponsor?.company_name || '',
    contact_name: sponsor?.contact_name || '',
    email: sponsor?.email || '',
    phone: sponsor?.phone || '',
    logo_url: sponsor?.logo_url || '',
    website_url: sponsor?.website_url || '',
    sponsorship_level: sponsor?.sponsorship_level || 'Bronze',
    amount: sponsor?.amount || LEVEL_CONFIG.Bronze.amount,
    start_date: sponsor?.start_date || format(new Date(), 'yyyy-MM-dd'),
    end_date: sponsor?.end_date || format(addDays(new Date(), 365), 'yyyy-MM-dd'),
    status: sponsor?.status || 'Active',
    benefits: sponsor?.benefits || '',
    notes: sponsor?.notes || '',
    season: sponsor?.season || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  });
  const [uploading, setUploading] = useState(false);

  const handleLevelChange = (level) => {
    setFormData({ 
      ...formData, 
      sponsorship_level: level,
      amount: LEVEL_CONFIG[level]?.amount || formData.amount
    });
  };

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
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label style={{ color: colors.textSecondary }}>Company Name *</Label>
          <Input 
            value={formData.company_name} 
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Contact Name</Label>
          <Input 
            value={formData.contact_name} 
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
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
          <Label style={{ color: colors.textSecondary }}>Level *</Label>
          <Select value={formData.sponsorship_level} onValueChange={handleLevelChange}>
            <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(LEVEL_CONFIG).map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Amount (£) *</Label>
          <Input 
            type="number"
            value={formData.amount} 
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Start Date</Label>
          <Input 
            type="date"
            value={formData.start_date} 
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>End Date</Label>
          <Input 
            type="date"
            value={formData.end_date} 
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Season</Label>
          <Input 
            value={formData.season} 
            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            placeholder="e.g., 2024-2025"
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <Label style={{ color: colors.textSecondary }}>Logo (Max 2MB)</Label>
          <div className="flex items-center gap-3">
            {formData.logo_url ? (
              <div className="relative">
                <img 
                  src={formData.logo_url} 
                  alt="Logo preview" 
                  className="w-16 h-16 rounded-lg object-contain bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logo_url: '' })}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.loss }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.surfaceHover, border: `1px dashed ${colors.border}` }}
              >
                <Building2 className="w-6 h-6" style={{ color: colors.textMuted }} />
              </div>
            )}
            <div className="flex-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div 
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: colors.surfaceHover, 
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary 
                  }}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </div>
              </label>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>PNG, JPG up to 2MB</p>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <Label style={{ color: colors.textSecondary }}>Website URL</Label>
          <Input 
            value={formData.website_url} 
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            placeholder="https://..."
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <Label style={{ color: colors.textSecondary }}>Benefits Included</Label>
          <Textarea 
            value={formData.benefits} 
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            placeholder="Logo on kit, website banner, match day announcements..."
            rows={2}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <Label style={{ color: colors.textSecondary }}>Notes</Label>
          <Textarea 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
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

function PaymentForm({ sponsor, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    sponsor_id: sponsor?.id || '',
    sponsor_name: sponsor?.company_name || '',
    amount: (sponsor?.amount || 0) - (sponsor?.amount_paid || 0),
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'Bank Transfer',
    reference: '',
    notes: ''
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 pt-2">
      <div className="p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: colors.textMuted }}>Outstanding</span>
          <span className="font-semibold" style={{ color: colors.pending }}>
            £{((sponsor?.amount || 0) - (sponsor?.amount_paid || 0)).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label style={{ color: colors.textSecondary }}>Amount (£) *</Label>
          <Input 
            type="number"
            value={formData.amount} 
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Date *</Label>
          <Input 
            type="date"
            value={formData.payment_date} 
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
            required
          />
        </div>
        <div>
          <Label style={{ color: colors.textSecondary }}>Method</Label>
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
          <Label style={{ color: colors.textSecondary }}>Reference</Label>
          <Input 
            value={formData.reference} 
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div className="col-span-2">
          <Label style={{ color: colors.textSecondary }}>Notes</Label>
          <Input 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ background: colors.gradientProfit }}>
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Record Payment
      </Button>
    </form>
  );
}

function PaymentsList({ payments, sponsors }) {
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
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardContent className="p-0">
        <div className="divide-y" style={{ borderColor: colors.border }}>
          {payments.map(payment => {
            const sponsor = sponsors.find(s => s.id === payment.sponsor_id);
            return (
              <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
                    <CreditCard className="w-5 h-5" style={{ color: colors.profit }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>{payment.sponsor_name || sponsor?.company_name}</p>
                    <p className="text-xs" style={{ color: colors.textMuted }}>
                      {payment.payment_date ? format(parseISO(payment.payment_date), 'dd MMM yyyy') : '-'} • {payment.payment_method}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: colors.textProfit }}>+£{payment.amount?.toLocaleString()}</p>
                  {payment.reference && (
                    <p className="text-xs" style={{ color: colors.textMuted }}>Ref: {payment.reference}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}