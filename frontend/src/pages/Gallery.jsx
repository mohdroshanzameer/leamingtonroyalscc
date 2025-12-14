import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { theme, pages } = CLUB_CONFIG;
const { colors } = theme;

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const pageConfig = pages.gallery || {};

  const { data: images, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.entities.GalleryImage.list('-created_date', 300),
    initialData: [],
  });

  const filteredImages = categoryFilter === 'all' 
    ? images 
    : images.filter(img => img.category === categoryFilter);

  const categories = ['all', 'Matches', 'Training', 'Events', 'Awards', 'Team Photos'];

  const currentIndex = selectedImage ? filteredImages.findIndex(img => img.id === selectedImage.id) : -1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 lg:pt-12 pb-12 sm:pb-20 lg:pb-12" style={{ backgroundColor: colors.secondary }}>
        <div className="absolute inset-0">
          <img
            src={pageConfig.backgroundImage || "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=1920&q=80"}
            alt="Gallery"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: colors.accent }}>
            {pageConfig.subtitle || 'Memories'}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.textOnDark }}>
            {pageConfig.title || 'Photo Gallery'}
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: colors.textMuted }}>
            {pageConfig.description || 'Capturing the moments that define our club'}
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section 
        className="sticky top-16 lg:top-0 z-30 backdrop-blur-md border-b"
        style={{ backgroundColor: `${colors.surface}f5`, borderColor: colors.border }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-auto">
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
            <TabsList className="p-1 rounded-lg w-full flex" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat}
                  value={cat} 
                  className="flex-1 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm capitalize whitespace-nowrap transition-colors"
                  style={{ 
                    backgroundColor: categoryFilter === cat ? colors.accent : 'transparent',
                    color: categoryFilter === cat ? '#000' : colors.textSecondary
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colors.border }} />
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: colors.textSecondary }}>No Images Found</h3>
              <p className="text-sm sm:text-base" style={{ color: colors.textMuted }}>Gallery will be updated soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {filteredImages.map((image, idx) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`group cursor-pointer relative overflow-hidden rounded-xl ${
                    idx % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <div className={`aspect-square ${idx % 5 === 0 ? 'md:aspect-square' : ''}`}>
                    <img
                      src={image.image_url}
                      alt={image.title || 'Gallery image'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(to top, ${colors.primary}cc, transparent, transparent)` }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    {image.title && (
                      <h3 className="font-semibold text-sm" style={{ color: colors.textOnPrimary }}>{image.title}</h3>
                    )}
                    {image.category && (
                      <p className="text-xs mt-1" style={{ color: `${colors.textOnPrimary}aa` }}>{image.category}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 border-none" style={{ backgroundColor: `${colors.secondary}f5` }}>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 hover:bg-white/20"
              style={{ color: colors.textOnDark }}
            >
              <X className="w-6 h-6" />
            </Button>

            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hover:bg-white/20"
                style={{ color: colors.textOnDark }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}
            {currentIndex < filteredImages.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hover:bg-white/20"
                style={{ color: colors.textOnDark }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {selectedImage && (
              <div className="flex flex-col items-center">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title || 'Gallery image'}
                  className="max-h-[80vh] w-auto object-contain"
                />
                {(selectedImage.title || selectedImage.description) && (
                  <div className="p-4 text-center">
                    {selectedImage.title && (
                      <h3 className="font-semibold text-lg" style={{ color: colors.textOnDark }}>{selectedImage.title}</h3>
                    )}
                    {selectedImage.description && (
                      <p className="mt-1" style={{ color: colors.textMuted }}>{selectedImage.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}