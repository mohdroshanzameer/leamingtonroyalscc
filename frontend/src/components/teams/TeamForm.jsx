import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, X } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { toast } from 'sonner';

export default function TeamForm({ open, onOpenChange, team, onSave, isLoading }) {
  const isEditing = !!team?.id;
  const getInitialForm = () => ({
    name: team?.name || '',
    short_name: team?.short_name || '',
    home_ground: team?.home_ground || '',
    is_home_team: team?.is_home_team || false,
    logo_url: team?.logo_url || '',
    primary_color: team?.primary_color || '#6366f1',
    secondary_color: team?.secondary_color || '#ffffff',
    contact_email: team?.contact_email || '',
    contact_phone: team?.contact_phone || '',
    notes: team?.notes || '',
    status: team?.status || 'Active',
  });
  const [form, setForm] = useState(getInitialForm());
  const [uploading, setUploading] = useState(false);

  // Reset form when team changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setForm(getInitialForm());
    }
  }, [open, team?.id]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setForm({ ...form, logo_url: file_url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team' : 'Create New Team'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label>Team Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              {form.logo_url ? (
                <div className="relative">
                  <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-xl object-cover border" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_url: '' })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: form.primary_color }}
                >
                  {form.short_name?.substring(0, 2) || form.name?.substring(0, 2) || '?'}
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </div>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Team Name *</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g., Leamington Royals"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Short Name</Label>
              <Input 
                value={form.short_name} 
                onChange={(e) => setForm({ ...form, short_name: e.target.value.toUpperCase() })} 
                placeholder="e.g., LRCC"
                maxLength={5}
              />
            </div>
          </div>

          <div>
            <Label>Home Ground</Label>
            <Input 
              value={form.home_ground} 
              onChange={(e) => setForm({ ...form, home_ground: e.target.value })} 
              placeholder="e.g., Royal Park Stadium"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="color" 
                  value={form.primary_color} 
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input 
                  value={form.primary_color} 
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="color" 
                  value={form.secondary_color} 
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input 
                  value={form.secondary_color} 
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Email</Label>
              <Input 
                type="email"
                value={form.contact_email} 
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })} 
                placeholder="team@email.com"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input 
                value={form.contact_phone} 
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} 
                placeholder="+44 123 456 7890"
              />
            </div>
          </div>

          {/* Status & Home Team */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input 
                  type="checkbox" 
                  checked={form.is_home_team} 
                  onChange={(e) => setForm({ ...form, is_home_team: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">This is our home team</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea 
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })} 
              placeholder="Additional notes about the team..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? 'Save Changes' : 'Create Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}