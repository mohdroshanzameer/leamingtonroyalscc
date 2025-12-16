import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function PaymentSettingsManager() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    use_stripe: false,
    bank_name: '',
    account_number: '',
    sort_code: '',
    account_name: '',
    junior_membership_fee: 25,
    adult_membership_fee: 75,
    family_membership_fee: 150,
    senior_membership_fee: 50,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const result = await api.entities.PaymentSettings.list();
      if (result && result.length > 0) {
        setFormData(result[0]);
        return result[0];
      }
      return null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return api.entities.PaymentSettings.update(settings.id, data);
      } else {
        return api.entities.PaymentSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
      toast.success('Payment settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Settings className="w-5 h-5" />
          Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stripe Settings */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Online Payments</h3>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
              <Label htmlFor="use_stripe" style={{ color: colors.textSecondary }}>Enable Stripe Payment Processing</Label>
              <Switch
                id="use_stripe"
                checked={formData.use_stripe}
                onCheckedChange={(v) => setFormData({ ...formData, use_stripe: v })}
              />
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Bank Transfer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label style={{ color: colors.textSecondary }}>Bank Name</Label>
                <Input
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g., Barclays"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>Account Name</Label>
                <Input
                  value={formData.account_name || ''}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Leamington Royals CC"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>Account Number</Label>
                <Input
                  value={formData.account_number || ''}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="12345678"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>Sort Code</Label>
                <Input
                  value={formData.sort_code || ''}
                  onChange={(e) => setFormData({ ...formData, sort_code: e.target.value })}
                  placeholder="12-34-56"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
            </div>
          </div>

          {/* Membership Fees */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Membership Registration Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label style={{ color: colors.textSecondary }}>Junior Membership (£)</Label>
                <Input
                  type="number"
                  value={formData.junior_membership_fee || 0}
                  onChange={(e) => setFormData({ ...formData, junior_membership_fee: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>Adult Membership (£)</Label>
                <Input
                  type="number"
                  value={formData.adult_membership_fee || 0}
                  onChange={(e) => setFormData({ ...formData, adult_membership_fee: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>Family Membership (£)</Label>
                <Input
                  type="number"
                  value={formData.family_membership_fee || 0}
                  onChange={(e) => setFormData({ ...formData, family_membership_fee: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <Label style={{ color: colors.textSecondary }}>Senior Membership (£)</Label>
                <Input
                  type="number"
                  value={formData.senior_membership_fee || 0}
                  onChange={(e) => setFormData({ ...formData, senior_membership_fee: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="mt-1"
                  style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="font-semibold"
              style={{ backgroundColor: colors.accent, color: '#000' }}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}