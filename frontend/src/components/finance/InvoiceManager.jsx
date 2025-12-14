import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Send, FileText, Loader2, Sparkles, Calendar, 
  DollarSign, Users, Clock, CheckCircle, AlertCircle, RefreshCw, Mail, Trash2
} from 'lucide-react';
import { format, addMonths, addDays, parseISO, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { CLUB_CONFIG, getFinanceTheme } from '@/components/ClubConfig';

const colors = getFinanceTheme();

export default function InvoiceManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPricingSuggesting, setIsPricingSuggesting] = useState(false);
  const [pricingSuggestions, setPricingSuggestions] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.entities.Invoice.list('-created_date'),
    initialData: [],
  });

  const { data: memberships } = useQuery({
    queryKey: ['memberships'],
    queryFn: () => api.entities.Membership.list('member_name'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Invoice.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (records) => api.entities.Invoice.bulkCreate(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoices generated successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Invoice.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
  });

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${random}`;
  };

  // AI Generate Invoices for selected members
  const handleAIGenerateInvoices = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select members to generate invoices for');
      return;
    }

    setIsGenerating(true);
    
    const membersToInvoice = memberships.filter(m => selectedMembers.includes(m.id));
    const memberDetails = membersToInvoice.map(m => ({
      name: m.member_name,
      type: m.membership_type,
      fee: m.fee_amount || CLUB_CONFIG.membershipFees[m.membership_type] || 0,
      status: m.status,
      expiry: m.expiry_date
    }));

    const prompt = `Generate professional invoice descriptions for ${CLUB_CONFIG.name} cricket club membership renewals. 
    
Members to invoice:
${JSON.stringify(memberDetails, null, 2)}

For each member, generate:
1. A professional description mentioning their membership type and the club name
2. Suggested due date (14-30 days from now based on their expiry date)
3. Any personalized notes based on their membership type

Return as JSON array with objects containing: member_name, description, due_days (number of days from today), notes`;

    const result = await api.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          invoices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                member_name: { type: "string" },
                description: { type: "string" },
                due_days: { type: "number" },
                notes: { type: "string" }
              }
            }
          }
        }
      }
    });

    const invoiceRecords = membersToInvoice.map(member => {
      const aiData = result.invoices?.find(i => i.member_name === member.member_name) || {};
      return {
        invoice_number: generateInvoiceNumber(),
        member_id: member.id,
        member_name: member.member_name,
        member_email: member.email,
        invoice_type: 'Membership',
        amount: member.fee_amount || CLUB_CONFIG.membershipFees[member.membership_type] || 0,
        due_date: format(addDays(new Date(), aiData.due_days || 14), 'yyyy-MM-dd'),
        status: 'Draft',
        description: aiData.description || `${member.membership_type} Membership - ${CLUB_CONFIG.name}`,
        notes: aiData.notes || '',
        is_recurring: false
      };
    });

    await bulkCreateMutation.mutateAsync(invoiceRecords);
    setIsGenerating(false);
    setShowAIDialog(false);
    setSelectedMembers([]);
  };

  // AI Pricing Suggestions
  const handleGetPricingSuggestions = async () => {
    setIsPricingSuggesting(true);

    const currentPricing = CLUB_CONFIG.membershipFees;
    const membershipStats = {};
    memberships.forEach(m => {
      membershipStats[m.membership_type] = (membershipStats[m.membership_type] || 0) + 1;
    });

    const revenueData = memberships
      .filter(m => m.payment_status === 'Paid')
      .reduce((sum, m) => sum + (m.fee_amount || 0), 0);

    const prompt = `As a sports club financial advisor, analyze and suggest optimal membership pricing for ${CLUB_CONFIG.name} cricket club.

Current pricing:
${JSON.stringify(currentPricing, null, 2)}

Current membership distribution:
${JSON.stringify(membershipStats, null, 2)}

Total revenue collected: £${revenueData}
Total members: ${memberships.length}

Consider:
1. Market rates for amateur cricket clubs in the UK
2. Value proposition for each tier
3. Family-friendly pricing
4. Retention vs acquisition balance
5. Inflation and operating costs

Provide suggested prices with reasoning for each tier, potential revenue impact, and recommended promotional strategies.`;

    const result = await api.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tier: { type: "string" },
                current_price: { type: "number" },
                suggested_price: { type: "number" },
                change_percent: { type: "number" },
                reasoning: { type: "string" }
              }
            }
          },
          overall_analysis: { type: "string" },
          revenue_impact: { type: "string" },
          promotional_ideas: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    setPricingSuggestions(result);
    setIsPricingSuggesting(false);
  };

  // Send invoice via email
  const handleSendInvoice = async (invoice) => {
    if (!invoice.member_email) {
      toast.error('Member email not available');
      return;
    }

    const emailBody = `
Dear ${invoice.member_name},

Please find below your invoice from ${CLUB_CONFIG.name}.

Invoice Number: ${invoice.invoice_number}
Amount Due: £${invoice.amount}
Due Date: ${format(parseISO(invoice.due_date), 'dd MMMM yyyy')}

Description: ${invoice.description}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Please ensure payment is made by the due date.

Thank you for your continued support of ${CLUB_CONFIG.name}!

Best regards,
${CLUB_CONFIG.name} Finance Team
    `.trim();

    await api.integrations.Core.SendEmail({
      to: invoice.member_email,
      subject: `Invoice ${invoice.invoice_number} - ${CLUB_CONFIG.name}`,
      body: emailBody
    });

    await updateMutation.mutateAsync({
      id: invoice.id,
      data: { status: 'Sent', sent_date: format(new Date(), 'yyyy-MM-dd') }
    });

    toast.success(`Invoice sent to ${invoice.member_email}`);
  };

  // Mark as paid
  const handleMarkPaid = async (invoice) => {
    await updateMutation.mutateAsync({
      id: invoice.id,
      data: { status: 'Paid', paid_date: format(new Date(), 'yyyy-MM-dd') }
    });
    toast.success('Invoice marked as paid');
  };

  // Process recurring invoices
  const handleProcessRecurring = async () => {
    const today = new Date();
    const recurringDue = invoices.filter(inv => 
      inv.is_recurring && 
      inv.next_invoice_date && 
      isBefore(parseISO(inv.next_invoice_date), today)
    );

    if (recurringDue.length === 0) {
      toast.info('No recurring invoices due for processing');
      return;
    }

    const newInvoices = recurringDue.map(inv => {
      const frequency = inv.recurring_frequency;
      const monthsToAdd = frequency === 'Monthly' ? 1 : frequency === 'Quarterly' ? 3 : 12;
      
      return {
        invoice_number: generateInvoiceNumber(),
        member_id: inv.member_id,
        member_name: inv.member_name,
        member_email: inv.member_email,
        invoice_type: inv.invoice_type,
        amount: inv.amount,
        due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
        status: 'Draft',
        description: inv.description,
        is_recurring: true,
        recurring_frequency: inv.recurring_frequency,
        next_invoice_date: format(addMonths(new Date(), monthsToAdd), 'yyyy-MM-dd'),
        notes: `Auto-generated from recurring schedule`
      };
    });

    await bulkCreateMutation.mutateAsync(newInvoices);

    // Update original invoices' next date
    for (const inv of recurringDue) {
      const monthsToAdd = inv.recurring_frequency === 'Monthly' ? 1 : 
                          inv.recurring_frequency === 'Quarterly' ? 3 : 12;
      await updateMutation.mutateAsync({
        id: inv.id,
        data: { next_invoice_date: format(addMonths(new Date(), monthsToAdd), 'yyyy-MM-dd') }
      });
    }

    toast.success(`Generated ${newInvoices.length} recurring invoices`);
  };

  // Stats
  const stats = useMemo(() => {
    const total = invoices.length;
    const draft = invoices.filter(i => i.status === 'Draft').length;
    const sent = invoices.filter(i => i.status === 'Sent').length;
    const paid = invoices.filter(i => i.status === 'Paid').length;
    const overdue = invoices.filter(i => 
      i.status === 'Sent' && isBefore(parseISO(i.due_date), new Date())
    ).length;
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
    const outstanding = invoices.filter(i => ['Draft', 'Sent'].includes(i.status)).reduce((s, i) => s + (i.amount || 0), 0);
    const recurring = invoices.filter(i => i.is_recurring).length;

    return { total, draft, sent, paid, overdue, totalRevenue, outstanding, recurring };
  }, [invoices]);

  const filteredInvoices = invoices.filter(inv => 
    filterStatus === 'all' || inv.status === filterStatus
  );

  const statusColors = {
    Draft: { bg: colors.surfaceHover, text: colors.textMuted },
    Sent: { bg: colors.infoLight, text: colors.info },
    Paid: { bg: colors.profitLight, text: colors.profit },
    Overdue: { bg: colors.lossLight, text: colors.loss },
    Cancelled: { bg: colors.surfaceHover, text: colors.textMuted }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.infoLight }}>
              <FileText className="w-5 h-5" style={{ color: colors.info }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.total}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Total Invoices</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
              <CheckCircle className="w-5 h-5" style={{ color: colors.profit }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.textProfit }}>£{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Collected ({stats.paid} paid)</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.pendingLight }}>
              <Clock className="w-5 h-5" style={{ color: colors.pending }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.pending }}>£{stats.outstanding.toLocaleString()}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Outstanding</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.chart3}20` }}>
              <RefreshCw className="w-5 h-5" style={{ color: colors.chart3 }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.recurring}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Recurring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Primary actions first, AI features at end */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button style={{ background: colors.gradientProfit }}>
              <Plus className="w-4 h-4 mr-2" /> Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>Create Invoice</DialogTitle>
            </DialogHeader>
            <InvoiceForm 
              memberships={memberships}
              onSubmit={async (data) => {
                await createMutation.mutateAsync({
                  ...data,
                  invoice_number: generateInvoiceNumber()
                });
                setShowCreateDialog(false);
                toast.success('Invoice created');
              }}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleProcessRecurring} style={{ borderColor: colors.border, color: colors.textSecondary }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Process Recurring
        </Button>

        {/* AI Features - Optional, secondary */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" style={{ borderColor: colors.chart3, color: colors.chart3 }}>
              <Sparkles className="w-4 h-4 mr-2" /> AI Generate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Sparkles className="w-5 h-5" style={{ color: colors.chart3 }} /> AI Invoice Generator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Select members to generate personalized invoices with AI-crafted descriptions.
              </p>
              <div className="rounded-lg max-h-64 overflow-y-auto" style={{ border: `1px solid ${colors.border}` }}>
                {memberships.map(member => (
                  <label key={member.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <Checkbox 
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        setSelectedMembers(prev => 
                          checked ? [...prev, member.id] : prev.filter(id => id !== member.id)
                        );
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{member.member_name}</p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>{member.membership_type} - £{member.fee_amount || CLUB_CONFIG.membershipFees[member.membership_type]}</p>
                    </div>
                    <Badge variant="outline" style={{ borderColor: colors.border, color: colors.textSecondary }}>{member.status}</Badge>
                  </label>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: colors.textMuted }}>{selectedMembers.length} members selected</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedMembers(memberships.map(m => m.id))} style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    Select All
                  </Button>
                  <Button 
                    onClick={handleAIGenerateInvoices} 
                    disabled={isGenerating || selectedMembers.length === 0}
                    style={{ background: `linear-gradient(135deg, ${colors.chart3} 0%, ${colors.info} 100%)` }}
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" style={{ borderColor: colors.chart3, color: colors.chart3 }}>
              <Sparkles className="w-4 h-4 mr-2" /> AI Pricing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Sparkles className="w-5 h-5" style={{ color: colors.chart3 }} /> AI Pricing Optimizer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {!pricingSuggestions ? (
                <div className="text-center py-8">
                  <p className="mb-4" style={{ color: colors.textSecondary }}>
                    Get AI-powered suggestions for optimal membership pricing based on your club's data and market analysis.
                  </p>
                  <Button 
                    onClick={handleGetPricingSuggestions}
                    disabled={isPricingSuggesting}
                    style={{ background: `linear-gradient(135deg, ${colors.chart3} 0%, ${colors.info} 100%)` }}
                  >
                    {isPricingSuggesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Analyze & Suggest
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${colors.chart3}15` }}>
                    <h4 className="font-semibold mb-2" style={{ color: colors.chart3 }}>Overall Analysis</h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{pricingSuggestions.overall_analysis}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Pricing Recommendations</h4>
                    <div className="space-y-3">
                      {pricingSuggestions.suggestions?.map((s, idx) => (
                        <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{s.tier}</span>
                            <div className="text-right">
                              <span className="line-through mr-2" style={{ color: colors.textMuted }}>£{s.current_price}</span>
                              <span className="font-bold" style={{ color: colors.textProfit }}>£{s.suggested_price}</span>
                              <Badge className="ml-2" style={{ 
                                backgroundColor: s.change_percent >= 0 ? colors.profitLight : colors.lossLight,
                                color: s.change_percent >= 0 ? colors.profit : colors.loss
                              }}>
                                {s.change_percent >= 0 ? '+' : ''}{s.change_percent}%
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>{s.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.infoLight }}>
                    <h4 className="font-semibold mb-2" style={{ color: colors.info }}>Revenue Impact</h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{pricingSuggestions.revenue_impact}</p>
                  </div>

                  {pricingSuggestions.promotional_ideas?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>Promotional Ideas</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: colors.textSecondary }}>
                        {pricingSuggestions.promotional_ideas.map((idea, idx) => (
                          <li key={idx}>{idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button variant="outline" onClick={() => setPricingSuggestions(null)} className="w-full" style={{ borderColor: colors.border, color: colors.textSecondary }}>
                    Run New Analysis
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter & List */}
      <Card className="border-0 overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="flex flex-row items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <CardTitle style={{ color: colors.textPrimary }}>Invoices</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.textMuted }}>No invoices found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Invoice #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Member</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Type</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Due Date</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm" style={{ color: colors.textPrimary }}>{inv.invoice_number}</span>
                          {inv.is_recurring && <RefreshCw className="w-3 h-3" style={{ color: colors.chart3 }} />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{inv.member_name}</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>{inv.member_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: colors.border, color: colors.textSecondary }}>{inv.invoice_type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold" style={{ color: colors.textPrimary }}>£{inv.amount}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        {inv.due_date ? format(parseISO(inv.due_date), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge style={{ backgroundColor: statusColors[inv.status]?.bg, color: statusColors[inv.status]?.text }}>{inv.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          {inv.status === 'Draft' && (
                            <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(inv)} title="Send">
                              <Send className="w-4 h-4" style={{ color: colors.info }} />
                            </Button>
                          )}
                          {inv.status === 'Sent' && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv)} title="Mark Paid">
                              <CheckCircle className="w-4 h-4" style={{ color: colors.profit }} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(inv.id)}>
                            <Trash2 className="w-4 h-4" style={{ color: colors.loss }} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceForm({ memberships, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    member_id: '',
    member_name: '',
    member_email: '',
    invoice_type: 'Membership',
    amount: 0,
    due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    description: '',
    is_recurring: false,
    recurring_frequency: 'Annually',
    notes: ''
  });

  const handleMemberChange = (memberId) => {
    const member = memberships.find(m => m.id === memberId);
    if (member) {
      setFormData({
        ...formData,
        member_id: memberId,
        member_name: member.member_name,
        member_email: member.email || '',
        amount: member.fee_amount || CLUB_CONFIG.membershipFees[member.membership_type] || 0,
        description: `${member.membership_type} Membership - ${CLUB_CONFIG.name}`
      });
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label style={{ color: colors.textSecondary }}>Member</Label>
        <Select value={formData.member_id} onValueChange={handleMemberChange}>
          <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
            <SelectValue placeholder="Select member" />
          </SelectTrigger>
          <SelectContent>
            {memberships.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label style={{ color: colors.textSecondary }}>Type</Label>
          <Select value={formData.invoice_type} onValueChange={(v) => setFormData({ ...formData, invoice_type: v })}>
            <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Membership">Membership</SelectItem>
              <SelectItem value="Match Fee">Match Fee</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label style={{ color: colors.textSecondary }}>Amount (£)</Label>
          <Input 
            type="number" 
            value={formData.amount} 
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label style={{ color: colors.textSecondary }}>Due Date</Label>
          <Input 
            type="date" 
            value={formData.due_date} 
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} 
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
        <div className="space-y-2">
          <Label style={{ color: colors.textSecondary }}>Description</Label>
          <Input 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
        <Checkbox 
          checked={formData.is_recurring} 
          onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })} 
        />
        <Label style={{ color: colors.textSecondary }}>Recurring</Label>
        {formData.is_recurring && (
          <Select value={formData.recurring_frequency} onValueChange={(v) => setFormData({ ...formData, recurring_frequency: v })}>
            <SelectTrigger className="w-28" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label style={{ color: colors.textSecondary }}>Notes</Label>
        <Textarea 
          value={formData.notes} 
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
          rows={2} 
          style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ background: colors.gradientProfit }}>
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Invoice
      </Button>
    </form>
  );
}