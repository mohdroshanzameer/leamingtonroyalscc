import React, { useState, useMemo } from 'react';
import { api } from '@/components/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Search, Newspaper, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { CLUB_CONFIG } from '@/components/ClubConfig';

const { pages } = CLUB_CONFIG;
const colors = CLUB_CONFIG.theme.colors;

export default function News() {
  const pageConfig = pages.news || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.entities.News.list('-created_date', 100),
    initialData: [],
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const categories = useMemo(() => {
    const cats = new Set(news.map(n => n.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter(article => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!article.title?.toLowerCase().includes(query) && 
            !article.content?.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [news, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section - Responsive */}
      <section className="relative pt-28 sm:pt-36 lg:pt-12" style={{ 
        backgroundColor: colors.secondary,
        paddingBottom: 'clamp(2rem, 6vw, 3rem)',
      }}>
        <div className="absolute inset-0">
          <img
            src={pageConfig.backgroundImage || "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1920&q=80"}
            alt="News"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto text-center" style={{
          padding: '0 clamp(1rem, 3vw, 2rem)',
        }}>
          <p className="font-semibold tracking-wider uppercase mb-3" style={{ 
            color: colors.accent,
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          }}>
            {pageConfig.subtitle || 'Latest Updates'}
          </p>
          <h1 className="font-bold mb-4" style={{ 
            color: colors.textOnDark,
            fontSize: 'clamp(1.875rem, 6vw, 4rem)',
          }}>
            {pageConfig.title || 'Club News'}
          </h1>
          <p className="max-w-2xl mx-auto" style={{ 
            color: colors.textMuted,
            fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
          }}>
            {pageConfig.description || 'Stay informed with the latest happenings at the club'}
          </p>
        </div>
      </section>

      {/* Filters - Sticky and responsive */}
      <section 
        className="sticky top-16 lg:top-0 z-30 backdrop-blur-md border-b"
        style={{ backgroundColor: `${colors.surface}f5`, borderColor: colors.border }}
      >
        <div className="max-w-7xl mx-auto" style={{
          padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 2rem)',
        }}>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ 
                color: colors.textMuted,
                width: 'clamp(0.875rem, 2vw, 1rem)',
                height: 'clamp(0.875rem, 2vw, 1rem)',
              }} />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="whitespace-nowrap rounded-full"
                  style={{
                    ...(selectedCategory === cat 
                      ? { backgroundColor: colors.accent, color: '#000' }
                      : { borderColor: colors.border, color: colors.textSecondary }),
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News Grid - Responsive */}
      <section style={{
        padding: 'clamp(2rem, 5vw, 4rem) 0',
      }}>
        <div className="max-w-7xl mx-auto" style={{
          padding: '0 clamp(1rem, 3vw, 2rem)',
        }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center" style={{
              padding: 'clamp(3rem, 10vw, 5rem) 0',
            }}>
              <Newspaper className="mx-auto mb-4" style={{ 
                color: colors.border,
                width: 'clamp(3rem, 10vw, 4rem)',
                height: 'clamp(3rem, 10vw, 4rem)',
              }} />
              <h3 className="font-semibold mb-2" style={{ 
                color: colors.textSecondary,
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              }}>
                No News Found
              </h3>
              <p style={{ 
                color: colors.textMuted,
                fontSize: 'clamp(0.75rem, 2vw, 1rem)',
              }}>
                Check back soon for updates.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: 'clamp(1rem, 3vw, 1.5rem)',
            }}>
              {filteredNews.map(article => (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group cursor-pointer rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.image_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div style={{
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                  }}>
                    <div className="flex items-center gap-3 mb-3">
                      {article.category && (
                        <Badge style={{ 
                          backgroundColor: colors.accent, 
                          color: '#ffffff', 
                          border: 'none',
                          fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                        }}>
                          {article.category}
                        </Badge>
                      )}
                      <span style={{ 
                        color: colors.textMuted,
                        fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                      }}>
                        {format(new Date(article.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 
                      className="font-bold mb-2 line-clamp-2 group-hover:underline"
                      style={{ 
                        color: colors.textPrimary,
                        fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                      }}
                    >
                      {article.title}
                    </h3>
                    <p className="line-clamp-2" style={{ 
                      color: colors.textSecondary,
                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    }}>
                      {article.excerpt || article.content?.substring(0, 120)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          {selectedArticle && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 z-10 rounded-full"
                style={{ backgroundColor: colors.surfaceHover }}
              >
                <X className="w-5 h-5" />
              </Button>
              
              {selectedArticle.image_url && (
                <div className="aspect-video">
                  <img
                    src={selectedArticle.image_url}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div style={{
                padding: 'clamp(1.5rem, 5vw, 2rem)',
              }}>
                <div className="flex items-center gap-3 mb-4">
                  {selectedArticle.category && (
                    <Badge style={{ 
                      backgroundColor: colors.accent, 
                      color: '#ffffff', 
                      border: 'none',
                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    }}>
                      {selectedArticle.category}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1" style={{ 
                    color: colors.textMuted,
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  }}>
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedArticle.created_date), 'MMMM d, yyyy')}
                  </div>
                </div>
                
                <h2 className="font-bold mb-6" style={{ 
                  color: colors.textPrimary,
                  fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                }}>
                  {selectedArticle.title}
                </h2>
                
                <div className="prose prose-slate max-w-none" style={{ color: colors.textSecondary }}>
                  <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}