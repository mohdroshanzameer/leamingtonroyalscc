import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function PlayerProfileBanner({ user }) {
  const { data: players } = useQuery({
    queryKey: ['player-profile-check', user?.email],
    queryFn: () => api.entities.TeamPlayer.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!players || players.length > 0) {
    return null;
  }

  return (
    <div 
      className="py-2 px-4 text-center text-sm"
      style={{ backgroundColor: colors.accent, color: '#000' }}
    >
      <span className="font-medium">🏏 Complete your player profile to join the team!</span>
      <Link 
        to={createPageUrl('PlayerOnboarding')} 
        className="ml-2 underline font-bold hover:opacity-80"
      >
        Setup Profile →
      </Link>
    </div>
  );
}