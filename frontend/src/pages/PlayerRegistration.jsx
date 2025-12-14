import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme, pages } = CLUB_CONFIG;
const { colors } = theme;

export default function PlayerRegistration() {
  const [formData, setFormData] = useState({
    player_name: '',
    email: '',
    phone: '',
    role: '',
    batting_style: '',
    bowling_style: '',
    bio: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch logged-in user details to pre-fill form
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me().catch(() => null),
  });

  // Get home team to assign new players
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.entities.Team.filter({ is_home_team: true }),
  });

  // Pre-fill form with user data when loaded
  React.useEffect(() => {
    if (user && !formData.email) {
      setFormData(prev => ({
        ...prev,
        player_name: user.full_name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const homeTeam = teams[0];

  const mutation = useMutation({
    mutationFn: async (data) => {
      let photo_url = '';
      
      if (photoFile) {
        setUploading(true);
        const result = await api.integrations.Core.UploadFile({ file: photoFile });
        photo_url = result.file_url;
        setUploading(false);
      }

      return api.entities.TeamPlayer.create({
        ...data,
        photo_url,
        team_id: homeTeam?.id || '',
        status: 'Active',
        date_joined: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Registration submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit registration. Please try again.');
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.player_name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-20" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0">
          <img
            src={pages.contact?.backgroundImage || "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1920&q=80"}
            alt="Registration"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: colors.accent }}>
            Join the Team
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.textOnDark }}>
            Player Registration
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: colors.textMuted }}>
            Register to join {CLUB_CONFIG.name} and be part of our cricketing family
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-8 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <CardContent className="p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${colors.success}15` }}
                  >
                    <CheckCircle className="w-10 h-10" style={{ color: colors.success }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Registration Submitted!</h3>
                  <p className="mb-6" style={{ color: colors.textSecondary }}>
                   Thank you for registering. Our team will review your application and get back to you soon.
                  </p>
                  <Button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        player_name: '',
                        email: '',
                        phone: '',
                        role: '',
                        batting_style: '',
                        bowling_style: '',
                        bio: '',
                      });
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}
                  >
                    Register Another Player
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center mb-6">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center mb-3 overflow-hidden"
                      style={{ backgroundColor: colors.background, border: `2px dashed ${colors.border}` }}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10" style={{ color: colors.textMuted }} />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <span 
                        className="text-sm flex items-center gap-1 hover:underline"
                        style={{ color: colors.accent }}
                      >
                        <Upload className="w-4 h-4" />
                        Upload Photo (Optional)
                      </span>
                    </label>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="player_name" style={{ color: colors.textPrimary }}>Full Name *</Label>
                    <Input
                      id="player_name"
                      required
                      value={formData.player_name}
                      onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                      placeholder="John Smith"
                      className="h-12"
                      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" style={{ color: colors.textPrimary }}>Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="h-12"
                        style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" style={{ color: colors.textPrimary }}>Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+44 123 456 7890"
                        className="h-12"
                        style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role" style={{ color: colors.textPrimary }}>Playing Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      required
                    >
                      <SelectTrigger className="h-12" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <SelectItem value="Batsman">Batsman</SelectItem>
                        <SelectItem value="Bowler">Bowler</SelectItem>
                        <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                        <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Batting & Bowling Style */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batting_style" style={{ color: colors.textPrimary }}>Batting Style</Label>
                      <Select
                        value={formData.batting_style}
                        onValueChange={(value) => setFormData({ ...formData, batting_style: value })}
                      >
                        <SelectTrigger className="h-12" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}>
                          <SelectValue placeholder="Select batting style" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                          <SelectItem value="Right-handed">Right-handed</SelectItem>
                          <SelectItem value="Left-handed">Left-handed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bowling_style" style={{ color: colors.textPrimary }}>Bowling Style</Label>
                      <Input
                        id="bowling_style"
                        value={formData.bowling_style}
                        onChange={(e) => setFormData({ ...formData, bowling_style: e.target.value })}
                        placeholder="e.g., Right-arm Medium"
                        className="h-12"
                        style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" style={{ color: colors.textPrimary }}>About You (Optional)</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about your cricket experience..."
                      className="min-h-[100px] resize-none"
                      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={mutation.isPending || uploading}
                    className="w-full h-12 text-lg font-semibold"
                    style={{ backgroundColor: colors.accent, color: '#1a1a2e' }}
                  >
                    {mutation.isPending || uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {uploading ? 'Uploading Photo...' : 'Submitting...'}
                      </>
                    ) : (
                      'Submit Registration'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}