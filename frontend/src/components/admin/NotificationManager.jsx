import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Bell, Send, Trash2, Edit2, Loader2, Calendar, Newspaper, 
  Megaphone, Trophy, Wallet, Settings, Users, Eye, Mail
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/confirm-dialog';

const typeIcons = {
  Event: Calendar,
  News: Newspaper,
  Announcement: Megaphone,
  Match: Trophy,
  Finance: Wallet,
  System: Settings,
};

const priorityColors = {
  Low: 'bg-slate-100 text-slate-700',
  Normal: 'bg-blue-100 text-blue-700',
  High: 'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};

export default function NotificationManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: () => api.entities.Notification.list('-created_date', 200),
    initialData: [],
  });

  const { data: userNotifications } = useQuery({
    queryKey: ['allUserNotifications'],
    queryFn: () => api.entities.UserNotification.list('-created_date', 1000),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => api.entities.User.list('full_name', 500),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Notification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      setIsDialogOpen(false);
      toast.success('Notification created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Notification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      setEditingNotification(null);
      setIsDialogOpen(false);
      toast.success('Notification updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      toast.success('Notification deleted');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (notification) => {
      setSendingEmail(notification.id);
      const targetUsers = users.filter(u => {
        if (notification.target_audience === 'All') return true;
        if (notification.target_audience === 'Admins' && u.role === 'admin') return true;
        if (notification.target_audience === 'Members') return true;
        if (notification.target_audience === 'Treasurers' && u.club_role === 'treasurer') return true;
        return false;
      });

      for (const user of targetUsers) {
        await api.integrations.Core.SendEmail({
          to: user.email,
          subject: `[Leamington Royals] ${notification.title}`,
          body: `
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.link_url ? `<p><a href="${notification.link_url}">${notification.link_text || 'View Details'}</a></p>` : ''}
            <hr>
            <p style="color: #666; font-size: 12px;">This notification was sent from Leamington Royals Cricket Club</p>
          `
        });
      }
      return targetUsers.length;
    },
    onSuccess: (count) => {
      setSendingEmail(null);
      toast.success(`Email sent to ${count} members`);
    },
    onError: () => {
      setSendingEmail(null);
      toast.error('Failed to send emails');
    }
  });

  // Get read stats for each notification
  const getNotificationStats = (notifId) => {
    const related = userNotifications.filter(un => un.notification_id === notifId);
    return {
      read: related.filter(un => un.is_read).length,
      dismissed: related.filter(un => un.is_dismissed).length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
          <p className="text-slate-500">Send notifications to club members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingNotification(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-700 hover:bg-purple-800">
              <Plus className="w-4 h-4 mr-2" /> Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNotification ? 'Edit Notification' : 'Create Notification'}</DialogTitle>
            </DialogHeader>
            <NotificationForm
              notification={editingNotification}
              onSubmit={(data) => {
                if (editingNotification) {
                  updateMutation.mutate({ id: editingNotification.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-800">{notifications.length}</p>
            <p className="text-sm text-slate-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700">{notifications.filter(n => n.is_active).length}</p>
            <p className="text-sm text-slate-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{notifications.filter(n => n.priority === 'Urgent').length}</p>
            <p className="text-sm text-slate-500">Urgent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{users.length}</p>
            <p className="text-sm text-slate-500">Recipients</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No notifications created yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => {
                const Icon = typeIcons[notification.type] || Megaphone;
                const stats = getNotificationStats(notification.id);
                
                return (
                  <div key={notification.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${priorityColors[notification.priority]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-2">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendEmailMutation.mutate(notification)}
                              disabled={sendingEmail === notification.id}
                              title="Send email to recipients"
                            >
                              {sendingEmail === notification.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingNotification(notification); setIsDialogOpen(true); }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: 'Delete Notification',
                                  message: `Are you sure you want to delete the notification "${notification.title}"? This action cannot be undone.`,
                                  onConfirm: () => deleteMutation.mutate(notification.id),
                                  confirmText: 'Delete Notification',
                                  variant: 'danger'
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={priorityColors[notification.priority]}>{notification.priority}</Badge>
                          <Badge variant="outline">{notification.type}</Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {notification.target_audience}
                          </Badge>
                          {!notification.is_active && <Badge variant="secondary">Inactive</Badge>}
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {stats.read} read
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(parseISO(notification.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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

function NotificationForm({ notification, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: notification?.title || '',
    message: notification?.message || '',
    type: notification?.type || 'Announcement',
    priority: notification?.priority || 'Normal',
    target_audience: notification?.target_audience || 'All',
    link_url: notification?.link_url || '',
    link_text: notification?.link_text || '',
    expires_at: notification?.expires_at || '',
    is_active: notification?.is_active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Notification title"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Message *</Label>
        <Textarea
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Notification message"
          className="h-24"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Announcement">Announcement</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="News">News</SelectItem>
              <SelectItem value="Match">Match</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="System">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Target Audience</Label>
        <Select value={formData.target_audience} onValueChange={(v) => setFormData({ ...formData, target_audience: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Members</SelectItem>
            <SelectItem value="Members">Members Only</SelectItem>
            <SelectItem value="Admins">Admins Only</SelectItem>
            <SelectItem value="Players">Players Only</SelectItem>
            <SelectItem value="Treasurers">Treasurers Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Link URL (optional)</Label>
          <Input
            value={formData.link_url}
            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
            placeholder="/Events"
          />
        </div>
        <div className="space-y-2">
          <Label>Link Text</Label>
          <Input
            value={formData.link_text}
            onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
            placeholder="View Event"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Expires At (optional)</Label>
        <Input
          type="date"
          value={formData.expires_at}
          onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
        />
      </div>
      
      <div className="flex items-center gap-3">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
        />
        <Label>Active</Label>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full bg-purple-700 hover:bg-purple-800">
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {notification ? 'Update' : 'Create'} Notification
      </Button>
    </form>
  );
}