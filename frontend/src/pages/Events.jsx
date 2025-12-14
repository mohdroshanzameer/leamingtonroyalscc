import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, CalendarDays } from 'lucide-react';
import { parseISO, isPast, isFuture, isThisMonth, isThisWeek } from 'date-fns';
import { toast } from 'sonner';
import EventCard from '../components/events/EventCard';
import EventDetailsModal from '../components/events/EventDetailsModal';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme, pages } = CLUB_CONFIG;
const { colors } = theme;

export default function Events() {
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.entities.Event.filter({ status: 'Published' }, '-date', 100),
    initialData: [],
  });

  const { data: allRsvps } = useQuery({
    queryKey: ['allRsvps'],
    queryFn: () => api.entities.EventRSVP.list('-created_date', 1000),
    initialData: [],
  });

  const rsvpMutation = useMutation({
    mutationFn: async (rsvpData) => {
      const existing = allRsvps.find(r => r.event_id === rsvpData.event_id && r.user_email === rsvpData.user_email);
      if (existing) {
        return api.entities.EventRSVP.update(existing.id, rsvpData);
      }
      return api.entities.EventRSVP.create(rsvpData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRsvps'] });
      toast.success('RSVP submitted successfully!');
    },
  });

  const rsvpCounts = useMemo(() => {
    const counts = {};
    allRsvps.forEach(rsvp => {
      if (rsvp.status === 'Going') {
        counts[rsvp.event_id] = (counts[rsvp.event_id] || 0) + 1 + (rsvp.guests || 0);
      }
    });
    return counts;
  }, [allRsvps]);

  const userRsvps = useMemo(() => {
    if (!user) return {};
    const rsvps = {};
    allRsvps.filter(r => r.user_email === user.email).forEach(r => {
      rsvps[r.event_id] = r;
    });
    return rsvps;
  }, [allRsvps, user]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!event.title.toLowerCase().includes(query) && 
            !event.location?.toLowerCase().includes(query) &&
            !event.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      if (typeFilter !== 'all' && event.event_type !== typeFilter) {
        return false;
      }
      
      const eventDate = event.date ? parseISO(event.date) : null;
      if (timeFilter === 'upcoming' && eventDate && isPast(eventDate)) return false;
      if (timeFilter === 'past' && eventDate && isFuture(eventDate)) return false;
      if (timeFilter === 'thisWeek' && eventDate && !isThisWeek(eventDate)) return false;
      if (timeFilter === 'thisMonth' && eventDate && !isThisMonth(eventDate)) return false;
      
      return true;
    }).sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date();
      const dateB = b.date ? new Date(b.date) : new Date();
      return timeFilter === 'past' ? dateB - dateA : dateA - dateB;
    });
  }, [events, searchQuery, typeFilter, timeFilter]);

  const selectedEventAttendees = useMemo(() => {
    if (!selectedEvent) return [];
    return allRsvps.filter(r => r.event_id === selectedEvent.id);
  }, [selectedEvent, allRsvps]);

  const pageConfig = pages.events || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 lg:pt-12 pb-12 sm:pb-20 lg:pb-12" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0">
          <img
            src={pageConfig.backgroundImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80"}
            alt="Events"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: colors.accent }}>
            {pageConfig.subtitle || 'Club Calendar'}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.textOnDark }}>
            {pageConfig.title || 'Events'}
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: colors.textMuted }}>
            {pageConfig.description || 'Join us for matches, training sessions, social gatherings, and more'}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section 
        className="sticky top-16 lg:top-0 z-30 backdrop-blur-md border-b"
        style={{ backgroundColor: `${colors.surface}f5`, borderColor: colors.border }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Match">Matches</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Meeting">Meetings</SelectItem>
                  <SelectItem value="Fundraiser">Fundraisers</SelectItem>
                  <SelectItem value="Awards">Awards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full">
              <TabsList className="w-full grid grid-cols-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <TabsTrigger 
                  value="upcoming" 
                  className="text-xs sm:text-sm transition-colors" 
                  style={{ 
                    backgroundColor: timeFilter === 'upcoming' ? colors.accent : 'transparent',
                    color: timeFilter === 'upcoming' ? '#000' : colors.textSecondary
                  }}
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="thisWeek" 
                  className="text-xs sm:text-sm transition-colors" 
                  style={{ 
                    backgroundColor: timeFilter === 'thisWeek' ? colors.accent : 'transparent',
                    color: timeFilter === 'thisWeek' ? '#000' : colors.textSecondary
                  }}
                >
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="thisMonth" 
                  className="text-xs sm:text-sm transition-colors" 
                  style={{ 
                    backgroundColor: timeFilter === 'thisMonth' ? colors.accent : 'transparent',
                    color: timeFilter === 'thisMonth' ? '#000' : colors.textSecondary
                  }}
                >
                  Month
                </TabsTrigger>
                <TabsTrigger 
                  value="past" 
                  className="text-xs sm:text-sm transition-colors" 
                  style={{ 
                    backgroundColor: timeFilter === 'past' ? colors.accent : 'transparent',
                    color: timeFilter === 'past' ? '#000' : colors.textSecondary
                  }}
                >
                  Past
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <CalendarDays className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colors.border }} />
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: colors.textSecondary }}>No Events Found</h3>
              <p className="text-sm sm:text-base px-4" style={{ color: colors.textMuted }}>
                {timeFilter === 'upcoming' 
                  ? "No upcoming events scheduled. Check back soon!" 
                  : "No events match your filters."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  rsvpCount={rsvpCounts[event.id] || 0}
                  userRsvp={userRsvps[event.id]}
                  onViewDetails={setSelectedEvent}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <EventDetailsModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        user={user}
        userRsvp={selectedEvent ? userRsvps[selectedEvent.id] : null}
        rsvpCount={selectedEvent ? rsvpCounts[selectedEvent.id] || 0 : 0}
        attendees={selectedEventAttendees}
        onSubmitRsvp={(data) => rsvpMutation.mutate(data)}
        isSubmitting={rsvpMutation.isPending}
      />
    </div>
  );
}