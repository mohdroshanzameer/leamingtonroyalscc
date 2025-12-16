import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getFinanceTheme } from '@/components/ClubConfig';

const colors = getFinanceTheme();

/**
 * Reusable Image Selector Component
 * Auto-filters images by folder and allows upload + selection
 */
export default function ImageSelector({ 
  folder, 
  currentImage, 
  onSelect, 
  label = "Image",
  aspectRatio = "square" // "square", "landscape", "portrait"
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: folderImages = [], isLoading, refetch } = useQuery({
    queryKey: ['folder-images', folder],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/files/${folder}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: showDialog,
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('http://localhost:5000/api/upload-local', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const { file_path } = await response.json();
      onSelect(file_path);
      setShowDialog(false);
      refetch();
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const filteredImages = folderImages.filter(img => 
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const aspectClass = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]'
  }[aspectRatio] || 'aspect-square';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Current Image Preview */}
      {currentImage && (
        <div className={`relative rounded-lg overflow-hidden border ${aspectClass}`} style={{ borderColor: colors.border }}>
          <img 
            src={currentImage} 
            alt="Current"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          type="button"
          variant="outline"
          onClick={() => setShowDialog(true)}
          className="flex-1"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {currentImage ? 'Change Image' : 'Select Image'}
        </Button>
      </div>

      {/* Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              Select Image from {folder}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload New */}
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id={`upload-${folder}`}
                disabled={uploading}
              />
              <label htmlFor={`upload-${folder}`} className="flex-1">
                <Button 
                  type="button"
                  disabled={uploading}
                  className="w-full"
                  style={{ background: colors.gradientProfit }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`upload-${folder}`).click();
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New
                    </>
                  )}
                </Button>
              </label>

              <Input
                placeholder="Search filenames..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Results Counter */}
            {!isLoading && folderImages.length > 0 && (
              <div className="flex items-center justify-between text-sm" style={{ color: colors.textSecondary }}>
                <span>
                  Showing {filteredImages.length} of {folderImages.length} images
                </span>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-blue-400 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Image Grid */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-12" style={{ backgroundColor: colors.surfaceHover, borderRadius: '12px' }}>
                  <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
                  <p style={{ color: colors.textMuted }}>
                    {searchTerm ? 'No images found' : 'No images uploaded yet'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelect(img.path);
                        setShowDialog(false);
                        toast.success('Image selected');
                      }}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                        currentImage === img.path ? 'border-green-500' : 'border-transparent hover:border-blue-400'
                      } ${aspectClass}`}
                      style={{ backgroundColor: colors.surfaceHover }}
                    >
                      <img 
                        src={img.path} 
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      {currentImage === img.path && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white text-xs truncate">
                        {img.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}