import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, Save, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CLUB_CONFIG, getFinanceTheme } from '@/components/ClubConfig';

const MEMBERSHIP_FEES = CLUB_CONFIG.membershipFees;
const colors = getFinanceTheme();

export default function MembershipManager() {
  const [editingMember, setEditingMember] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: memberships, isLoading } = useQuery({
    queryKey: ['memberships'],
    queryFn: () => api.entities.Membership.list('-created_date', 200),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Membership.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setIsDialogOpen(false);
      toast.success('Member added successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Membership.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setEditingMember(null);
      setIsDialogOpen(false);
      toast.success('Member updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Membership.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Member deleted successfully');
    },
  });

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'Active').length,
    expired: memberships.filter(m => m.status === 'Expired').length,
    pending: memberships.filter(m => m.status === 'Pending').length,
  };

  const statusColors = {
    Active: { bg: colors.profitLight, text: colors.profit },
    Expired: { bg: colors.lossLight, text: colors.loss },
    Pending: { bg: colors.pendingLight, text: colors.pending },
    Cancelled: { bg: colors.surfaceHover, text: colors.textMuted },
  };

  const paymentColors = {
    Paid: { bg: colors.profitLight, text: colors.profit },
    Unpaid: { bg: colors.lossLight, text: colors.loss },
    Partial: { bg: colors.pendingLight, text: colors.pending },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.infoLight }}>
              <Users className="w-5 h-5" style={{ color: colors.info }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.total}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Total Members</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.profitLight }}>
              <UserCheck className="w-5 h-5" style={{ color: colors.profit }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.textProfit }}>{stats.active}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Active</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.pendingLight }}>
              <Clock className="w-5 h-5" style={{ color: colors.pending }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.pending }}>{stats.pending}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Pending</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.lossLight }}>
              <UserX className="w-5 h-5" style={{ color: colors.loss }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colors.textLoss }}>{stats.expired}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Table */}
      <Card className="border-0 overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="flex flex-row items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <CardTitle style={{ color: colors.textPrimary }}>Club Members</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Member</DialogTitle>
              </DialogHeader>
              <MembershipForm 
                membership={editingMember}
                onSubmit={(data) => {
                  updateMutation.mutate({ id: editingMember.id, data });
                }}
                isLoading={updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Member</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Expiry</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Fee</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Payment</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{member.member_name}</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>{member.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: colors.border, color: colors.textSecondary }}>{member.membership_type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: statusColors[member.status]?.bg, color: statusColors[member.status]?.text }}>{member.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        {member.expiry_date ? format(new Date(member.expiry_date), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold" style={{ color: colors.textPrimary }}>£{member.fee_amount || 0}</td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: paymentColors[member.payment_status]?.bg, color: paymentColors[member.payment_status]?.text }}>{member.payment_status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingMember(member); setIsDialogOpen(true); }} style={{ color: colors.textSecondary }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(member.id)}>
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

function MembershipForm({ membership, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(membership || {
    member_name: '',
    email: '',
    phone: '',
    membership_type: 'Adult',
    status: 'Pending',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    fee_amount: MEMBERSHIP_FEES['Adult'],
    payment_status: 'Unpaid',
    notes: ''
  });

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      membership_type: type,
      fee_amount: MEMBERSHIP_FEES[type]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Member Name *</Label>
          <Input required value={formData.member_name} onChange={(e) => setFormData({ ...formData, member_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Membership Type</Label>
          <Select value={formData.membership_type} onValueChange={handleTypeChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(MEMBERSHIP_FEES).map(type => (
                <SelectItem key={type} value={type}>{type} (£{MEMBERSHIP_FEES[type]})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Expiry Date</Label>
          <Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Fee Amount (£)</Label>
          <Input type="number" value={formData.fee_amount} onChange={(e) => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Payment Status</Label>
          <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ background: colors.gradientProfit }}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {membership ? 'Update Member' : 'Add Member'}
      </Button>
    </form>
  );
}