import React from 'react';
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function SponsorsSection() {
  const { data: dbSponsors = [] } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.entities.Sponsor.list('-created_date', 50),
    initialData: [],
  });

  // Filter active sponsors with logos from database
  const activeDbSponsors = dbSponsors.filter(s => s.status === 'Active' && s.logo_url);
  
  // Use database sponsors if available, otherwise ALWAYS show config sponsors
  const configSponsors = CLUB_CONFIG.sponsors || [];
  const sponsors = activeDbSponsors.length > 0 ? activeDbSponsors : configSponsors;
  
  console.log('[SponsorsSection] Database sponsors:', dbSponsors.length, 'Active with logos:', activeDbSponsors.length);
  console.log('[SponsorsSection] Using sponsors:', sponsors.length, sponsors);
  
  if (sponsors.length === 0) {
    console.log('[SponsorsSection] No sponsors to display');
    return null;
  }

  const duplicatedSponsors = [...sponsors, ...sponsors];

  return (
    <section className="overflow-hidden" style={{ 
      backgroundColor: colors.surface, 
      borderTop: `1px solid ${colors.border}`, 
      borderBottom: `1px solid ${colors.border}`,
      padding: 'clamp(1.5rem, 4vw, 2rem) 0'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h3 className="text-center font-semibold uppercase tracking-widest" 
            style={{ 
              color: colors.textMuted,
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}>
          Our Sponsors
        </h3>
      </div>
      
      <div className="relative">
        <div 
          className="flex animate-scroll"
          style={{
            animation: 'scroll 35s linear infinite',
            gap: 'clamp(2rem, 5vw, 5rem)',
          }}
        >
          {duplicatedSponsors.map((sponsor, idx) => {
            const logoUrl = sponsor.logo_url || sponsor.logo;
            const name = sponsor.company_name || sponsor.name;
            
            console.log(`[Sponsor ${idx}] Name: ${name}, Logo: ${logoUrl}`);
            
            return (
              <div
                key={`${sponsor.id || name}-${idx}`}
                className="flex-shrink-0 flex items-center justify-center opacity-70 hover:opacity-100 transition-all cursor-pointer"
                style={{
                  height: 'clamp(4rem, 10vw, 5rem)',
                  padding: '0 clamp(1rem, 2vw, 1.5rem)',
                  minWidth: 'clamp(120px, 20vw, 160px)',
                }}
              >
                <img 
                  src={logoUrl} 
                  alt={name}
                  style={{
                    height: 'clamp(3rem, 8vw, 4rem)',
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                  className="filter brightness-90 hover:brightness-110 transition-all"
                  onLoad={(e) => console.log(`✓ Loaded: ${logoUrl}`)}
                  onError={(e) => {
                    console.error(`✗ Failed to load: ${logoUrl}`);
                    e.target.parentElement.innerHTML = `<span style="color: ${colors.textSecondary}; font-size: 0.875rem;">${name}</span>`;
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          width: max-content;
        }
      `}</style>
    </section>
  );
}