import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Home, Calendar, Newspaper, PartyPopper, Image, Phone, 
  Users, Trophy, Radio, Crown, Wallet, Building2, LogOut,
  ChevronRight
} from 'lucide-react';
import { CLUB_CONFIG } from '../ClubConfig';
import { canViewAdmin, canViewFinance } from '../RoleAccess';

const colors = CLUB_CONFIG.theme.colors;

const publicNavItems = [
  { name: 'Home', page: 'Home', icon: Home },
  { name: 'Fixtures', page: 'Fixtures', icon: Calendar },
  { name: 'News', page: 'News', icon: Newspaper },
  { name: 'Events', page: 'Events', icon: PartyPopper },
  { name: 'Gallery', page: 'Gallery', icon: Image },
];

const getNavItems = (isAuthenticated) => {
  if (isAuthenticated) {
    return publicNavItems;
  }
  return [...publicNavItems, { name: 'Contact', page: 'Contact', icon: Phone }];
};

export default function DesktopSidebar({ user, currentPageName, onLogout }) {
  const NavLink = ({ name, page, icon: Icon, customStyle }) => {
    const isActive = currentPageName === page;
    const baseStyle = isActive 
      ? { backgroundColor: colors.accent, color: '#000' }
      : { color: colors.textSecondary, backgroundColor: 'transparent' };
    const style = customStyle || baseStyle;

    return (
      <Link
        to={createPageUrl(page)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 group ${isActive ? 'shadow-lg' : ''}`}
        style={style}
      >
        <Icon className="w-5 h-5" style={{ color: isActive ? '#000' : colors.accent }} />
        <span className="flex-1">{name}</span>
        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
      </Link>
    );
  };

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 flex flex-col z-40 border-r"
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        width: 'clamp(240px, 18vw, 280px)',
      }}
    >
      {/* Logo */}
      <div className="border-b" style={{ 
        borderColor: colors.border,
        padding: 'clamp(1rem, 3vw, 1.5rem)',
      }}>
        <Link to={createPageUrl('Home')} className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6929785c4d5b8d941b54d863/1be3324ef_Picsart_25-11-30_11-34-29-234.png" 
            alt="LRCC Logo" 
            style={{
              height: 'clamp(2rem, 3vw, 2.5rem)',
              objectFit: 'contain',
            }}
          />
          <div>
            <p className="font-bold" style={{ 
              color: colors.textPrimary,
              fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
            }}>
              {CLUB_CONFIG.name}
            </p>
            <p className="uppercase tracking-wider" style={{ 
              color: colors.textMuted,
              fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)',
            }}>
              {CLUB_CONFIG.tagline}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1" style={{
        padding: 'clamp(0.75rem, 2vw, 1rem)',
      }}>
        {/* Public Navigation */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            Menu
          </p>
          {publicNavItems.map((item) => (
            <NavLink key={item.name} {...item} />
          ))}
        </div>

        {/* Members Section */}
        {user && (
          <div className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
              Members
            </p>
            <NavLink name="Team" page="Squad" icon={Users} />
          </div>
        )}

        {/* Admin Section */}
        {user && canViewAdmin(user) && (
          <div className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
              Admin
            </p>
            <NavLink 
              name="Tournaments" 
              page="Tournaments" 
              icon={Trophy} 
              customStyle={currentPageName === 'Tournaments' 
                ? { backgroundColor: 'rgba(34,211,238,0.9)', color: '#000' }
                : { backgroundColor: 'rgba(34,211,238,0.15)', color: '#22d3ee' }
              }
            />
            <NavLink 
              name="Live Scoring" 
              page="Scoring" 
              icon={Radio} 
              customStyle={currentPageName === 'Scoring' 
                ? { backgroundColor: 'rgba(248,113,113,0.9)', color: '#000' }
                : { backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171' }
              }
            />
            <NavLink 
              name="Admin Panel" 
              page="Admin" 
              icon={Crown} 
              customStyle={currentPageName === 'Admin' 
                ? { backgroundColor: 'rgba(196,181,253,0.9)', color: '#000' }
                : { backgroundColor: 'rgba(196,181,253,0.15)', color: '#c4b5fd' }
              }
            />
          </div>
        )}

        {/* Finance Section */}
        {user && canViewFinance(user) && (
          <div className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
              Finance
            </p>
            <NavLink 
              name="Finance" 
              page="Finance" 
              icon={Wallet} 
              customStyle={currentPageName === 'Finance' 
                ? { backgroundColor: 'rgba(253,224,71,0.9)', color: '#000' }
                : { backgroundColor: 'rgba(253,224,71,0.15)', color: '#fde047' }
              }
            />
            <NavLink 
              name="Sponsorships" 
              page="Sponsorships" 
              icon={Building2} 
              customStyle={currentPageName === 'Sponsorships' 
                ? { backgroundColor: 'rgba(251,146,60,0.9)', color: '#000' }
                : { backgroundColor: 'rgba(251,146,60,0.15)', color: '#fb923c' }
              }
            />
          </div>
        )}
      </nav>

      {/* User Section */}
      {user && (
        <div className="border-t" style={{ 
          borderColor: colors.border,
          padding: 'clamp(0.75rem, 2vw, 1rem)',
        }}>
          <Link 
            to={createPageUrl('MyProfile')}
            className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 mb-2"
            style={{ backgroundColor: colors.surfaceHover }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`, color: '#000' }}
            >
              {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: colors.textPrimary }}>
                {user.full_name || 'Member'}
              </p>
              <p className="text-xs truncate" style={{ color: colors.textMuted }}>
                {user.email}
              </p>
            </div>
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}