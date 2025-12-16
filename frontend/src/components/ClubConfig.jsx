/**
 * ============================================================================
 * CLUB CONFIGURATION FILE - PREMIUM SPORTS THEME
 * ============================================================================
 */

export const CLUB_CONFIG = {
  
  // ============================================================================
  // CLUB IDENTITY
  // ============================================================================
  
  name: "Leamington Royals",
  shortName: "LRCC",
  tagline: "CRICKET CLUB",
  motto: "2 Teams, 1 Goal: Victory 🏏",
  description: "WCL Div 9 & 10, LMS League, Eagle Premier League | Warwickshire-based | United by passion, driven to win 👑🔥",
  
  // ============================================================================
  // HERO SECTION CONTENT
  // ============================================================================
  
  hero: {
    badge: "WCL Div 9 & 10 | LMS League | Eagle Premier League",
    titleLine1: "LEAMINGTON",
    titleLine2: "ROYALS CC",
    subtitle: "2 Teams, 1 Goal: Victory 🏏 | Warwickshire-based | United by passion, driven to win 👑🔥",
    backgroundImage: "/images/Heros/cricket-ball-red.jfif",
    stats: [
      { value: '2', label: 'Teams' },
      { value: '3', label: 'Leagues' },
      { value: '50+', label: 'Players' },
      { value: '👑', label: 'Royals Family' },
    ],
  },
  
  // ============================================================================
  // PAGE CONTENT
  // ============================================================================
  
  pages: {
    team: {
      subtitle: "Our Squad",
      title: "Meet The Team",
      description: "A blend of experience and young talent, united by passion for the game",
      backgroundImage: "/images/MeetTheTeam/player-bat-ball.jfif",
      accent: "#8b5cf6",        // Purple
      accentHover: "#7c3aed",
      accentLight: "#8b5cf620",
    },
    fixtures: {
      subtitle: "Season 2024",
      title: "Fixtures & Results",
      description: "Stay updated with our upcoming matches and relive our past victories",
      backgroundImage: "/images/FixturesAndResults/cricket-ball-red.jfif",
      accent: "#00ff88",        // Neon Green
      accentHover: "#00e67a",
      accentLight: "#00ff8820",
    },
    contact: {
      subtitle: "Get in Touch",
      title: "Contact Us",
      description: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
      backgroundImage: "/images/ContactUs/cricket-ball-red.jfif",
      successMessage: "Thank you for contacting us. We'll get back to you within 24 hours.",
      accent: "#f59e0b",        // Amber
      accentHover: "#d97706",
      accentLight: "#f59e0b20",
    },
    gallery: {
      subtitle: "Photo Gallery",
      title: "Club Gallery",
      description: "Relive our best moments on and off the field",
      backgroundImage: "/images/ClubGallery/cricket-ball-red.jfif",
      accent: "#ec4899",        // Pink
      accentHover: "#db2777",
      accentLight: "#ec489920",
    },
    news: {
      subtitle: "Latest Updates",
      title: "Club News",
      description: "Stay informed with the latest happenings at the club",
      backgroundImage: "/images/LatestUpdates/cricket-ball-red.jfif",
      accent: "#3b82f6",        // Blue
      accentHover: "#2563eb",
      accentLight: "#3b82f620",
    },
    events: {
      subtitle: "Club Calendar",
      title: "Events",
      description: "Join us for matches, training sessions, social gatherings, and more",
      backgroundImage: "/images/Events/events.jfif",
      accent: "#ef4444",        // Red
      accentHover: "#dc2626",
      accentLight: "#ef444420",
    },
    finance: {
      subtitle: "Financial Management",
      title: "Club Finance",
      description: "Track income, expenses, budgets and member payments",
      backgroundImage: "/images/ClubFinance/bg-1.jfif",
      // Premium Finance Theme - Bloomberg/Trading Terminal inspired
      accent: "#10b981",              // Emerald green (profit/positive)
      accentHover: "#059669",
      accentLight: "#10b98115",
      // Extended finance-specific colors
      colors: {
        // Core palette
        background: "#0a0f1a",        // Deep navy black
        surface: "#111827",           // Slate surface
        surfaceHover: "#1f2937",      // Elevated surface
        surfaceAlt: "#0d1321",        // Alternative darker surface
        border: "#1e293b",            // Subtle slate border
        borderLight: "#334155",       // Lighter border
        
        // Finance-specific accents
        profit: "#10b981",            // Green - income/profit
        profitLight: "#10b98120",
        loss: "#ef4444",              // Red - expense/loss
        lossLight: "#ef444420",
        pending: "#f59e0b",           // Amber - pending/warning
        pendingLight: "#f59e0b20",
        info: "#3b82f6",              // Blue - info/neutral
        infoLight: "#3b82f620",
        
        // Chart colors
        chart1: "#10b981",            // Emerald
        chart2: "#3b82f6",            // Blue
        chart3: "#8b5cf6",            // Purple
        chart4: "#f59e0b",            // Amber
        chart5: "#ec4899",            // Pink
        chart6: "#06b6d4",            // Cyan
        
        // Typography
        textPrimary: "#f8fafc",       // Bright white
        textSecondary: "#94a3b8",     // Slate gray
        textMuted: "#64748b",         // Muted slate
        textProfit: "#34d399",        // Light green for positive
        textLoss: "#f87171",          // Light red for negative
        
        // Gradients
        gradientProfit: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        gradientLoss: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        gradientPrimary: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        gradientCard: "linear-gradient(180deg, #111827 0%, #0a0f1a 100%)",
      },
    },
  },
  
  // ============================================================================
  // CALL TO ACTION SECTION
  // ============================================================================
  
  callToAction: {
    title: "Join Our",
    titleHighlight: "Cricketing Family",
    description: "Whether you're an experienced player or just starting your cricket journey, we welcome you. Experience quality coaching, great facilities, and a community of passionate cricketers.",
    backgroundImage: "/images/callToAction/player-wkt-bat.jfif",
    primaryButtonText: "Become a Member",
    secondaryButtonText: "Contact Us",
  },
  
  // ============================================================================
  // CONTACT INFORMATION
  // ============================================================================
  
  contact: {
    address: {
      lines: ["Leamington Royals Ground", "Warwickshire", "UK"],
    },
    phone: {
      lines: ["Contact via social media"],
    },
    email: {
      lines: ["Via Instagram DM", "@leamingtonroyals"],
    },
    hours: {
      lines: ["Match Days: As scheduled", "Training: Check social media"],
    },
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.5447!2d-0.0879!3d51.5074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDMwJzI2LjYiTiAwwrA1JzE2LjQiVw!5e0!3m2!1sen!2suk!4v1234567890",
  },
  
  // ============================================================================
  // PREMIUM SPORTS THEME - Dark Mode with Vibrant Accents
  // Inspired by: ESPN, Sky Sports, OneFootball
  // ============================================================================
  
  theme: {
    colors: {
      // Primary Brand Colors
      primary: "#0a0a0a",              // Rich black
      primaryHover: "#171717",          // Soft black
      primaryLight: "#262626",          // Elevated black

      // Secondary Colors  
      secondary: "#0a0a0a",             // Match primary for consistency
      secondaryLight: "#171717",

      // Accent - Vibrant Electric Blue (Sports feel)
      accent: "#00d4ff",                // Electric cyan/blue
      accentHover: "#00b8e6",           // Slightly darker
      accentLight: "#00d4ff20",         // Transparent version

      // Status Colors - Vibrant & Clear
      success: "#00ff88",               // Neon green
      successLight: "#00ff8815",
      warning: "#ffb800",               // Golden yellow
      warningLight: "#ffb80015",
      danger: "#ff3b5c",                // Vibrant red
      dangerLight: "#ff3b5c15",

      // Surfaces - Layered Dark UI
      background: "#000000",            // Pure black base
      surface: "#0d0d0d",               // Elevated surface
      surfaceHover: "#1a1a1a",          // Hover/active state
      border: "#262626",                // Subtle borders
      borderLight: "#333333",           // Lighter borders

      // Typography - High Contrast
      textPrimary: "#ffffff",           // Pure white
      textSecondary: "#a3a3a3",         // Neutral gray
      textMuted: "#737373",             // Muted text
      textOnPrimary: "#000000",         // Black on accent
      textOnDark: "#ffffff",            // White on dark
    },
    
    // Typography
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
    },
    
    // Border Radius - Modern rounded
    radius: {
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.25rem",
      full: "9999px",
    },
    
    // Shadows - Subtle glows
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      md: "0 4px 12px -2px rgb(0 0 0 / 0.4)",
      lg: "0 12px 24px -4px rgb(0 0 0 / 0.5)",
      xl: "0 24px 48px -8px rgb(0 0 0 / 0.6)",
      glow: "0 0 20px rgba(0, 212, 255, 0.3)",
    },
    
    // Spacing scale
    spacing: {
      page: "1rem",
      pageMd: "1.5rem",
      pageLg: "2rem",
      section: "4rem",
      sectionLg: "6rem",
    },
  },
  
  // ============================================================================
  // LOCATION
  // ============================================================================
  
  location: "Warwickshire, UK",
  
  // ============================================================================
  // SOCIAL MEDIA LINKS
  // ============================================================================

  social: {
    instagram: "https://www.instagram.com/leamingtonroyals/",
    youtube: "https://www.youtube.com/@LeamingtonRoyalsCC",
    twitter: "",
    facebook: "",
  },

  // ============================================================================
  // SPONSOR LOGOS
  // ============================================================================

  sponsors: [
    { name: 'Man Solid', logo: '/images/sponsors/mansolid.png' },
    { name: 'Salt N Vinegar', logo: '/images/sponsors/saltnvinegar.png' },
    { name: 'The Shire Grill', logo: '/images/sponsors/shiregrill.png' },
    { name: 'Spa Tyres', logo: '/images/sponsors/spatyres.png' },
    { name: 'Stitches', logo: '/images/sponsors/stitches.png' },
    { name: 'The Terrace', logo: '/images/sponsors/terrace.png' },
  ],
  
  // ============================================================================
  // FINANCIAL SETTINGS
  // ============================================================================

  finance: {
    currency: "£",
    currencyCode: "GBP",
  },
  
  // ============================================================================
  // REPORT BRANDING
  // ============================================================================
  
  reports: {
    title: "Leamington Royals Cricket Club",
    confidentialText: "Confidential Financial Report",
  },
  
  // ============================================================================
  // DEFAULT STATS
  // ============================================================================
  
  defaultStats: {
    matches_played: 45,
    matches_won: 32,
    total_runs: 12500,
    total_wickets: 380,
    trophies_won: 3,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const formatCurrency = (amount) => {
  return `${CLUB_CONFIG.finance.currency}${amount?.toLocaleString() || 0}`;
};

export const getFullClubName = () => {
  return `${CLUB_CONFIG.name} ${CLUB_CONFIG.tagline}`;
};

// Get page-specific theme (merges base theme with page overrides)
export const getPageTheme = (pageName) => {
  const baseColors = CLUB_CONFIG.theme.colors;
  const pageConfig = CLUB_CONFIG.pages[pageName];
  
  if (!pageConfig || !pageConfig.accent) {
    return baseColors;
  }
  
  // For finance page, return extended color palette
  if (pageName === 'finance' && pageConfig.colors) {
    return {
      ...baseColors,
      ...pageConfig.colors,
      accent: pageConfig.accent,
      accentHover: pageConfig.accentHover || pageConfig.accent,
      accentLight: pageConfig.accentLight || `${pageConfig.accent}20`,
    };
  }
  
  return {
    ...baseColors,
    accent: pageConfig.accent,
    accentHover: pageConfig.accentHover || pageConfig.accent,
    accentLight: pageConfig.accentLight || `${pageConfig.accent}20`,
  };
};

// Get finance-specific theme helper
export const getFinanceTheme = () => {
  const pageConfig = CLUB_CONFIG.pages.finance;
  return {
    ...CLUB_CONFIG.theme.colors,
    ...pageConfig.colors,
    accent: pageConfig.accent,
    accentHover: pageConfig.accentHover,
    accentLight: pageConfig.accentLight,
  };
};