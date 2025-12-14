import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, Newspaper, Megaphone, Trophy, Wallet, Settings, X, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, parseISO, isPast } from 'date-fns';
import { Link } from 'react-router-dom';

const typeIcons = {
  Event: Calendar,
  News: Newspaper,
  Announcement: Megaphone,
  Match: Trophy,
  Finance: Wallet,
  System: Settings,
};

const priorityColors = {
  Low: 'bg-slate-100 text-slate-600',
  Normal: 'bg-blue-100 text-blue-700',
  High: 'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.entities.Notification.list('-created_date', 50),
    initialData: [],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: userNotifications } = useQuery({
    queryKey: ['userNotifications', user?.id],
    queryFn: () => api.entities.UserNotification.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id,
    initialData: [],
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const existing = userNotifications.find(un => un.notification_id === notificationId);
      if (existing) {
        return api.entities.UserNotification.update(existing.id, { is_read: true, read_at: new Date().toISOString() });
      }
      return api.entities.UserNotification.create({
        notification_id: notificationId,
        user_id: user.id,
        is_read: true,
        read_at: new Date().toISOString()
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userNotifications'] }),
  });

  const dismissMutation = useMutation({
    mutationFn: async (notificationId) => {
      const existing = userNotifications.find(un => un.notification_id === notificationId);
      if (existing) {
        return api.entities.UserNotification.update(existing.id, { is_dismissed: true });
      }
      return api.entities.UserNotification.create({
        notification_id: notificationId,
        user_id: user.id,
        is_dismissed: true
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userNotifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = visibleNotifications
        .filter(n => !userNotifications.find(un => un.notification_id === n.id && un.is_read))
        .map(n => n.id);
      
      for (const id of unreadIds) {
        const existing = userNotifications.find(un => un.notification_id === id);
        if (existing) {
          await api.entities.UserNotification.update(existing.id, { is_read: true, read_at: new Date().toISOString() });
        } else {
          await api.entities.UserNotification.create({
            notification_id: id,
            user_id: user.id,
            is_read: true,
            read_at: new Date().toISOString()
          });
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userNotifications'] }),
  });

  // Filter notifications based on user role and expiry
  const visibleNotifications = notifications.filter(n => {
    // Check expiry
    if (n.expires_at && isPast(parseISO(n.expires_at))) return false;
    
    // Check if dismissed
    const userNotif = userNotifications.find(un => un.notification_id === n.id);
    if (userNotif?.is_dismissed) return false;
    
    // Check target audience
    if (n.target_audience === 'All') return true;
    if (n.target_audience === 'Admins' && user?.role === 'admin') return true;
    if (n.target_audience === 'Members') return true;
    if (n.target_audience === 'Players') return true;
    if (n.target_audience === 'Treasurers' && (user?.club_role === 'treasurer' || user?.role === 'admin')) return true;
    
    return n.target_audience === 'All';
  });

  const unreadCount = visibleNotifications.filter(n => {
    const userNotif = userNotifications.find(un => un.notification_id === n.id);
    return !userNotif?.is_read;
  }).length;

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-11 h-11 flex items-center justify-center relative select-none active:scale-95 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {visibleNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {visibleNotifications.map(notification => {
                const Icon = typeIcons[notification.type] || Megaphone;
                const userNotif = userNotifications.find(un => un.notification_id === notification.id);
                const isRead = userNotif?.is_read;
                
                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors ${!isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${priorityColors[notification.priority]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium line-clamp-1 ${!isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => dismissMutation.mutate(notification.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(parseISO(notification.created_date), { addSuffix: true })}
                          </span>
                          {notification.priority === 'Urgent' && (
                            <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>
                          )}
                          {notification.link_url && (
                            <Link 
                              to={notification.link_url}
                              onClick={() => { markReadMutation.mutate(notification.id); setOpen(false); }}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {notification.link_text || 'View'} <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs mt-1 h-6 px-2"
                            onClick={() => markReadMutation.mutate(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}