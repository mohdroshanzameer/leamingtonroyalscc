import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowRight, UserPlus, Loader2 } from 'lucide-react';
import { CLUB_CONFIG, formatCurrency } from '@/components/ClubConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from '@/components/api/apiClient';
import { toast } from 'sonner';
import PaymentModal from '../payments/PaymentModal';
import { useQuery } from '@tanstack/react-query';

const REGISTRATION_FEE = 50;

export default function CallToAction() {
  const navigate = useNavigate();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [membershipId, setMembershipId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Batsman',
    batting_style: 'Right-handed',
    bowling_style: '',
    bio: ''
  });

  // Check authentication
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  // Check if user has player profile
  const { data: playerProfile } = useQuery({
    queryKey: ['playerProfile', user?.email],
    queryFn: () => api.entities.TeamPlayer.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
    select: (data) => data?.[0],
  });

  // Auto-populate form when user is logged in
  React.useEffect(() => {
    if (user && showRegistration) {
      setFormData(prev => ({
        ...prev,
        name: user.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user, showRegistration]);

  // Only hide if user is logged in AND already has a player profile
  if (user && playerProfile) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const membership = await api.entities.Membership.create({
      member_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      membership_type: 'Adult',
      status: 'Pending',
      fee_amount: REGISTRATION_FEE,
      payment_status: 'Unpaid',
      notes: `Role: ${formData.role}, Batting: ${formData.batting_style}, Bowling: ${formData.bowling_style || 'N/A'}`
    });
    
    setMembershipId(membership.id);
    setIsSubmitting(false);
    setShowRegistration(false);
    setShowPayment(true);
  };

  const handlePaymentComplete = (result) => {
    setShowPayment(false);
    if (result.status === 'pending') {
      toast.success('Registration submitted! Complete the bank transfer and we will verify your payment.');
    } else {
      toast.success('Registration and payment complete!');
    }
    setFormData({ name: '', email: '', phone: '', role: 'Batsman', batting_style: 'Right-handed', bowling_style: '', bio: '' });
    setMembershipId(null);
  };

  const { theme } = CLUB_CONFIG;
  const { colors } = theme;

  return (
    <section style={{ 
      backgroundColor: colors.surfaceHover,
      padding: 'clamp(1.5rem, 4vw, 2rem) 0'
    }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        {/* Mobile: stack, Tablet+: horizontal */}
        <div className="flex flex-col items-stretch gap-4 rounded-xl" style={{ 
          backgroundColor: colors.accent,
          padding: 'clamp(1.25rem, 4vw, 1.5rem)',
        }}>
          <p className="font-semibold text-center" style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            color: '#000',
          }}>
            Interested in joining {CLUB_CONFIG.name}?
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowRegistration(true)}
              className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#000',
                color: colors.accent,
                padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.25rem)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              }}
            >
              <UserPlus style={{ width: '1rem', height: '1rem' }} /> Register as Player
            </button>
            <Link 
              to={createPageUrl('Contact')}
              className="inline-flex items-center justify-center gap-2 border-2 font-medium rounded-lg transition-colors"
              style={{
                borderColor: '#000',
                color: '#000',
                padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.25rem)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              }}
            >
              Contact <ArrowRight style={{ width: '1rem', height: '1rem' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Tablet+: horizontal layout */}
      <style>{`
        @media (min-width: 768px) {
          div[class*="flex-col items-stretch"] {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          div[class*="flex-col items-stretch"] > p {
            text-align: left !important;
          }
          div[class*="flex-col gap-3"] {
            flex-direction: row !important;
            align-items: center;
          }
        }
      `}</style>

      {/* Registration Modal */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Player Registration</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input 
                  required
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Playing Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                    <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batting Style</Label>
                <Select value={formData.batting_style} onValueChange={(v) => setFormData({ ...formData, batting_style: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right-handed">Right-handed</SelectItem>
                    <SelectItem value="Left-handed">Left-handed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bowling Style</Label>
              <Input 
                value={formData.bowling_style} 
                onChange={(e) => setFormData({ ...formData, bowling_style: e.target.value })} 
                placeholder="e.g., Right-arm fast, Off-spin"
              />
            </div>

            <div className="space-y-2">
              <Label>About You</Label>
              <Textarea 
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                placeholder="Tell us about your cricket experience..."
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Registration Fee</span>
                <span className="text-2xl font-bold text-amber-600">{formatCurrency(REGISTRATION_FEE)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRegistration(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue to Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        amount={REGISTRATION_FEE}
        paymentType="registration"
        payerName={formData.name}
        payerEmail={formData.email}
        payerPhone={formData.phone}
        relatedEntityType="Membership"
        relatedEntityId={membershipId}
        onPaymentComplete={handlePaymentComplete}
      />
    </section>
  );
}