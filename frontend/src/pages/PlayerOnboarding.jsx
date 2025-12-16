import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { User, Phone, Calendar, Trophy, CheckCircle } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { createLogger } from '@/components/utils/Logger';
import { handleError } from '@/components/utils/ErrorHandler';

const colors = CLUB_CONFIG.theme?.colors || {};
const logger = createLogger('PlayerOnboarding');

export default function PlayerOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    player_name: '',
    phone: '',
    date_of_birth: '',
    role: 'Batsman',
    batting_style: 'Right-handed',
    bowling_style: '',
    jersey_number: '',
    bio: ''
  });

  useEffect(() => {
    api.auth.me()
      .then(u => {
        setUser(u);
        // Pre-fill player name with user's full name and immediately set form state
        setFormData(prev => ({ 
          ...prev, 
          player_name: u.full_name || '',
          // This ensures the field is considered "filled" for validation
        }));
      })
      .catch(() => {
        navigate(createPageUrl('SignIn'));
      });
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.player_name || !formData.phone) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      logger.info('Creating player profile', { email: user.email });

      // Get or create default team
      let teams = await api.entities.Team.filter({ query: { is_home_team: true } });
      let homeTeam;
      
      if (!teams || teams.length === 0) {
        // Create default team if none exists
        homeTeam = await api.entities.Team.create({
          name: 'Leamington Royals Cricket Club',
          short_name: 'LRCC',
          is_home_team: true,
          status: 'Active'
        });
      } else {
        homeTeam = teams[0];
      }

      // Create player profile with team assignment
      await api.entities.TeamPlayer.create({
        email: user.email,
        team_id: homeTeam.id,
        team_name: homeTeam.name,
        player_name: formData.player_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth || null,
        role: formData.role,
        batting_style: formData.batting_style,
        bowling_style: formData.bowling_style || null,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        bio: formData.bio || null,
        status: 'Active'
      });

      logger.info('Player profile created successfully');
      
      // Redirect to profile
      navigate(createPageUrl('MyProfile'));
    } catch (err) {
      logger.error('Failed to create player profile', err);
      const errorInfo = handleError(err, {
        action: 'create_player_profile',
        email: user?.email
      });
      setError(errorInfo.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    logger.info('User skipped player onboarding');
    navigate(createPageUrl('Home'));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: colors.background }}>
      <div 
        className="w-full max-w-2xl rounded-2xl p-8 shadow-2xl"
        style={{ 
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`
              }}
            >
              <Trophy className="w-8 h-8" style={{ color: '#000' }} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Welcome to {CLUB_CONFIG.shortName}!
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Complete your player profile to join the team
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: step >= num ? colors.accent : colors.surfaceHover,
                  color: step >= num ? '#000' : colors.textMuted
                }}
              >
                {step > num ? <CheckCircle className="w-5 h-5" /> : num}
              </div>
              {num < 3 && (
                <div 
                  className="h-1 w-12 rounded transition-all"
                  style={{ backgroundColor: step > num ? colors.accent : colors.border }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div 
            className="mb-6 p-4 rounded-lg"
            style={{ 
              backgroundColor: colors.dangerLight,
              border: `1px solid ${colors.danger}`
            }}
          >
            <p className="text-sm" style={{ color: colors.danger }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                Basic Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textMuted }} />
                  <Input
                    value={formData.player_name}
                    onChange={(e) => handleInputChange('player_name', e.target.value)}
                    placeholder="John Smith"
                    required
                    className="pl-10"
                    style={{
                      backgroundColor: colors.surfaceHover,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textMuted }} />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+44 7700 900000"
                    required
                    className="pl-10"
                    style={{
                      backgroundColor: colors.surfaceHover,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textMuted }} />
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="pl-10"
                    style={{
                      backgroundColor: colors.surfaceHover,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Playing Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                Playing Information
              </h2>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Primary Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.surfaceHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary
                  }}
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Batting Style
                </label>
                <select
                  value={formData.batting_style}
                  onChange={(e) => handleInputChange('batting_style', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.surfaceHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary
                  }}
                >
                  <option value="Right-handed">Right-handed</option>
                  <option value="Left-handed">Left-handed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Bowling Style (Optional)
                </label>
                <Input
                  value={formData.bowling_style}
                  onChange={(e) => handleInputChange('bowling_style', e.target.value)}
                  placeholder="e.g., Right-arm Fast, Left-arm Spin"
                  style={{
                    backgroundColor: colors.surfaceHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Preferred Jersey Number (Optional)
                </label>
                <Input
                  type="number"
                  value={formData.jersey_number}
                  onChange={(e) => handleInputChange('jersey_number', e.target.value)}
                  placeholder="7"
                  min="1"
                  max="99"
                  style={{
                    backgroundColor: colors.surfaceHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Bio */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                Tell Us About Yourself
              </h2>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Bio (Optional)
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about your cricket journey, achievements, favorite players..."
                  rows={6}
                  style={{
                    backgroundColor: colors.surfaceHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary
                  }}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 font-bold"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`,
                  color: '#000'
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 font-bold"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`,
                  color: '#000'
                }}
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            )}
          </div>

          {/* Skip Link */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm hover:underline"
              style={{ color: colors.textMuted }}
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}