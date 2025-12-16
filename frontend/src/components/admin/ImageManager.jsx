import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, Trash2, Image as ImageIcon, Loader2, FolderOpen, 
  X, Check, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getFinanceTheme } from '@/components/ClubConfig';

const colors = getFinanceTheme();

const IMAGE_FOLDERS = [
  { value: 'sponsors', label: 'Sponsors' },
  { value: 'players', label: 'Players' },
  { value: 'callToAction', label: 'Call To Action' },
  { value: 'ClubFinance', label: 'Club Finance' },
  { value: 'ClubGallery', label: 'Club Gallery' },
  { value: 'ClubNews', label: 'Club News' },
  { value: 'ContactUs', label: 'Contact Us' },
  { value: 'Events', label: 'Events' },
  { value: 'FixturesAndResults', label: 'Fixtures And Results' },
  { value: 'Heros', label: 'Heros' },
  { value: 'LatestUpdates', label: 'Latest Updates' },
  { value: 'logo', label: 'Logo' },
  { value: 'MeetTheTeam', label: 'Meet The Team' },
];

export default function ImageManager() {
  const [selectedFolder, setSelectedFolder] = useState('sponsors');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['image-files', selectedFolder],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/files/${selectedFolder}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    enabled: !!selectedFolder,
  });

  const { data: unusedFiles = [] } = useQuery({
    queryKey: ['unused-files', selectedFolder],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/files/unused/${selectedFolder}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch unused files');
      return response.json();
    },
    enabled: !!selectedFolder,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ folder, filename }) => {
      const response = await fetch(`http://localhost:5000/api/files/${folder}/${filename}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-files', selectedFolder] });
      queryClient.invalidateQueries({ queryKey: ['unused-files', selectedFolder] });
      toast.success('Image deleted');
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async ({ folder, files }) => {
      const response = await fetch(`http://localhost:5000/api/files/cleanup/${folder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ files })
      });
      if (!response.ok) throw new Error('Cleanup failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['image-files', selectedFolder] });
      queryClient.invalidateQueries({ queryKey: ['unused-files', selectedFolder] });
      setShowCleanupDialog(false);
      toast.success(`Deleted ${data.total} unused image(s)`);
    },
  });

  const handleFileSelect = (e) => {
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

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folder', selectedFolder);

      const response = await fetch('http://localhost:5000/api/upload-local', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      queryClient.invalidateQueries({ queryKey: ['image-files', selectedFolder] });
      setShowUploadDialog(false);
      setUploadFile(null);
      setPreviewUrl('');
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isFileUsed = (filePath) => {
    return !unusedFiles.find(f => f.path === filePath);
  };

  const handleCleanup = () => {
    const filenames = unusedFiles.map(f => f.name);
    cleanupMutation.mutate({ folder: selectedFolder, files: filenames });
  };

  return (
    <Card style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle style={{ color: colors.textPrimary }}>Image Manager</CardTitle>
        <div className="flex gap-2">
          {unusedFiles.length > 0 && (
            <Button 
              onClick={() => setShowCleanupDialog(true)}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Cleanup ({unusedFiles.length})
            </Button>
          )}
          <Button 
            onClick={() => setShowUploadDialog(true)}
            style={{ background: colors.gradientProfit }}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Folder Selector */}
        <div className="space-y-2">
          <Label style={{ color: colors.textSecondary }}>Select Folder</Label>
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_FOLDERS.map(folder => (
                <SelectItem key={folder.value} value={folder.value}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    {folder.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12" style={{ backgroundColor: colors.surfaceHover, borderRadius: '12px' }}>
            <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
            <p style={{ color: colors.textMuted }}>No images in this folder</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div 
                key={idx} 
                className="relative group rounded-lg overflow-hidden"
                style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
              >
                <img 
                  src={file.path} 
                  alt={file.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-2">
                  <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{file.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: colors.textMuted }}>{formatFileSize(file.size)}</p>
                    {isFileUsed(file.path) ? (
                      <Badge className="text-xs" style={{ backgroundColor: colors.successLight, color: colors.success }}>Used</Badge>
                    ) : (
                      <Badge className="text-xs" style={{ backgroundColor: colors.dangerLight, color: colors.danger }}>Unused</Badge>
                    )}
                  </div>
                </div>
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Delete this image?')) {
                        deleteMutation.mutate({ folder: selectedFolder, filename: file.name });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(file.path);
                      toast.success('Path copied to clipboard');
                    }}
                  >
                    Copy Path
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              Upload Image to {IMAGE_FOLDERS.find(f => f.value === selectedFolder)?.label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{ borderColor: colors.border }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-xs" style={{ color: colors.textMuted }}>Click to change</p>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} />
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Click to select image</p>
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Max 5MB</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setShowUploadDialog(false); setUploadFile(null); setPreviewUrl(''); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                style={{ background: colors.gradientProfit }}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>
              Cleanup Unused Images
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: colors.dangerLight, border: `1px solid ${colors.danger}` }}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: colors.danger }} />
                <div>
                  <p className="font-semibold" style={{ color: colors.danger }}>Warning</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>This will permanently delete {unusedFiles.length} unused image(s) from {selectedFolder}. This cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {unusedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: colors.surfaceHover }}>
                  <span className="text-sm truncate" style={{ color: colors.textSecondary }}>{file.name}</span>
                  <span className="text-xs" style={{ color: colors.textMuted }}>{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCleanupDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCleanup}
                disabled={cleanupMutation.isPending}
                className="flex-1"
              >
                {cleanupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}