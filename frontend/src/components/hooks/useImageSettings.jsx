import { useQuery } from '@tanstack/react-query';
import { api } from '@/components/api/apiClient';

/**
 * Hook to fetch and access image settings for page backgrounds
 * @returns {object} { getImage, imageSettings, isLoading }
 */
export function useImageSettings() {
  const { data: imageSettings = [], isLoading } = useQuery({
    queryKey: ['imageSettings'],
    queryFn: () => api.entities.ImageSettings.list('section', 50),
    staleTime: 30 * 60 * 1000, // Cache 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  /**
   * Get image path for a section
   * @param {string} section - Section identifier (e.g., 'hero_background')
   * @param {string} fallback - Fallback path if not found
   * @returns {string} Image path
   */
  const getImage = (section, fallback = '') => {
    const setting = imageSettings.find(s => s.section === section && s.is_active);
    return setting?.image_path || fallback;
  };

  return { getImage, imageSettings, isLoading };
}