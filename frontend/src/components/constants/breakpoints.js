/**
 * Responsive Breakpoints
 * Mobile-first approach: Start with mobile styles, enhance for larger screens
 */

export const BREAKPOINTS = {
  mobile: 0,      // 0-767px
  tablet: 768,    // 768-1023px
  laptop: 1024,   // 1024-1279px
  desktop: 1280,  // 1280-1535px
  largeDesktop: 1536, // 1536px+
};

// Media query strings for use in styled components or CSS-in-JS
export const MEDIA_QUERIES = {
  tablet: `@media (min-width: ${BREAKPOINTS.tablet}px)`,
  laptop: `@media (min-width: ${BREAKPOINTS.laptop}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
  largeDesktop: `@media (min-width: ${BREAKPOINTS.largeDesktop}px)`,
};

export default BREAKPOINTS;