import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '../constants/breakpoints';

/**
 * Hook for matching breakpoints in JavaScript
 * Use when you need to change component behavior (not just styles) based on screen size
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    width,
    isMobile: width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.laptop,
    isLaptop: width >= BREAKPOINTS.laptop && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
    isLargeDesktop: width >= BREAKPOINTS.largeDesktop,
  };
}

export default useBreakpoint;