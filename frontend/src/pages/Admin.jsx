import React, { useState, useEffect } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ImageSelector from '../components/admin/ImageSelector';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Users, Newspaper, Image as ImageIcon, MessageSquare, Crown,
  Plus, Edit, Trash2, Loader2, Save, X, Settings, BarChart3, Shield, PartyPopper, Bell,
  ChevronDown, ArrowLeft, LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { canManagePlayers, canManageNews, canViewAdmin, getRoleLabel } from '../components/RoleAccess';
import EventManager from '../components/admin/EventManager';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import NotificationManager from '../components/admin/NotificationManager';
import UserManager from '../components/admin/UserManager';
import PaymentSettingsManager from '../components/admin/PaymentSettingsManager';
import ImageManager from '../components/admin/ImageManager';
import ImageSettingsManager from '../components/admin/ImageSettingsManager';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { CLUB_CONFIG, getFinanceTheme } from '@/components/ClubConfig';

const colors = getFinanceTheme();
const ADMIN_ACCENT = '#c4b5fd'; // Purple accent for admin
const ADMIN_ACCENT_LIGHT = 'rgba(196,181,253,0.15)';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    api.auth.me()
      .then(u => { if (mounted) setUser(u); })
      .catch(() => { if (mounted) api.auth.redirectToLogin(); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);



  // Quick stats for dashboard - must be before conditional returns
  const { data: playerCount = 0 } = useQuery({
    queryKey: ['admin-player-count'],
    queryFn: async () => {
      const players = await api.entities.TeamPlayer.list('player_name', 500);
      return players.length;
    },
    enabled: !!user && canViewAdmin(user),
  });

  const { data: matchCount = 0 } = useQuery({
    queryKey: ['admin-match-count'],
    queryFn: async () => {
      const matches = await api.entities.TournamentMatch.list('-match_date', 500);
      return matches.length;
    },
    enabled: !!user && canViewAdmin(user),
  });

  const { data: newsCount = 0 } = useQuery({
    queryKey: ['admin-news-count'],
    queryFn: async () => {
      const news = await api.entities.News.list('-created_date', 200);
      return news.length;
    },
    enabled: !!user && canViewAdmin(user),
  });

  const { data: messageCount = 0 } = useQuery({
    queryKey: ['admin-message-count'],
    queryFn: async () => {
      const messages = await api.entities.ContactMessage.list('-created_date', 300);
      return messages.length;
    },
    enabled: !!user && canViewAdmin(user),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ADMIN_ACCENT }} />
      </div>
    );
  }

  if (!user || !canViewAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: colors.background }}>
        <Card className="max-w-md" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Access Denied</h2>
            <p style={{ color: colors.textMuted }}>You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canPlayers = canManagePlayers(user);
  const canNews = canManageNews(user);

  const isSuperAdmin = user?.role === 'admin' || user?.club_role === 'super_admin';

  // Menu items with permissions
  const menuItems = [
    { key: 'users', label: 'Users', icon: Shield, show: isSuperAdmin },
    { key: 'players', label: 'Players', icon: Users, show: canPlayers },
    { key: 'news', label: 'News', icon: Newspaper, show: canNews },
    { key: 'images', label: 'Image Manager', icon: ImageIcon, show: canNews },
    { key: 'backgrounds', label: 'Page Backgrounds', icon: ImageIcon, show: canNews },
    { key: 'messages', label: 'Messages', icon: MessageSquare, show: true },
    { key: 'events', label: 'Events', icon: PartyPopper, show: true },
    { key: 'notifications', label: 'Notifications', icon: Bell, show: true },
    { key: 'teams', label: 'Teams', icon: Users, show: true },
    { key: 'stats', label: 'Statistics', icon: BarChart3, show: true },
    { key: 'settings', label: 'Settings', icon: Settings, show: true },
  ].filter(item => item.show);

  const renderContent = () => {
    switch (currentView) {
      case 'users': return <UserManager />;
      case 'players': return <PlayersTab queryClient={queryClient} canEdit={canPlayers} />;
      case 'news': return <NewsTab queryClient={queryClient} canEdit={canNews} />;
      case 'images': return <ImageManager />;
      case 'backgrounds': return <ImageSettingsManager />;
      case 'messages': return <MessagesTab />;
      case 'events': return <EventManager />;
      case 'notifications': return <NotificationManager />;
      case 'teams': return <TeamsTab />;
      case 'stats': return <StatsTab queryClient={queryClient} />;
      case 'settings': return <PaymentSettingsManager />;
      default: return null;
    }
  };

  // Dashboard view
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen pt-16 lg:pt-0" style={{ backgroundColor: colors.background }}>
        {/* Full Width Header Bar */}
        <div 
          className="sticky top-16 lg:top-0 z-30 w-full"
          style={{ 
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: ADMIN_ACCENT_LIGHT }}
                >
                  <Crown className="w-5 h-5" style={{ color: ADMIN_ACCENT }} />
                </div>
                <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                  Admin Dashboard
                </h1>
              </div>

              {/* Manage Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90"
                    style={{ 
                      background: `linear-gradient(135deg, ${ADMIN_ACCENT} 0%, #a78bfa 100%)`,
                    }}
                  >
                    <ChevronDown className="w-5 h-5" style={{ color: '#1a1a2e' }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56"
                  style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
                >
                  {menuItems.map((item, index) => (
                    <React.Fragment key={item.key}>
                      <DropdownMenuItem
                        onClick={() => setCurrentView(item.key)}
                        className="cursor-pointer gap-3 py-2.5"
                        style={{ color: colors.textPrimary }}
                      >
                        <item.icon className="w-4 h-4" style={{ color: ADMIN_ACCENT }} />
                        {item.label}
                      </DropdownMenuItem>
                      {index === 3 && <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Players', value: playerCount, icon: Users, color: '#4ade80' },
              { label: 'Matches', value: matchCount, icon: BarChart3, color: '#60a5fa' },
              { label: 'News Articles', value: newsCount, icon: Newspaper, color: '#f472b6' },
              { label: 'Messages', value: messageCount, icon: MessageSquare, color: '#fbbf24' },
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="rounded-2xl p-4 sm:p-6"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{stat.value}</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Access Grid */}
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Quick Access
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: colors.surface, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: ADMIN_ACCENT_LIGHT }}
                >
                  <item.icon className="w-5 h-5" style={{ color: ADMIN_ACCENT }} />
                </div>
                <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Content view with back button
  const currentItem = menuItems.find(m => m.key === currentView);
  
  return (
    <div className="min-h-screen pt-20 lg:pt-0" style={{ backgroundColor: colors.background }}>
      {/* Header with dropdown */}
      <div 
        className="sticky top-16 lg:top-0 z-30"
        style={{ 
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
                style={{ backgroundColor: colors.surfaceHover }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: ADMIN_ACCENT_LIGHT }}
                >
                  {currentItem && <currentItem.icon className="w-5 h-5" style={{ color: ADMIN_ACCENT }} />}
                </div>
                <div>
                  <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {currentItem?.label || 'Admin'}
                  </h1>
                  <p className="text-xs" style={{ color: colors.textMuted }}>Admin Dashboard</p>
                </div>
              </div>
            </div>

            {/* Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="gap-2"
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Navigate</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <DropdownMenuItem
                  onClick={() => setCurrentView('dashboard')}
                  className="cursor-pointer gap-3 py-2.5"
                  style={{ color: colors.textPrimary }}
                >
                  <LayoutGrid className="w-4 h-4" style={{ color: ADMIN_ACCENT }} />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => setCurrentView(item.key)}
                    className="cursor-pointer gap-3 py-2.5"
                    style={{ 
                      color: colors.textPrimary,
                      backgroundColor: currentView === item.key ? ADMIN_ACCENT_LIGHT : 'transparent'
                    }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: ADMIN_ACCENT }} />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </div>
    </div>
  );
}

// Players Tab
function PlayersTab({ queryClient, canEdit }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  // Get home team for players
  const { data: teams = [] } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => api.entities.Team.list('name', 50),
  });
  const homeTeam = teams.find(t => t.is_home_team);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['teamPlayers', homeTeam?.id],
    queryFn: () => api.entities.TeamPlayer.filter({ team_id: homeTeam.id }, 'player_name', 500),
    enabled: !!homeTeam?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.TeamPlayer.create({ ...data, team_id: homeTeam?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      setIsDialogOpen(false);
      toast.success('Player created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.TeamPlayer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      setEditingPlayer(null);
      setIsDialogOpen(false);
      toast.success('Player updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.TeamPlayer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      toast.success('Player deleted successfully');
    },
  });

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle style={{ color: colors.textPrimary }}>Players ({players.length})</CardTitle>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPlayer(null)} style={{ backgroundColor: '#00d4ff', color: '#000' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Player
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
            </DialogHeader>
            <PlayerForm 
              player={editingPlayer}
              onSubmit={(data) => {
                if (editingPlayer) {
                  updateMutation.mutate({ id: editingPlayer.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}>
                    <span className="text-lg font-bold" style={{ color: '#10b981' }}>
                      {(player.player_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ color: '#f8fafc' }}>{player.player_name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{player.role}</Badge>
                      {player.is_captain && <Badge className="bg-amber-100 text-amber-800 text-xs">Captain</Badge>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingPlayer(player); setIsDialogOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: 'Delete Player',
                            message: `Are you sure you want to delete ${player.player_name}? All player stats and records will be permanently removed. This action cannot be undone.`,
                            onConfirm: () => deleteMutation.mutate(player.id),
                            confirmText: 'Delete Player',
                            variant: 'danger'
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant || 'danger'}
      />
    </Card>
  );
}

function PlayerForm({ player, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(player || {
    player_name: '', role: 'Batsman', jersey_number: '', photo_url: '',
    batting_style: '', bowling_style: '', matches_played: 0,
    runs_scored: 0, wickets_taken: 0, highest_score: 0,
    best_bowling: '', is_captain: false, is_vice_captain: false, bio: '', status: 'Active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input required value={formData.player_name} onChange={(e) => setFormData({ ...formData, player_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Role *</Label>
          <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Batsman">Batsman</SelectItem>
              <SelectItem value="Bowler">Bowler</SelectItem>
              <SelectItem value="All-Rounder">All-Rounder</SelectItem>
              <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Jersey Number</Label>
          <Input type="number" value={formData.jersey_number} onChange={(e) => setFormData({ ...formData, jersey_number: parseInt(e.target.value) || '' })} />
        </div>
        <ImageSelector
          folder="players"
          currentImage={formData.photo_url}
          onSelect={(path) => setFormData({ ...formData, photo_url: path })}
          label="Player Photo"
          aspectRatio="square"
        />
        <div className="space-y-2">
          <Label>Batting Style</Label>
          <Select value={formData.batting_style} onValueChange={(v) => setFormData({ ...formData, batting_style: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Right-handed">Right-handed</SelectItem>
              <SelectItem value="Left-handed">Left-handed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Bowling Style</Label>
          <Input value={formData.bowling_style} onChange={(e) => setFormData({ ...formData, bowling_style: e.target.value })} placeholder="e.g., Right-arm fast" />
        </div>
        <div className="space-y-2">
          <Label>Matches Played</Label>
          <Input type="number" value={formData.matches_played} onChange={(e) => setFormData({ ...formData, matches_played: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Runs Scored</Label>
          <Input type="number" value={formData.runs_scored} onChange={(e) => setFormData({ ...formData, runs_scored: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Wickets Taken</Label>
          <Input type="number" value={formData.wickets_taken} onChange={(e) => setFormData({ ...formData, wickets_taken: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Highest Score</Label>
          <Input type="number" value={formData.highest_score} onChange={(e) => setFormData({ ...formData, highest_score: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={formData.is_captain} onCheckedChange={(v) => setFormData({ ...formData, is_captain: v })} />
          <Label>Captain</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={formData.is_vice_captain} onCheckedChange={(v) => setFormData({ ...formData, is_vice_captain: v })} />
          <Label>Vice Captain</Label>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ backgroundColor: '#00d4ff', color: '#000' }}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {player ? 'Update Player' : 'Create Player'}
      </Button>
    </form>
  );
}

// News Tab
function NewsTab({ queryClient, canEdit }) {
  const [editingNews, setEditingNews] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.entities.News.list('-created_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.News.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setIsDialogOpen(false);
      toast.success('Article created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.News.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setEditingNews(null);
      setIsDialogOpen(false);
      toast.success('Article updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('Article deleted successfully');
    },
  });

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle style={{ color: colors.textPrimary }}>News Articles ({news.length})</CardTitle>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNews(null)} style={{ backgroundColor: '#00d4ff', color: '#000' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingNews ? 'Edit Article' : 'Add New Article'}</DialogTitle>
              </DialogHeader>
              <NewsForm 
                article={editingNews}
                onSubmit={(data) => {
                  if (editingNews) {
                    updateMutation.mutate({ id: editingNews.id, data });
                  } else {
                    createMutation.mutate(data);
                  }
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {news.map((article) => (
              <div key={article.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
                <div className="flex items-center gap-4">
                  <img 
                    src={article.image_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=100&q=80'} 
                    alt={article.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-semibold line-clamp-1" style={{ color: '#f8fafc' }}>{article.title}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{article.category}</Badge>
                      {article.is_featured && <Badge className="bg-amber-100 text-amber-800">Featured</Badge>}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingNews(article); setIsDialogOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setConfirmDialog({
                        open: true,
                        title: 'Delete News Article',
                        message: `Are you sure you want to delete "${article.title}"? This action cannot be undone.`,
                        onConfirm: () => deleteMutation.mutate(article.id),
                        confirmText: 'Delete Article',
                        variant: 'danger'
                      });
                    }} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant || 'danger'}
      />
    </Card>
  );
}

function NewsForm({ article, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(article || {
    title: '', content: '', excerpt: '', image_url: '',
    category: 'Club News', is_featured: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Match Report">Match Report</SelectItem>
              <SelectItem value="Club News">Club News</SelectItem>
              <SelectItem value="Player News">Player News</SelectItem>
              <SelectItem value="Announcement">Announcement</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ImageSelector
          folder="ClubNews"
          currentImage={formData.image_url}
          onSelect={(path) => setFormData({ ...formData, image_url: path })}
          label="Article Image"
          aspectRatio="landscape"
        />
      </div>
      <div className="space-y-2">
        <Label>Excerpt</Label>
        <Input value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="Short summary for preview" />
      </div>
      <div className="space-y-2">
        <Label>Content *</Label>
        <Textarea required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="min-h-[200px]" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} />
        <Label>Featured Article</Label>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full" style={{ backgroundColor: '#00d4ff', color: '#000' }}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {article ? 'Update Article' : 'Create Article'}
      </Button>
    </form>
  );
}

// Gallery Tab
function GalleryTab({ queryClient, canEdit }) {
  const [editingImage, setEditingImage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['galleryImages'],
    queryFn: () => api.entities.GalleryImage.list('-created_date', 300),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.GalleryImage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      setIsDialogOpen(false);
      toast.success('Image added successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.GalleryImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages'] });
      toast.success('Image deleted successfully');
    },
  });

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle style={{ color: colors.textPrimary }}>Gallery ({images.length})</CardTitle>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#00d4ff', color: '#000' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Image</DialogTitle>
              </DialogHeader>
              <GalleryForm 
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-square">
                <img src={image.image_url} alt={image.title} className="w-full h-full object-cover" />
                {canEdit && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="sm" onClick={() => {
                      setConfirmDialog({
                        open: true,
                        title: 'Delete Image',
                        message: `Are you sure you want to delete this image${image.title ? ` "${image.title}"` : ''}? This action cannot be undone.`,
                        onConfirm: () => deleteMutation.mutate(image.id),
                        confirmText: 'Delete Image',
                        variant: 'danger'
                      });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs">
                    {image.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant || 'danger'}
      />
    </Card>
  );
}

function GalleryForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '', image_url: '', category: 'Team Photos', description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error('Please select an image');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ImageSelector
        folder="ClubGallery"
        currentImage={formData.image_url}
        onSelect={(path) => setFormData({ ...formData, image_url: path })}
        label="Gallery Image"
        aspectRatio="landscape"
      />

      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Matches">Matches</SelectItem>
            <SelectItem value="Training">Training</SelectItem>
            <SelectItem value="Events">Events</SelectItem>
            <SelectItem value="Awards">Awards</SelectItem>
            <SelectItem value="Team Photos">Team Photos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <Button type="submit" disabled={isLoading || uploading} className="w-full" style={{ backgroundColor: '#00d4ff', color: '#000' }}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Add Image
      </Button>
    </form>
  );
}

// Messages Tab
function MessagesTab() {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contactMessages'],
    queryFn: () => api.entities.ContactMessage.list('-created_date', 300),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader>
        <CardTitle style={{ color: colors.textPrimary }}>Contact Messages ({messages.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#64748b' }}>No messages yet</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold" style={{ color: '#f8fafc' }}>{msg.name}</h4>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>{msg.email}</p>
                  </div>
                  <Badge variant="outline">{msg.subject}</Badge>
                </div>
                <p className="text-sm mt-2" style={{ color: '#cbd5e1' }}>{msg.message}</p>
                <p className="text-xs mt-2" style={{ color: '#64748b' }}>{format(new Date(msg.created_date), 'MMM d, yyyy h:mm a')}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Teams Tab - Links to Teams management page
function TeamsTab() {
  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardContent className="p-8 text-center">
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#00d4ff' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Team Management</h2>
        <p className="mb-6" style={{ color: '#64748b' }}>Manage teams, players, and squad details</p>
        <Link to={createPageUrl('Teams')}>
          <Button style={{ backgroundColor: '#00d4ff', color: '#000' }}>
            Open Team Manager
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Stats Tab
function StatsTab({ queryClient }) {
  const [formData, setFormData] = useState({
    season: '2024', matches_played: 0, matches_won: 0, matches_lost: 0,
    matches_drawn: 0, total_runs: 0, total_wickets: 0, league_position: 1, trophies_won: 0
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['clubStats'],
    queryFn: async () => {
      const data = await api.entities.ClubStats.list('-created_date', 1);
      if (data[0]) setFormData(data[0]);
      return data[0];
    },
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (stats?.id) {
        return api.entities.ClubStats.update(stats.id, data);
      }
      return api.entities.ClubStats.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubStats'] });
      toast.success('Stats updated successfully');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader>
        <CardTitle style={{ color: colors.textPrimary }}>Club Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Season</Label>
              <Input value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Matches Played</Label>
              <Input type="number" value={formData.matches_played} onChange={(e) => setFormData({ ...formData, matches_played: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Matches Won</Label>
              <Input type="number" value={formData.matches_won} onChange={(e) => setFormData({ ...formData, matches_won: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Matches Lost</Label>
              <Input type="number" value={formData.matches_lost} onChange={(e) => setFormData({ ...formData, matches_lost: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Matches Drawn</Label>
              <Input type="number" value={formData.matches_drawn} onChange={(e) => setFormData({ ...formData, matches_drawn: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Total Runs</Label>
              <Input type="number" value={formData.total_runs} onChange={(e) => setFormData({ ...formData, total_runs: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Total Wickets</Label>
              <Input type="number" value={formData.total_wickets} onChange={(e) => setFormData({ ...formData, total_wickets: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>League Position</Label>
              <Input type="number" value={formData.league_position} onChange={(e) => setFormData({ ...formData, league_position: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>Trophies Won</Label>
              <Input type="number" value={formData.trophies_won} onChange={(e) => setFormData({ ...formData, trophies_won: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending} style={{ backgroundColor: '#00d4ff', color: '#000' }}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Statistics
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}