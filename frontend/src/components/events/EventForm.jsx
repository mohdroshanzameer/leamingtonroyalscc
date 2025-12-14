import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';

export default function EventForm({ event, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    event_type: event?.event_type || 'Social',
    description: event?.description || '',
    date: event?.date || '',
    start_time: event?.start_time || '',
    end_time: event?.end_time || '',
    location: event?.location || '',
    address: event?.address || '',
    max_attendees: event?.max_attendees || 0,
    rsvp_deadline: event?.rsvp_deadline || '',
    is_members_only: event?.is_members_only ?? true,
    image_url: event?.image_url || '',
    status: event?.status || 'Published',
    notes: event?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      max_attendees: parseInt(formData.max_attendees) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Event Title *</Label>
          <Input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., End of Season Awards Night"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Event Type *</Label>
          <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Match">Match</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Fundraiser">Fundraiser</SelectItem>
              <SelectItem value="Awards">Awards</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>RSVP Deadline</Label>
          <Input
            type="date"
            value={formData.rsvp_deadline}
            onChange={(e) => setFormData({ ...formData, rsvp_deadline: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Location/Venue *</Label>
          <Input
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Club House"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Full Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full address for maps"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Max Attendees (0 = unlimited)</Label>
          <Input
            type="number"
            min="0"
            value={formData.max_attendees}
            onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
          />
        </div>
        
        <div className="space-y-2 flex items-center gap-3 pt-6">
          <Switch
            checked={formData.is_members_only}
            onCheckedChange={(v) => setFormData({ ...formData, is_members_only: v })}
          />
          <Label>Members Only</Label>
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label>Banner Image URL</Label>
          <Input
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Event details..."
            className="h-24"
          />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label>Important Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any important information (dress code, what to bring, etc.)"
            className="h-20"
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full bg-purple-700 hover:bg-purple-800">
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {event ? 'Update Event' : 'Create Event'}
      </Button>
    </form>
  );
}