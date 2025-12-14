import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { format, parseISO, isPast, isBefore } from 'date-fns';

const typeColors = {
  Match: 'bg-emerald-100 text-emerald-800',
  Training: 'bg-blue-100 text-blue-800',
  Social: 'bg-purple-100 text-purple-800',
  Meeting: 'bg-slate-100 text-slate-800',
  Fundraiser: 'bg-amber-100 text-amber-800',
  Awards: 'bg-yellow-100 text-yellow-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function EventDetailsModal({ 
  event, 
  open, 
  onClose, 
  user, 
  userRsvp, 
  rsvpCount,
  attendees,
  onSubmitRsvp,
  isSubmitting 
}) {
  const [rsvpStatus, setRsvpStatus] = useState(userRsvp?.status || 'Going');
  const [guests, setGuests] = useState(userRsvp?.guests || 0);
  const [notes, setNotes] = useState(userRsvp?.notes || '');
  
  if (!event) return null;
  
  const eventDate = event.date ? parseISO(event.date) : null;
  const rsvpDeadline = event.rsvp_deadline ? parseISO(event.rsvp_deadline) : null;
  const isEventPast = eventDate && isPast(eventDate);
  const isRsvpClosed = rsvpDeadline && isPast(rsvpDeadline);
  const isFull = event.max_attendees > 0 && rsvpCount >= event.max_attendees && !userRsvp;
  
  const canRsvp = user && !isEventPast && !isRsvpClosed && !isFull && event.status === 'Published';
  
  const handleSubmit = () => {
    onSubmitRsvp({
      event_id: event.id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      status: rsvpStatus,
      guests: parseInt(guests) || 0,
      notes
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={typeColors[event.event_type] || typeColors.Other}>
              {event.event_type}
            </Badge>
            {event.status === 'Cancelled' && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
            {event.is_members_only && (
              <Badge variant="outline">Members Only</Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>
        
        {event.image_url && (
          <div className="rounded-lg overflow-hidden h-48 -mx-2">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="space-y-4">
          {/* Event Details */}
          <div className="grid gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-medium">{eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'Date TBD'}</p>
                {isEventPast && <p className="text-xs text-slate-500">This event has passed</p>}
              </div>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-500" />
                <p>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-medium">{event.location}</p>
                {event.address && <p className="text-sm text-slate-500">{event.address}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-500" />
              <p>
                {rsvpCount} attending
                {event.max_attendees > 0 && ` / ${event.max_attendees} spots`}
              </p>
            </div>
          </div>
          
          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-semibold mb-2">About This Event</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
          
          {/* Notes */}
          {event.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Important Notes</p>
                  <p className="text-sm text-amber-700">{event.notes}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Attendees Preview */}
          {attendees && attendees.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Who's Going ({attendees.filter(a => a.status === 'Going').length})</h4>
              <div className="flex flex-wrap gap-2">
                {attendees.filter(a => a.status === 'Going').slice(0, 10).map((a, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white">
                    {a.user_name}
                    {a.guests > 0 && ` +${a.guests}`}
                  </Badge>
                ))}
                {attendees.filter(a => a.status === 'Going').length > 10 && (
                  <Badge variant="outline">+{attendees.filter(a => a.status === 'Going').length - 10} more</Badge>
                )}
              </div>
            </div>
          )}
          
          {/* RSVP Section */}
          {user ? (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Your RSVP</h4>
              
              {userRsvp && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">
                    You've already RSVPed as "{userRsvp.status}"
                  </span>
                </div>
              )}
              
              {canRsvp ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={rsvpStatus} onValueChange={setRsvpStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Going">Going</SelectItem>
                          <SelectItem value="Maybe">Maybe</SelectItem>
                          <SelectItem value="Not Going">Not Going</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Guests</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="5"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (dietary requirements, etc.)</Label>
                    <Textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements..."
                      className="h-20"
                    />
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-700 hover:bg-emerald-800"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {userRsvp ? 'Update RSVP' : 'Submit RSVP'}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded-lg text-center text-slate-600">
                  {isEventPast && "This event has already passed"}
                  {isRsvpClosed && !isEventPast && "RSVP deadline has passed"}
                  {isFull && !isEventPast && !isRsvpClosed && "This event is full"}
                  {event.status === 'Cancelled' && "This event has been cancelled"}
                </div>
              )}
              
              {event.rsvp_deadline && !isRsvpClosed && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  RSVP by {format(parseISO(event.rsvp_deadline), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          ) : (
            <div className="border-t pt-4">
              <div className="p-4 bg-slate-100 rounded-lg text-center">
                <p className="text-slate-600 mb-2">Please log in to RSVP to this event</p>
                <Button onClick={() => api.auth.redirectToLogin()}>Log In</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}