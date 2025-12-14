import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, Plus, Building2, Pencil, Trash2, CheckCircle, 
  ChevronLeft, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { getFinanceTheme, formatCurrency } from '@/components/ClubConfig';
import { maskAccountNumber, maskSortCode } from '@/components/security/DataMasking';
import { validateFormData, isValidSortCode, isValidAccountNumber } from '@/components/security/InputValidator';
import { ActivityLogger } from '@/components/logging/AuditLogger';

const colors = getFinanceTheme();

export default function BankAccounts() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    sort_code: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => api.entities.PaymentSettings.list('-created_date'),
  });

  const [user, setUser] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState({});

  React.useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.PaymentSettings.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      ActivityLogger.logCreate('PaymentSettings', result.id, formData.bank_name, user);
      resetForm();
      toast.success('Bank account added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.PaymentSettings.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      ActivityLogger.logUpdate('PaymentSettings', variables.id, formData.bank_name, user);
      resetForm();
      toast.success('Bank account updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.PaymentSettings.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      ActivityLogger.logDelete('PaymentSettings', id, 'Bank account', user);
      toast.success('Bank account deleted');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (accountId) => {
      // Deactivate all other accounts
      for (const acc of accounts) {
        if (acc.id !== accountId && acc.is_active) {
          await api.entities.PaymentSettings.update(acc.id, { is_active: false });
        }
      }
      // Activate selected account
      await api.entities.PaymentSettings.update(accountId, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      toast.success('Active account updated');
    },
  });

  const resetForm = () => {
    setFormData({ bank_name: '', account_name: '', account_number: '', sort_code: '', is_active: true });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleEdit = (account) => {
    setFormData({
      bank_name: account.bank_name || '',
      account_name: account.account_name || '',
      account_number: account.account_number || '',
      sort_code: account.sort_code || '',
      is_active: account.is_active ?? true
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleSubmit = () => {
    // Validate form data
    const validation = validateFormData(formData, {
      bank_name: { required: true, label: 'Bank name', minLength: 2, maxLength: 50 },
      account_name: { label: 'Account name', maxLength: 100 },
      account_number: { required: true, type: 'accountNumber', label: 'Account number' },
      sort_code: { type: 'sortCode', label: 'Sort code' }
    });
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }
    
    setValidationErrors({});
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const activeAccount = accounts.find(a => a.is_active);

  const toggleStripeMutation = useMutation({
    mutationFn: async (enabled) => {
      if (activeAccount) {
        return api.entities.PaymentSettings.update(activeAccount.id, { use_stripe: enabled });
      } else if (accounts.length > 0) {
        return api.entities.PaymentSettings.update(accounts[0].id, { use_stripe: enabled });
      }
      return api.entities.PaymentSettings.create({ use_stripe: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      toast.success('Stripe settings updated');
    },
  });

  const stripeEnabled = activeAccount?.use_stripe || accounts.some(a => a.use_stripe);

  return (
    <div className="min-h-screen pt-20 lg:pt-4 pb-12" style={{ backgroundColor: colors.background }}>
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to={createPageUrl('Finance')}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Bank Accounts</h1>
              <p className="text-xs" style={{ color: colors.textMuted }}>Manage payment bank accounts</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
            style={{ background: colors.gradientProfit }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Account</span>
          </Button>
        </div>

        {/* Stripe Toggle */}
        <Card className="mb-6 border-0" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #635bff 0%, #8b5cf6 100%)' }}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>Stripe Payments</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Enable online card payments via Stripe</p>
                </div>
              </div>
              <Switch 
                checked={stripeEnabled} 
                onCheckedChange={(v) => toggleStripeMutation.mutate(v)}
                disabled={toggleStripeMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Account Highlight */}
        {activeAccount && (
          <Card className="mb-6 border-0" style={{ backgroundColor: colors.surface, border: `2px solid ${colors.profit}` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
                    <CheckCircle className="w-5 h-5" style={{ color: colors.profit }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.profit }}>Active Account</p>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>{activeAccount.bank_name}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{activeAccount.account_name} • {maskAccountNumber(activeAccount.account_number)}</p>
                  </div>
                </div>
                <Badge style={{ backgroundColor: colors.profitLight, color: colors.profit }}>
                  Used for Stripe
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        <Card className="border-0" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>All Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
                <p style={{ color: colors.textMuted }}>No bank accounts added yet</p>
                <Button onClick={() => setShowForm(true)} className="mt-4" style={{ background: colors.gradientProfit }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ backgroundColor: colors.surfaceHover }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: account.is_active ? colors.profitLight : colors.background }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: account.is_active ? colors.profit : colors.textMuted }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{account.bank_name}</p>
                          {account.is_active && (
                            <Badge className="text-[10px]" style={{ backgroundColor: colors.profitLight, color: colors.profit }}>Active</Badge>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {account.account_name} • {maskSortCode(account.sort_code)} • {maskAccountNumber(account.account_number)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {!account.is_active && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveMutation.mutate(account.id)}
                          disabled={setActiveMutation.isPending}
                          style={{ borderColor: colors.profit, color: colors.profit }}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(account)}
                        style={{ borderColor: colors.border, color: colors.textSecondary }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteMutation.mutate(account.id)}
                        disabled={deleteMutation.isPending}
                        style={{ borderColor: colors.loss, color: colors.loss }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); else setShowForm(true); }}>
          <DialogContent className="max-w-md" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label style={{ color: colors.textMuted }}>Bank Name *</Label>
                <Input 
                  value={formData.bank_name} 
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g., Barclays, HSBC, Lloyds"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: colors.textMuted }}>Account Name</Label>
                <Input 
                  value={formData.account_name} 
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Account holder name"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label style={{ color: validationErrors.account_number ? colors.loss : colors.textMuted }}>Account Number *</Label>
                  <Input 
                    value={formData.account_number} 
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="12345678"
                    style={{ backgroundColor: colors.surfaceHover, borderColor: validationErrors.account_number ? colors.loss : colors.border, color: colors.textPrimary }}
                  />
                  {validationErrors.account_number && <p className="text-xs mt-1" style={{ color: colors.loss }}>{validationErrors.account_number}</p>}
                </div>
                <div className="space-y-2">
                  <Label style={{ color: validationErrors.sort_code ? colors.loss : colors.textMuted }}>Sort Code</Label>
                  <Input 
                    value={formData.sort_code} 
                    onChange={(e) => setFormData({ ...formData, sort_code: e.target.value })}
                    placeholder="00-00-00"
                    style={{ backgroundColor: colors.surfaceHover, borderColor: validationErrors.sort_code ? colors.loss : colors.border, color: colors.textPrimary }}
                  />
                  {validationErrors.sort_code && <p className="text-xs mt-1" style={{ color: colors.loss }}>{validationErrors.sort_code}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>Set as Active</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Use this account for payments</p>
                </div>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={resetForm} 
                  className="flex-1"
                  style={{ borderColor: colors.border, color: colors.textSecondary }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                  style={{ background: colors.gradientProfit }}
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAccount ? 'Update' : 'Add Account'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}