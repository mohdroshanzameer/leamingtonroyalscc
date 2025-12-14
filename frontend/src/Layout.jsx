import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './components/utils';
import { Menu, Crown, Users, Calendar, Newspaper, Image, Phone, Home, Wallet, PartyPopper, UserCircle, Radio, Trophy, LogOut, ChevronRight, X, Building2, Receipt } from 'lucide-react';
import { api } from '@/components/api/apiClient';
import { canViewAdmin, canViewFinance } from './components/RoleAccess';
import { CLUB_CONFIG } from './components/ClubConfig';
import NotificationBell from './components/notifications/NotificationBell';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthLogger } from './components/logging/AuditLogger';
import { useIsDesktop } from './components/hooks/useMediaQuery';
import DesktopSidebar from './components/layout/DesktopSidebar';
import DesktopHeader from './components/layout/DesktopHeader';
import PlayerProfileBanner from './components/layout/PlayerProfileBanner';
// SecurityHeaders temporarily disabled - was blocking auth redirects
// import SecurityHeaders from './components/security/SecurityHeaders';

const SocialIcon = ({ platform, color }) => {
  const icons = {
    instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
  };
  return <svg className="w-4 h-4" style={{ color }} fill="currentColor" viewBox="0 0 24 24"><path d={icons[platform]} /></svg>;
};

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
  // Add Contact only for non-authenticated users
  return [...publicNavItems, { name: 'Contact', page: 'Contact', icon: Phone }];
};

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const loginLogged = useRef(false);
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();

  // Fetch user on mount
  useEffect(() => {
    let mounted = true;
    
    // Check if token exists before making API call
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.log('[Layout] No token found, user not authenticated');
      setUser(null);
      setUserLoaded(true);
      return;
    }
    
    console.log('[Layout] Token found, fetching current user...');
    
    api.auth.me()
      .then(u => {
        if (mounted) {
          console.log('[Layout] User loaded:', u?.email);
          setUser(u);
          setUserLoaded(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.log('[Layout] Failed to load user:', err?.message);
          // Clear invalid token
          localStorage.removeItem('access_token');
          setUser(null);
          setUserLoaded(true);
        }
      });
    return () => { mounted = false; };
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [currentPageName]);

  const { theme } = CLUB_CONFIG;
  const { colors } = theme;

  const handleLogin = () => {
    navigate('/signin');
  };
  
  const handleLogout = async () => {
    setMenuOpen(false);
    // Log logout before redirecting
    if (user) {
      await AuthLogger.logLogout(user);
    }
    api.auth.logout(window.location.origin);
  };

  const NavLink = ({ name, page, icon: Icon, customStyle, compact }) => {
                    const isActive = currentPageName === page;
                    const baseStyle = isActive 
                      ? { backgroundColor: colors.accent, color: '#000' }
                      : { color: colors.textSecondary, backgroundColor: 'transparent' };
                    const style = customStyle || baseStyle;

                    const handleClick = () => {
                      console.log(`🔗 NavLink clicked: ${name} -> ${createPageUrl(page)}`);
                      setMenuOpen(false);
                    };

                    return (
                      <Link
                        to={createPageUrl(page)}
                        onClick={handleClick}
                        className={`flex items-center justify-between px-3 ${compact ? 'py-2' : 'py-3'} rounded-lg text-sm font-medium touch-manipulation transition-all hover:bg-white/5`}
                        style={style}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: isActive ? '#000' : colors.accent }} />
                          {name}
                        </span>
                        <ChevronRight className="w-3 h-3 opacity-40" />
                      </Link>
                    );
                  };

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <style>{`
          * { touch-action: manipulation; }
          :root {
            --color-primary: ${colors.primary};
            --color-primary-hover: ${colors.primaryHover};
            --color-primary-light: ${colors.primaryLight};
            --color-secondary: ${colors.secondary};
            --color-secondary-light: ${colors.secondaryLight};
            --color-accent: ${colors.accent};
            --color-accent-hover: ${colors.accentHover};
            --color-accent-light: ${colors.accentLight};
            --color-success: ${colors.success};
            --color-success-light: ${colors.successLight};
            --color-warning: ${colors.warning};
            --color-warning-light: ${colors.warningLight};
            --color-danger: ${colors.danger};
            --color-danger-light: ${colors.dangerLight};
            --color-background: ${colors.background};
            --color-surface: ${colors.surface};
            --color-surface-hover: ${colors.surfaceHover};
            --color-border: ${colors.border};
            --color-border-light: ${colors.borderLight};
            --color-text-primary: ${colors.textPrimary};
            --color-text-secondary: ${colors.textSecondary};
            --color-text-muted: ${colors.textMuted};
            --color-text-on-primary: ${colors.textOnPrimary};
            --color-text-on-dark: ${colors.textOnDark};
          }
        `}</style>

        {/* Desktop Sidebar */}
        <DesktopSidebar 
          user={user} 
          currentPageName={currentPageName} 
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen" style={{
          marginLeft: 'clamp(240px, 18vw, 280px)',
        }}>
          {/* Desktop Header */}
          <DesktopHeader 
            user={user} 
            userLoaded={userLoaded} 
            onLogin={handleLogin}
            currentPageName={currentPageName}
          />



          {/* Main Content */}
          <main className="flex-1">
            <ErrorBoundary fallbackMessage="This page encountered an error. Please try refreshing.">
              {children}
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <footer className="py-6" style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.border}` }}>
            <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: colors.textMuted }}>
              <div className="flex items-center gap-2">
                <img 
                  src="/images/logo/logo.png" 
                  alt="LRCC Logo" 
                  className="h-6 object-contain"
                />
                <span>© {new Date().getFullYear()} {CLUB_CONFIG.name}. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                {publicNavItems.slice(0, 4).map(item => (
                  <Link key={item.page} to={createPageUrl(item.page)} className="hover:text-white transition-colors">{item.name}</Link>
                ))}
              </div>
              <div className="flex gap-2">
                {Object.entries(CLUB_CONFIG.social).filter(([_, url]) => url).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" 
                     className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
                     style={{ backgroundColor: colors.surfaceHover }}>
                    <SocialIcon platform={platform} color={colors.textSecondary} />
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Mobile Layout (existing)
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* <SecurityHeaders /> */}
      <style>{`
        * { touch-action: manipulation; }
        :root {
          --color-primary: ${colors.primary};
          --color-primary-hover: ${colors.primaryHover};
          --color-primary-light: ${colors.primaryLight};
          --color-secondary: ${colors.secondary};
          --color-secondary-light: ${colors.secondaryLight};
          --color-accent: ${colors.accent};
          --color-accent-hover: ${colors.accentHover};
          --color-accent-light: ${colors.accentLight};
          --color-success: ${colors.success};
          --color-success-light: ${colors.successLight};
          --color-warning: ${colors.warning};
          --color-warning-light: ${colors.warningLight};
          --color-danger: ${colors.danger};
          --color-danger-light: ${colors.dangerLight};
          --color-background: ${colors.background};
          --color-surface: ${colors.surface};
          --color-surface-hover: ${colors.surfaceHover};
          --color-border: ${colors.border};
          --color-border-light: ${colors.borderLight};
          --color-text-primary: ${colors.textPrimary};
          --color-text-secondary: ${colors.textSecondary};
          --color-text-muted: ${colors.textMuted};
          --color-text-on-primary: ${colors.textOnPrimary};
          --color-text-on-dark: ${colors.textOnDark};
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between relative">
            {/* Menu Button */}
            <button
              type="button"
              aria-label="Open menu"
              className="w-10 h-10 flex items-center justify-center rounded-xl select-none active:scale-95 relative z-10 transition-all hover:bg-white/10"
              style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="w-5 h-5" style={{ color: colors.textPrimary }} />
            </button>

            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              <img 
                src="/images/logo/logo.png" 
                alt="LRCC Logo" 
                className="h-10 object-contain"
              />
            </Link>

            {/* Right - Login/Profile */}
            <div className="flex items-center gap-2">
              {userLoaded && user ? (
                <>
                  <div className="w-10 h-10 flex items-center justify-center" style={{ color: colors.textPrimary }}>
                    <NotificationBell user={user} />
                  </div>
                  <Link 
                    to={createPageUrl('MyProfile')} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl select-none active:scale-95 transition-all hover:bg-white/10"
                    style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}
                    onPointerDown={(e) => e.currentTarget.click()}
                  >
                    <UserCircle className="w-5 h-5" style={{ color: colors.accent }} />
                  </Link>
                </>
              ) : userLoaded ? (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="px-4 py-2 text-sm font-bold rounded-xl cursor-pointer touch-manipulation transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, #0088ff 100%)`, color: '#000', WebkitTapHighlightColor: 'transparent' }}
                >
                  Login
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div 
          id="mobile-menu"
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onTouchStart={(e) => { e.preventDefault(); setMenuOpen(false); }}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Panel */}
          <nav 
                          className="absolute top-0 left-0 h-full w-64 max-w-[75vw] flex flex-col shadow-2xl"
            style={{ backgroundColor: colors.surface }}
          >
            {/* Menu Header */}
            <div 
              className="flex items-center justify-between p-4 border-b shrink-0"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <div className="flex items-center gap-2">
                <img 
                  src="/images/logo/logo.png" 
                  alt="LRCC Logo" 
                  className="h-8 object-contain"
                />
              </div>
              <button
                type="button"
                aria-label="Close menu"
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                style={{ backgroundColor: colors.surfaceHover, color: colors.textSecondary }}
                onTouchStart={(e) => { e.preventDefault(); setMenuOpen(false); }}
                onClick={() => setMenuOpen(false)}
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {getNavItems(!!user).map((item) => (
                <NavLink key={item.name} {...item} compact />
              ))}

              {user && (
                  <NavLink name="Team" page="Squad" icon={Users} compact />
                )}



                {user && canViewAdmin(user) && (
                  <>
                    <div className="pt-2 pb-0.5">
                      <span className="px-3 text-[9px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                        Admin
                      </span>
                    </div>
                    <NavLink 
                          name="Tournaments" 
                          page="Tournaments" 
                          icon={Trophy} 
                          customStyle={{ backgroundColor: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}
                          compact
                        />
                    <NavLink 
                      name="Live Scoring" 
                      page="Scoring" 
                      icon={Radio} 
                      customStyle={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171' }}
                      compact
                    />
                    <NavLink 
                      name="Admin" 
                      page="Admin" 
                      icon={Crown} 
                      customStyle={{ backgroundColor: 'rgba(196,181,253,0.15)', color: '#c4b5fd' }}
                      compact
                    />
                  </>
                )}

                {user && canViewFinance(user) && (
                  <>
                    <NavLink 
                      name="Finance" 
                      page="Finance" 
                      icon={Wallet} 
                      customStyle={{ backgroundColor: 'rgba(253,224,71,0.15)', color: '#fde047' }}
                      compact
                    />
                    <Link
                      to="/sponsorships"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium touch-manipulation transition-all hover:bg-white/5"
                      style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: '#fb923c' }}
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: '#fb923c' }} />
                        Sponsorships
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-40" />
                    </Link>
                  </>
                )}
            </div>

            {/* Sign Out */}
            {user && (
              <div className="p-3 border-t shrink-0" style={{ borderColor: colors.border }}>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium cursor-pointer touch-manipulation"
                  style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171', WebkitTapHighlightColor: 'transparent' }}
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 pointer-events-none" />
                  Sign Out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}



      {/* Main Content */}
      <main>
        <ErrorBoundary fallbackMessage="This page encountered an error. Please try refreshing.">
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="py-6" style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: colors.textMuted }}>
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6929785c4d5b8d941b54d863/1be3324ef_Picsart_25-11-30_11-34-29-234.png" 
              alt="LRCC Logo" 
              className="h-6 object-contain"
            />
            <span>© {new Date().getFullYear()} {CLUB_CONFIG.name}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            {publicNavItems.slice(0, 4).map(item => (
              <Link key={item.page} to={createPageUrl(item.page)} className="hover:text-white transition-colors">{item.name}</Link>
            ))}
          </div>
          <div className="flex gap-2">
            {Object.entries(CLUB_CONFIG.social).filter(([_, url]) => url).map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" 
                 className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
                 style={{ backgroundColor: colors.surfaceHover }}>
                <SocialIcon platform={platform} color={colors.textSecondary} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}