import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, Eye, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getFinanceTheme } from '@/components/ClubConfig';

const colors = getFinanceTheme();

const SECTIONS = [
  { id: 'hero_background', label: 'Hero Background', folder: 'Heros' },
  { id: 'call_to_action_background', label: 'Call to Action Background', folder: 'callToAction' },
  { id: 'club_finance_background', label: 'Finance Page Background', folder: 'ClubFinance' },
  { id: 'club_news_background', label: 'News Page Background', folder: 'LatestUpdates' },
  { id: 'contact_background', label: 'Contact Page Background', folder: 'ContactUs' },
  { id: 'events_background', label: 'Events Page Background', folder: 'Events' },
  { id: 'fixtures_background', label: 'Fixtures Page Background', folder: 'FixturesAndResults' },
  { id: 'gallery_background', label: 'Gallery Page Background', folder: 'ClubGallery' },
  { id: 'team_background', label: 'Team Page Background', folder: 'MeetTheTeam' },
  { id: 'club_logo', label: 'Club Logo', folder: 'logo' },
];

export default function ImageSettingsManager() {
  const [previewImage, setPreviewImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: imageSettings = [], isLoading } = useQuery({
    queryKey: ['imageSettings'],
    queryFn: () => api.entities.ImageSettings.list('section', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.ImageSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imageSettings'] });
      toast.success('Background image saved');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.ImageSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imageSettings'] });
      toast.success('Background image updated');
    },
  });

  const getSetting = (sectionId) => {
    return imageSettings.find(s => s.section === sectionId);
  };

  const handleSave = async (sectionId, imagePath) => {
    const existing = getSetting(sectionId);
    if (existing) {
      await updateMutation.mutateAsync({ 
        id: existing.id, 
        data: { image_path: imagePath, is_active: true } 
      });
    } else {
      await createMutation.mutateAsync({ 
        section: sectionId, 
        image_path: imagePath,
        is_active: true 
      });
    }
  };

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader>
        <CardTitle style={{ color: colors.textPrimary }}>Page Background Images</CardTitle>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Select which uploaded images to use for page backgrounds. Upload new images in Image Manager first.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : (
          SECTIONS.map((section) => (
            <SectionSelector
              key={section.id}
              section={section}
              currentSetting={getSetting(section.id)}
              onSave={handleSave}
              onPreview={setPreviewImage}
              colors={colors}
            />
          ))
        )}
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SectionSelector({ section, currentSetting, onSave, onPreview, colors }) {
  const [selectedImage, setSelectedImage] = useState(currentSetting?.image_path || '');
  const [saving, setSaving] = useState(false);

  const { data: folderImages = [] } = useQuery({
    queryKey: ['folder-images', section.folder],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/files/${section.folder}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const handleSave = async () => {
    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }
    setSaving(true);
    try {
      await onSave(section.id, selectedImage);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedImage !== currentSetting?.image_path;

  return (
    <div 
      className="p-4 rounded-xl space-y-3"
      style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
    >
      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{section.label}</h3>
      
      {/* Current Image Preview */}
      {currentSetting?.image_path && (
        <div className="relative rounded-lg overflow-hidden" style={{ height: '150px' }}>
          <img 
            src={currentSetting.image_path} 
            alt={section.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff' }}>
            Current: {currentSetting.image_path}
          </div>
        </div>
      )}

      {/* Image Selector */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs mb-1 block" style={{ color: colors.textSecondary }}>
            Select Image from {section.folder}
          </Label>
          <Select 
            value={selectedImage} 
            onValueChange={setSelectedImage}
            disabled={folderImages.length === 0}
          >
            <SelectTrigger style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <SelectValue placeholder={folderImages.length === 0 ? 'No images uploaded' : 'Select an image...'} />
            </SelectTrigger>
            <SelectContent>
              {folderImages.map((img, idx) => (
                <SelectItem key={idx} value={img.path}>
                  {img.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => selectedImage && onPreview(selectedImage)}
            disabled={!selectedImage}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            style={{ 
              background: hasChanges ? colors.gradientProfit : colors.surfaceHover,
              color: hasChanges ? '#000' : colors.textMuted
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {folderImages.length === 0 && (
        <p className="text-xs" style={{ color: colors.textMuted }}>
          No images found. Upload images to /{section.folder}/ folder first.
        </p>
      )}
    </div>
  );
}