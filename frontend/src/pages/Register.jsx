import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { AlertCircle, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { handleError } from '@/components/utils/ErrorHandler';
import { createLogger } from '@/components/utils/Logger';

const colors = CLUB_CONFIG.theme?.colors || {};
const logger = createLogger('Register');

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [pin, setPin] = useState('');
  const [verificationPin, setVerificationPin] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password.length < 8) {
      logger.warn('Password validation failed', { reason: 'too_short' });
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      logger.warn('Password validation failed', { reason: 'mismatch' });
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      logger.info('Registration attempt', { email, fullName });

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: 'user'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        logger.warn('Registration failed', { email, status: response.status, error: data.error });
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      logger.info('Registration successful', { email });
      // Success - redirect to player onboarding
      navigate(createPageUrl('PlayerOnboarding'));
    } catch (err) {
      logger.error('Registration error', err, { email, fullName });
      const errorInfo = handleError(err, {
        action: 'register',
        email,
        severity: 'high'
      });
      setError(errorInfo.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setError('');

    if (pin !== verificationPin) {
      setError('Invalid PIN. Please check your email and try again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        navigate(createPageUrl('SignIn') + '?verified=true');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
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
            Verify Your Email
          </h1>
          <p 
            className="text-center mb-8 text-sm"
            style={{ color: colors.textSecondary }}
          >
            We've sent a 6-digit PIN to {email}
          </p>

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
              <p 
                className="text-sm font-medium"
                style={{ color: colors.danger }}
              >
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-5">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Enter PIN
              </label>
              <Input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                style={{
                  backgroundColor: colors.surfaceHover,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="w-full font-bold rounded-xl h-11"
              style={{
                background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`,
                color: '#000'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setStep('register')}
              className="text-sm hover:underline"
              style={{ color: colors.textSecondary }}
            >
              ← Back to registration
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          Create Account
        </h1>
        <p 
          className="text-center mb-8 text-sm"
          style={{ color: colors.textSecondary }}
        >
          Sign up to access your account
        </p>

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
            <p 
              className="text-sm font-medium"
              style={{ color: colors.danger }}
            >
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Full Name
            </label>
            <div className="relative">
              <User 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.textMuted }}
              />
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Password
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.textMuted }}
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.textMuted }}
              />
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
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
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: colors.textMuted }}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Already have an account?{' '}
            <Link 
              to={createPageUrl('SignIn')}
              className="font-bold hover:underline"
              style={{ color: colors.accent }}
            >
              Sign in
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