import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ExternalLink, Tv, Palette, Save, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function StreamOverlayDialog({ open, onClose, matchId }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const queryClient = useQueryClient();
  
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [sponsorUrl, setSponsorUrl] = useState('');
  const [selectedLayout, setSelectedLayout] = useState('full');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newOverlayName, setNewOverlayName] = useState('');
  const [selectedCustomOverlay, setSelectedCustomOverlay] = useState(null);
  
  // Fetch saved custom overlays
  const { data: customOverlays = [] } = useQuery({
    queryKey: ['customOverlays'],
    queryFn: async () => {
      const user = await api.auth.me();
      return api.entities.CustomStreamOverlay.filter({ created_by: user.email });
    },
    enabled: open,
  });
  
  // Save custom overlay mutation
  const saveOverlayMutation = useMutation({
    mutationFn: (data) => api.entities.CustomStreamOverlay.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customOverlays']);
      toast.success('Overlay layout saved!');
      setShowSaveDialog(false);
      setNewOverlayName('');
    },
  });
  
  // Delete overlay mutation
  const deleteOverlayMutation = useMutation({
    mutationFn: (id) => api.entities.CustomStreamOverlay.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customOverlays']);
      toast.success('Overlay deleted!');
    },
  });
  
  // Set default overlay mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      // Unset all defaults first
      const user = await api.auth.me();
      const allOverlays = await api.entities.CustomStreamOverlay.filter({ created_by: user.email });
      for (const overlay of allOverlays) {
        if (overlay.is_default) {
          await api.entities.CustomStreamOverlay.update(overlay.id, { is_default: false });
        }
      }
      // Set new default
      await api.entities.CustomStreamOverlay.update(id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customOverlays']);
      toast.success('Default overlay set!');
    },
  });
  
  const themes = [
    { value: 'default', label: 'Default (Green)' },
    { value: 'blue', label: 'Blue' },
    { value: 'red', label: 'Red' },
    { value: 'gold', label: 'Gold' },
    { value: 'purple', label: 'Purple' },
  ];
  
  const layoutTypes = [
    { value: 'full', label: 'Full Scoreboard', description: 'Complete scoreboard for bottom of screen' },
    { value: 'minimal', label: 'Minimal', description: 'Compact score for corner placement' },
    { value: 'ticker', label: 'Ticker', description: 'Horizontal bar for top/bottom' },
  ];
  
  const applyCustomOverlay = (overlay) => {
    setSelectedCustomOverlay(overlay);
    setSelectedTheme(overlay.theme);
    setSponsorUrl(overlay.sponsor_url || '');
    setSelectedLayout(overlay.layout_type);
  };
  
  const saveCurrentAsCustom = async () => {
    if (!newOverlayName.trim()) {
      toast.error('Please enter a name for the overlay');
      return;
    }
    
    const user = await api.auth.me();
    saveOverlayMutation.mutate({
      name: newOverlayName,
      layout_type: selectedLayout,
      theme: selectedTheme,
      sponsor_url: sponsorUrl,
      created_by: user.email,
    });
  };
  
  const buildUrl = (layout = selectedLayout) => {
    let url = `${baseUrl}/LiveOverlay?match=${matchId}&layout=${layout}&theme=${selectedTheme}`;
    if (sponsorUrl) url += `&sponsor=${encodeURIComponent(sponsorUrl)}`;
    return url;
  };

  const copyUrl = async (layout) => {
    try {
      await navigator.clipboard.writeText(buildUrl(layout));
      toast.success('URL copied to clipboard!');
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = buildUrl(layout);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('URL copied to clipboard!');
    }
  };

  const previewOverlay = (layout) => {
    window.open(buildUrl(layout), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            Live Stream Overlays
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Create custom overlay layouts or use presets. Add URLs as browser sources in OBS/Streamlabs.
          </p>
          
          {/* Saved Custom Overlays */}
          {customOverlays.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-300 text-sm font-medium">Saved Overlays</span>
              </div>
              <div className="space-y-2">
                {customOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className={`bg-slate-900 rounded p-3 border ${
                      selectedCustomOverlay?.id === overlay.id
                        ? 'border-emerald-500'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => applyCustomOverlay(overlay)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className="text-amber-400 font-medium text-sm">{overlay.name}</span>
                        {overlay.is_default && (
                          <Badge className="bg-emerald-600 text-xs">Default</Badge>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDefaultMutation.mutate(overlay.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-yellow-400"
                        >
                          <Star className={`w-4 h-4 ${overlay.is_default ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteOverlayMutation.mutate(overlay.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      {layoutTypes.find(l => l.value === overlay.layout_type)?.label} • {themes.find(t => t.value === overlay.theme)?.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Current Configuration */}
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Palette className="w-4 h-4" />
                <span>Current Configuration</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="border-slate-600 hover:bg-slate-700 text-slate-300 h-7"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-400 text-xs">Layout</Label>
                <Select value={selectedLayout} onValueChange={setSelectedLayout}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {layoutTypes.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-400 text-xs">Theme</Label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {themes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-400 text-xs">Sponsor URL</Label>
                <Input
                  value={sponsorUrl}
                  onChange={(e) => setSponsorUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="bg-emerald-900/20 border border-emerald-600/50 rounded-lg p-3">
              <Label className="text-slate-400 text-xs mb-2 block">Overlay Name</Label>
              <div className="flex gap-2">
                <Input
                  value={newOverlayName}
                  onChange={(e) => setNewOverlayName(e.target.value)}
                  placeholder="e.g., Match Day Layout"
                  className="bg-slate-900 border-slate-700 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && saveCurrentAsCustom()}
                />
                <Button
                  size="sm"
                  onClick={saveCurrentAsCustom}
                  disabled={saveOverlayMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Current URL */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-semibold text-sm">Current Overlay URL</span>
            </div>
            <p className="text-slate-500 text-xs mb-3">
              {layoutTypes.find(l => l.value === selectedLayout)?.description}
            </p>
            
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={buildUrl()}
                className="bg-slate-900 border-slate-700 text-xs text-slate-400"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyUrl(selectedLayout)}
                className="border-slate-600 hover:bg-slate-700 text-slate-300"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-900/30 rounded-lg p-4 text-sm">
            <p className="text-blue-300 font-medium mb-2">OBS Setup:</p>
            <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
              <li>Add Browser Source in OBS</li>
              <li>Paste the overlay URL</li>
              <li>Set dimensions: 1920 x 1080</li>
              <li>Enable "Shutdown source when not visible"</li>
            </ol>
          </div>

          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => previewOverlay(selectedLayout)}
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Preview Current Overlay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}