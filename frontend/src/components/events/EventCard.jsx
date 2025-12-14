import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { CLUB_CONFIG } from '../ClubConfig';

const { theme } = CLUB_CONFIG;
const { colors } = theme;

const typeColors = {
  Match: 'bg-emerald-100 text-emerald-800',
  Training: 'bg-blue-100 text-blue-800',
  Social: 'bg-purple-100 text-purple-800',
  Meeting: 'bg-slate-100 text-slate-800',
  Fundraiser: 'bg-amber-100 text-amber-800',
  Awards: 'bg-yellow-100 text-yellow-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function EventCard({ event, rsvpCount, userRsvp, onViewDetails }) {
  const eventDate = event.date ? parseISO(event.date) : null;
  const isEventPast = eventDate && isPast(eventDate);
  
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${isEventPast ? 'opacity-70' : ''}`}>
      {event.image_url && (
        <div className="h-40 overflow-hidden">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge className={typeColors[event.event_type] || typeColors.Other}>
            {event.event_type}
          </Badge>
          {event.status === 'Cancelled' && (
            <Badge variant="destructive">Cancelled</Badge>
          )}
          {userRsvp && (
            <Badge variant="outline" className={
              userRsvp.status === 'Going' ? 'border-emerald-500 text-emerald-700' :
              userRsvp.status === 'Maybe' ? 'border-amber-500 text-amber-700' :
              'border-red-500 text-red-700'
            }>
              {userRsvp.status}
            </Badge>
          )}
        </div>
        
        <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{event.title}</h3>
        
        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'TBD'}</span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {rsvpCount > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{rsvpCount} attending</span>
              {event.max_attendees > 0 && <span className="text-slate-400">/ {event.max_attendees} max</span>}
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{event.description}</p>
        )}
        
        <Button 
          onClick={() => onViewDetails(event)} 
          className="w-full text-white"
          style={{ backgroundColor: colors.accent }}
          disabled={event.status === 'Cancelled'}
        >
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}