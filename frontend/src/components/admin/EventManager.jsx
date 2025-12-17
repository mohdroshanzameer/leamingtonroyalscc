import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Search, Calendar, Users, Trash2, Edit2, Loader2, 
  Eye, Download, CheckCircle, XCircle, HelpCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/confirm-dialog';
import EventForm from '../events/EventForm';

const statusColors = {
  Draft: 'bg-slate-100 text-slate-700',
  Published: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
  Completed: 'bg-blue-100 text-blue-800',
};

const typeColors = {
  Match: 'bg-emerald-100 text-emerald-800',
  Training: 'bg-blue-100 text-blue-800',
  Social: 'bg-purple-100 text-purple-800',
  Meeting: 'bg-slate-100 text-slate-800',
  Fundraiser: 'bg-amber-100 text-amber-800',
  Awards: 'bg-yellow-100 text-yellow-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function EventManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingRsvps, setViewingRsvps] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => api.entities.Event.list('-date', 200),
    initialData: [],
  });

  const { data: allRsvps } = useQuery({
    queryKey: ['adminRsvps'],
    queryFn: () => api.entities.EventRSVP.list('-created_date', 1000),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      setIsDialogOpen(false);
      toast.success('Event created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      setEditingEvent(null);
      setIsDialogOpen(false);
      toast.success('Event updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      toast.success('Event deleted');
    },
  });

  // RSVP counts per event
  const rsvpStats = useMemo(() => {
    const stats = {};
    events.forEach(e => {
      const eventRsvps = allRsvps.filter(r => r.event_id === e.id);
      stats[e.id] = {
        going: eventRsvps.filter(r => r.status === 'Going').length,
        maybe: eventRsvps.filter(r => r.status === 'Maybe').length,
        notGoing: eventRsvps.filter(r => r.status === 'Not Going').length,
        totalGuests: eventRsvps.reduce((sum, r) => sum + (r.guests || 0), 0),
      };
    });
    return stats;
  }, [events, allRsvps]);

  // Filter events
  const filteredEvents = events.filter(e => {
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  // Export RSVPs for an event
  const exportRsvps = (event) => {
    const eventRsvps = allRsvps.filter(r => r.event_id === event.id);
    const csvContent = [
      'Name,Email,Status,Guests,Notes',
      ...eventRsvps.map(r => `"${r.user_name}","${r.user_email}","${r.status}",${r.guests || 0},"${r.notes || ''}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvps_${event.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('RSVPs exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Event Management</h2>
          <p className="text-slate-500">Create and manage club events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEvent(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-700 hover:bg-purple-800">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            </DialogHeader>
            <EventForm
              event={editingEvent}
              onSubmit={(data) => {
                if (editingEvent) {
                  updateMutation.mutate({ id: editingEvent.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-800">{events.length}</p>
            <p className="text-sm text-slate-500">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700">{events.filter(e => e.status === 'Published').length}</p>
            <p className="text-sm text-slate-500">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{events.filter(e => e.status === 'Draft').length}</p>
            <p className="text-sm text-slate-500">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{allRsvps.filter(r => r.status === 'Going').length}</p>
            <p className="text-sm text-slate-500">Total RSVPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Event</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">RSVPs</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => {
                    const stats = rsvpStats[event.id] || { going: 0, maybe: 0, notGoing: 0, totalGuests: 0 };
                    return (
                      <tr key={event.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-slate-500">{event.location}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {event.date ? format(parseISO(event.date), 'MMM d, yyyy') : 'TBD'}
                          {event.start_time && <span className="text-slate-400 ml-1">{event.start_time}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={typeColors[event.event_type]}>{event.event_type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[event.status]}>{event.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="w-4 h-4" /> {stats.going}
                            </span>
                            <span className="flex items-center gap-1 text-amber-600">
                              <HelpCircle className="w-4 h-4" /> {stats.maybe}
                            </span>
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" /> {stats.notGoing}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingRsvps(event)}
                              title="View RSVPs"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => exportRsvps(event)}
                              title="Export RSVPs"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingEvent(event); setIsDialogOpen(true); }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                const stats = rsvpStats[event.id] || { going: 0, maybe: 0, notGoing: 0 };
                                const totalRsvps = stats.going + stats.maybe + stats.notGoing;
                                setConfirmDialog({
                                  open: true,
                                  title: 'Delete Event',
                                  message: `Are you sure you want to delete "${event.title}"?${totalRsvps > 0 ? ` This will also remove ${totalRsvps} RSVP record(s).` : ''} This action cannot be undone.`,
                                  onConfirm: () => deleteMutation.mutate(event.id),
                                  confirmText: 'Delete Event',
                                  variant: 'danger'
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSVP Viewer Dialog */}
      <Dialog open={!!viewingRsvps} onOpenChange={() => setViewingRsvps(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RSVPs: {viewingRsvps?.title}</DialogTitle>
          </DialogHeader>
          {viewingRsvps && (
            <div className="space-y-4">
              {['Going', 'Maybe', 'Not Going'].map(status => {
                const rsvps = allRsvps.filter(r => r.event_id === viewingRsvps.id && r.status === status);
                return (
                  <div key={status}>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      {status === 'Going' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      {status === 'Maybe' && <HelpCircle className="w-4 h-4 text-amber-600" />}
                      {status === 'Not Going' && <XCircle className="w-4 h-4 text-red-600" />}
                      {status} ({rsvps.length})
                    </h4>
                    {rsvps.length > 0 ? (
                      <div className="space-y-2">
                        {rsvps.map(r => (
                          <div key={r.id} className="p-2 bg-slate-50 rounded flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{r.user_name}</p>
                              <p className="text-xs text-slate-500">{r.user_email}</p>
                              {r.notes && <p className="text-xs text-slate-400 mt-1">{r.notes}</p>}
                            </div>
                            {r.guests > 0 && (
                              <Badge variant="outline">+{r.guests} guests</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No responses</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

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