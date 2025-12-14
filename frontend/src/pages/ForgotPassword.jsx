import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { Mail, CheckCircle, ArrowLeft, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' | 'verify' | 'reset'
  const [pin, setPin] = useState('');
  const [verificationPin, setVerificationPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Generate 6-digit PIN
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationPin(generatedPin);

      // Send PIN via email
      const { api } = await import('../components/api/apiClient');
      await api.integrations.Core.SendEmail({
        to: email,
        subject: 'Password Reset PIN - Leamington Royals CC',
        body: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Use the PIN below to continue:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; color: #00d4ff;">${generatedPin}</h1>
          <p>This PIN will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        from_name: 'Leamington Royals CC'
      });

      setStep('verify');
    } catch (err) {
      setError('Unable to send reset email. Please try again.');
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

    setStep('reset');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
      });

      if (response.ok) {
        navigate(createPageUrl('SignIn') + '?reset=true');
      } else {
        setError('Failed to reset password. Please try again.');
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
            Enter PIN
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
              disabled={pin.length !== 6}
              className="w-full font-bold rounded-xl h-11"
              style={{
                background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`,
                color: '#000'
              }}
            >
              Verify PIN
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setStep('email')}
              className="text-sm hover:underline"
              style={{ color: colors.textSecondary }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'reset') {
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
            Reset Password
          </h1>
          <p 
            className="text-center mb-8 text-sm"
            style={{ color: colors.textSecondary }}
          >
            Enter your new password
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

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                New Password
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: colors.textMuted }}
                />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
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
        <Link 
          to={createPageUrl('SignIn')}
          className="inline-flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: colors.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

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
          Reset Password
        </h1>
        <p 
          className="text-center mb-8 text-sm"
          style={{ color: colors.textSecondary }}
        >
          Enter your email address and we'll send you a PIN to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-bold rounded-xl h-11"
            style={{
              background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`,
              color: '#000'
            }}
          >
            {loading ? 'Sending...' : 'Send Reset PIN'}
          </Button>
        </form>
      </div>
    </div>
  );
}