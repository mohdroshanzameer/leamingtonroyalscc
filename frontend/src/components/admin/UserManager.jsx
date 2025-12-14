import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Loader2, Search, UserCog, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getRoleLabel } from '../RoleAccess';
import { CLUB_CONFIG } from '../ClubConfig';

const CLUB_ROLES = [
  { value: 'member', label: 'Member', color: 'bg-slate-100 text-slate-700' },
  { value: 'captain', label: 'Captain', color: 'bg-blue-100 text-blue-700' },
  { value: 'treasurer', label: 'Treasurer', color: 'bg-green-100 text-green-700' },
  { value: 'social_media', label: 'Social Media', color: 'bg-pink-100 text-pink-700' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
];

export default function UserManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, newRole: null });
  const queryClient = useQueryClient();
  const { colors } = CLUB_CONFIG.theme;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => api.entities.User.list('full_name'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => api.entities.User.update(userId, { club_role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User role updated successfully');
      setConfirmDialog({ open: false, user: null, newRole: null });
    },
    onError: (error) => {
      toast.error('Failed to update user role');
      console.error(error);
    },
  });

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user.full_name || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search) ||
      (user.club_role || 'member').toLowerCase().includes(search)
    );
  });

  const getRoleBadge = (role) => {
    const roleConfig = CLUB_ROLES.find(r => r.value === role) || CLUB_ROLES[0];
    return <Badge className={roleConfig.color}>{roleConfig.label}</Badge>;
  };

  const handleRoleChange = (user, newRole) => {
    if (newRole === (user.club_role || 'member')) return;
    setConfirmDialog({ open: true, user, newRole });
  };

  const confirmRoleChange = () => {
    if (confirmDialog.user && confirmDialog.newRole) {
      updateRoleMutation.mutate({
        userId: confirmDialog.user.id,
        newRole: confirmDialog.newRole
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(196,181,253,0.15)' }}>
                <UserCog className="w-5 h-5" style={{ color: '#c4b5fd' }} />
              </div>
              <div>
                <CardTitle style={{ color: colors.textPrimary }}>User Management</CardTitle>
                <p className="text-sm" style={{ color: colors.textMuted }}>{users.length} users total</p>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2">
        {CLUB_ROLES.map(role => (
          <div key={role.value} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <Badge className={role.color}>{role.label}</Badge>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <CardContent className="p-0 overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: colors.textMuted }} />
              <p style={{ color: colors.textMuted }}>No users found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>System Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Club Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
                            color: '#1a1a2e'
                          }}
                        >
                          {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                          {user.full_name || 'No Name'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.club_role || 'member')}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={user.club_role || 'member'}
                        onValueChange={(newRole) => handleRoleChange(user, newRole)}
                      >
                        <SelectTrigger
                          className="w-[140px] h-8 text-sm"
                          style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                          {CLUB_ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value} style={{ color: colors.textPrimary }}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, user: null, newRole: null })}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Role Change
            </DialogTitle>
            <DialogDescription style={{ color: colors.textSecondary }}>
              Are you sure you want to change the role for this user?
            </DialogDescription>
          </DialogHeader>

          {confirmDialog.user && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.surfaceHover }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)', color: '#1a1a2e' }}
                >
                  {(confirmDialog.user.full_name || confirmDialog.user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>{confirmDialog.user.full_name || 'No Name'}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>{confirmDialog.user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                {getRoleBadge(confirmDialog.user.club_role || 'member')}
                <span style={{ color: colors.textMuted }}>→</span>
                {getRoleBadge(confirmDialog.newRole)}
              </div>

              {confirmDialog.newRole === 'super_admin' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Super Admin has full access to all features including user management, finance, and all admin functions.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, user: null, newRole: null })}
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
              style={{ background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)', color: '#1a1a2e' }}
            >
              {updateRoleMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}