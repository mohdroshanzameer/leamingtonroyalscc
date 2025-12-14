import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { pages, contact } = CLUB_CONFIG;
const colors = CLUB_CONFIG.theme.colors;

export default function Contact() {
  const pageConfig = pages.contact;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => api.entities.ContactMessage.create(data),
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Message sent successfully!');
    },
    onError: () => {
      toast.error('Failed to send message. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const contactInfo = [
    { icon: MapPin, title: 'Address', lines: contact.address.lines },
    { icon: Phone, title: 'Phone', lines: contact.phone.lines },
    { icon: Mail, title: 'Email', lines: contact.email.lines },
    { icon: Clock, title: 'Office Hours', lines: contact.hours.lines },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 lg:pt-12 pb-12 sm:pb-20 lg:pb-12" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0">
          <img
            src={pageConfig.backgroundImage}
            alt="Contact"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: colors.accent }}>
            {pageConfig.subtitle}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.textOnDark }}>
            {pageConfig.title}
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: colors.textMuted }}>
            {pageConfig.description}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: colors.textPrimary }}>
                Contact Information
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex gap-3 sm:gap-4">
                    <div 
                      className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: colors.accent }}
                    >
                      <info.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base" style={{ color: colors.textPrimary }}>{info.title}</h3>
                      {info.lines.map((line, lineIdx) => (
                        <p key={lineIdx} className="text-xs sm:text-sm truncate" style={{ color: colors.textSecondary }}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div 
                className="mt-6 sm:mt-8 rounded-2xl overflow-hidden border h-48 sm:h-64"
                style={{ borderColor: colors.border, backgroundColor: colors.surfaceHover }}
              >
                <iframe
                  src={contact.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Club Location"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <Card className="shadow-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                <CardContent className="p-4 sm:p-8">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${colors.success}15` }}
                      >
                        <CheckCircle className="w-10 h-10" style={{ color: colors.success }} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Message Sent!</h3>
                      <p className="mb-6" style={{ color: colors.textSecondary }}>
                        {pageConfig.successMessage}
                      </p>
                      <Button 
                        onClick={() => setSubmitted(false)}
                        style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" style={{ color: colors.textPrimary }}>Full Name *</Label>
                            <Input
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="John Smith"
                              className="h-11 sm:h-12"
                              style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" style={{ color: colors.textPrimary }}>Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="john@example.com"
                              className="h-11 sm:h-12"
                              style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="phone" style={{ color: colors.textPrimary }}>Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+44 123 456 7890"
                              className="h-11 sm:h-12"
                              style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subject" style={{ color: colors.textPrimary }}>Subject *</Label>
                            <Select
                              value={formData.subject}
                              onValueChange={(value) => setFormData({ ...formData, subject: value })}
                              required
                            >
                              <SelectTrigger className="h-11 sm:h-12" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}>
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                              <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                                <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                                <SelectItem value="Membership">Membership</SelectItem>
                                <SelectItem value="Sponsorship">Sponsorship</SelectItem>
                                <SelectItem value="Venue Hire">Venue Hire</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" style={{ color: colors.textPrimary }}>Message *</Label>
                          <Textarea
                            id="message"
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="How can we help you?"
                            className="min-h-[150px] resize-none"
                            style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={mutation.isPending}
                          className="w-full h-12 text-lg text-white"
                          style={{ backgroundColor: colors.accent }}
                        >
                          {mutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}