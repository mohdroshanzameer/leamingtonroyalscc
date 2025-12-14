import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { handleError } from '@/components/utils/ErrorHandler';
import { createLogger } from '@/components/utils/Logger';

const colors = CLUB_CONFIG.theme?.colors || {};
const logger = createLogger('SignIn');

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now sign in.');
    } else if (params.get('reset') === 'true') {
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
    } else if (params.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! You can now sign in.');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      logger.info('Login attempt', { email });

      // Call your backend login endpoint
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        logger.info('Login successful', { email });
        
        api.auth.setToken(data.access_token);
        
        // Check if user has player profile
        try {
          const players = await api.entities.TeamPlayer.filter({ query: { email } });
          if (!players || players.length === 0) {
            logger.info('No player profile found, redirecting to onboarding');
            window.location.href = createPageUrl('PlayerOnboarding');
            return;
          } else {
            logger.info('Player profile exists, redirecting to Home');
            window.location.href = createPageUrl('Home');
            return;
          }
        } catch (err) {
          logger.warn('Failed to check player profile, redirecting to Home', err);
          window.location.href = createPageUrl('Home');
          return;
        }
      } else {
        logger.warn('Login failed', { email, status: response.status });
        setError(data.error || 'Invalid email or password. Please check your credentials and try again.');
      }
    } catch (err) {
      logger.error('Login error', err, { email });
      const errorInfo = handleError(err, {
        action: 'login',
        email,
        severity: 'high'
      });
      setError(errorInfo.userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ 
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`
        }}
      >
        <div className="flex justify-center mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6929785c4d5b8d941b54d863/1be3324ef_Picsart_25-11-30_11-34-29-234.png"
            alt="LRCC Logo"
            className="h-16 object-contain"
          />
        </div>

        <h1 
          className="text-2xl font-bold text-center mb-2"
          style={{ color: colors.textPrimary }}
        >
          Welcome Back
        </h1>
        <p 
          className="text-center mb-8 text-sm"
          style={{ color: colors.textSecondary }}
        >
          Sign in to your account to continue
        </p>

        {successMessage && (
          <div 
            className="mb-6 p-4 rounded-lg flex items-start gap-3"
            style={{ 
              backgroundColor: `${colors.success}15`,
              border: `1px solid ${colors.success}40`
            }}
          >
            <CheckCircle 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              style={{ color: colors.success }}
            />
            <p 
              className="text-sm font-medium"
              style={{ color: colors.success }}
            >
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div 
            className="mb-6 p-4 rounded-lg flex items-start gap-3"
            style={{ 
              backgroundColor: `${colors.danger}15`,
              border: `1px solid ${colors.danger}40`
            }}
          >
            <AlertCircle 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              style={{ color: colors.danger }}
            />
            <div className="flex-1">
              <p 
                className="text-sm font-medium"
                style={{ color: colors.danger }}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.textMuted }}
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
            <div className="flex items-center justify-between mb-2">
              <label 
                className="block text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Password
              </label>
              <Link 
                to={createPageUrl('ForgotPassword')}
                className="text-xs font-medium hover:underline"
                style={{ color: colors.accent }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.textMuted }}
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pl-10 pr-10"
                style={{
                  backgroundColor: colors.surfaceHover,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: colors.textMuted }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-bold rounded-xl h-11"
            style={{
              background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`,
              color: '#000'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Don't have an account?{' '}
            <Link 
              to={createPageUrl('Register')}
              className="font-bold hover:underline"
              style={{ color: colors.accent }}
            >
              Create account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link 
            to={createPageUrl('Home')}
            className="text-xs hover:underline"
            style={{ color: colors.textMuted }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}