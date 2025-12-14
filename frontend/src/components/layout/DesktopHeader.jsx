import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { UserCircle, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CLUB_CONFIG } from '../ClubConfig';
import NotificationBell from '../notifications/NotificationBell';

const colors = CLUB_CONFIG.theme.colors;

export default function DesktopHeader({ user, userLoaded, onLogin, currentPageName }) {
  // Get page title based on current page
  const getPageTitle = () => {
    const pageTitles = {
      Home: 'Welcome Back',
      Fixtures: 'Fixtures & Results',
      News: 'Latest News',
      Events: 'Club Events',
      Gallery: 'Photo Gallery',
      Contact: 'Contact Us',
      Squad: 'Our Squad',
      Tournaments: 'Tournament Hub',
      Scoring: 'Live Scoring',
      Admin: 'Admin Dashboard',
      Finance: 'Club Finance',
      Sponsorships: 'Sponsorships',
      MyProfile: 'My Profile',
    };
    return pageTitles[currentPageName] || currentPageName || 'Dashboard';
  };

  return (
    <header 
      className="flex items-center justify-between border-b"
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        height: 'clamp(3.5rem, 8vh, 4rem)',
        padding: '0 clamp(1rem, 3vw, 1.5rem)',
      }}
    >
      {/* Page Title */}
      <div>
        <h1 className="font-bold" style={{ 
          color: colors.textPrimary,
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {userLoaded && user ? (
          <>
            <NotificationBell user={user} />
            <Link 
              to={createPageUrl('MyProfile')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-white/5"
              style={{ backgroundColor: colors.surfaceHover }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`, color: '#000' }}
              >
                {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {user.full_name?.split(' ')[0] || 'Profile'}
              </span>
            </Link>
          </>
        ) : userLoaded ? (
          <Button
            onClick={onLogin}
            className="font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`, color: '#000' }}
          >
            Login
          </Button>
        ) : null}
      </div>
    </header>
  );
}