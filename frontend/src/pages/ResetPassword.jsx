import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get reset token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate(createPageUrl('SignIn')), 3000);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    } catch (err) {
      setError('Unable to reset password. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
          style={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`
          }}
        >
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${colors.success}20` }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: colors.success }} />
          </div>

          <h1 
            className="text-2xl font-bold mb-3"
            style={{ color: colors.textPrimary }}
          >
            Password Reset Successfully
          </h1>
          <p 
            className="text-sm mb-8"
            style={{ color: colors.textSecondary }}
          >
            Your password has been reset. Redirecting to sign in...
          </p>
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
          Set New Password
        </h1>
        <p 
          className="text-center mb-8 text-sm"
          style={{ color: colors.textSecondary }}
        >
          Please enter your new password below
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

        <form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            to={createPageUrl('SignIn')}
            className="text-sm hover:underline"
            style={{ color: colors.textSecondary }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}