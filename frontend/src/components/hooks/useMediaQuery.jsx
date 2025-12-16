import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../constants/breakpoints';

/**
 * Custom hook to detect screen size
 * @param {string} query - Media query string (e.g., '(min-width: 1024px)')
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (event) => setMatches(event.matches);
    
    // Add listener
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Convenience hook to check if screen is desktop (1024px+)
 */
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.laptop}px)`);
}

/**
 * Convenience hook to check if screen is tablet or larger (768px+)
 */
export function useIsTablet() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
}

/**
 * Convenience hook to check if screen is large desktop (1536px+)
 */
export function useIsLargeDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.largeDesktop}px)`);
}

export default useMediaQuery;