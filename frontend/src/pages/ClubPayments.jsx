import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, ChevronLeft, Receipt, Search, Trash2, Pencil } from 'lucide-react';
import StripePayButton from '../components/payments/StripePayButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { formatCurrency, getFinanceTheme } from '../components/ClubConfig';
import { canViewFinance, canManageFinance } from '../components/RoleAccess';

const colors = getFinanceTheme();

export default function ClubPayments() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    category_id: '',
    category_name: '',
    type: 'Expense',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    paid_to: '',
    payment_method: 'Bank Transfer',
    status: 'Completed',
    notes: ''
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    api.auth.me()
      .then(u => setUser(u))
      .catch((err) => {
        if (err?.status === 401 || err?.status === 403) return api.auth.redirectToLogin();
        console.error('ClubPayments: failed to load current user', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['clubPayments'],
    queryFn: () => api.entities.Transaction.filter({ type: 'Expense' }, '-date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      const all = await api.entities.FinanceCategory.list('display_order');
      return all.filter(c => c.type === 'Expense' && c.is_active !== false);
    },
  });



  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      resetForm();
      toast.success('Payment recorded');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      resetForm();
      toast.success('Payment updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubPayments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Payment deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      category_id: '',
      category_name: '',
      type: 'Expense',
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      paid_to: '',
      payment_method: 'Bank Transfer',
      status: 'Completed',
      notes: ''
    });
    setEditingPayment(null);
    setShowForm(false);
  };

  const handleEdit = (payment) => {
    setFormData({
      category_id: payment.category_id || '',
      category_name: payment.category_name || '',
      type: 'Expense',
      amount: payment.amount || '',
      description: payment.description || '',
      date: payment.date || format(new Date(), 'yyyy-MM-dd'),
      paid_to: payment.paid_to || '',
      payment_method: payment.payment_method || 'Bank Transfer',
      status: payment.status || 'Completed',
      notes: payment.notes || ''
    });
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setFormData({ 
      ...formData, 
      category_id: categoryId,
      category_name: category?.name || ''
    });
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.description) {
      toast.error('Amount and description are required');
      return;
    }
    
    const data = { ...formData, amount: parseFloat(formData.amount) };
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStripePayment = async ({ amount, description }) => {
    // Create a pending transaction when Stripe payment is initiated
    const data = { ...formData, amount: parseFloat(formData.amount), status: 'Pending', notes: 'Stripe payment initiated' };
    createMutation.mutate(data);
  };

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.description?.toLowerCase().includes(q) || t.paid_to?.toLowerCase().includes(q);
  });

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  if (!user || !canViewFinance(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <Receipt className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p style={{ color: colors.textMuted }}>Access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link 
              to={createPageUrl('Finance')} 
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>Club Payments</h1>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total: {formatCurrency(totalAmount)}</p>
            </div>
          </div>
          {canManageFinance(user) && (
            <Button onClick={() => setShowForm(true)} size="sm" style={{ background: colors.gradientLoss }}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>

        {/* Payments List */}
        <Card className="border-0" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.accent }} />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-10 h-10 mx-auto mb-2" style={{ color: colors.textMuted }} />
                <p style={{ color: colors.textMuted }}>No payments</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {filteredTransactions.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="p-4 flex items-center justify-between transition-colors"
                    style={{ ':hover': { backgroundColor: colors.surfaceHover } }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" style={{ color: colors.textPrimary }}>{payment.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: colors.textMuted }}>
                        <span>{payment.date ? format(new Date(payment.date), 'dd MMM yyyy') : '-'}</span>
                        {payment.paid_to && <span>• {payment.paid_to}</span>}
                        {payment.category_name && <span>• {payment.category_name}</span>}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                        Recorded: {payment.created_date ? format(new Date(payment.created_date), 'dd MMM yyyy, HH:mm') : '-'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold" style={{ color: colors.textLoss }}>-{formatCurrency(payment.amount)}</span>
                      {canManageFinance(user) && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(payment)}>
                            <Pencil className="w-4 h-4" style={{ color: colors.textSecondary }} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(payment.id)}>
                            <Trash2 className="w-4 h-4" style={{ color: colors.loss }} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); else setShowForm(true); }}>
          <DialogContent className="max-w-md [&>button]:text-white [&>button]:opacity-70 [&>button:hover]:opacity-100" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>{editingPayment ? 'Edit Payment' : 'New Payment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs" style={{ color: colors.textMuted }}>Amount *</Label>
                  <Input 
                    type="number"
                    value={formData.amount} 
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <Label className="text-xs" style={{ color: colors.textMuted }}>Date</Label>
                  <Input 
                    type="date"
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs" style={{ color: colors.textMuted }}>Description *</Label>
                <Input 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was this payment for?"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs" style={{ color: colors.textMuted }}>Category</Label>
                  <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                    <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs" style={{ color: colors.textMuted }}>Paid To</Label>
                  <Input 
                    value={formData.paid_to} 
                    onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                    placeholder="Vendor name"
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs" style={{ color: colors.textMuted }}>Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={resetForm} className="flex-1" style={{ borderColor: colors.border, color: colors.textSecondary }}>Cancel</Button>
                {!editingPayment && (
                  <StripePayButton
                    amount={parseFloat(formData.amount) || 0}
                    description={formData.description}
                    onPaymentInitiated={handleStripePayment}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  />
                )}
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                  style={{ background: colors.gradientLoss }}
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}