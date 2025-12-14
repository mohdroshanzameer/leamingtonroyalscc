import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronRight, ArrowRight, Newspaper, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { CLUB_CONFIG } from '@/components/ClubConfig';

const theme = CLUB_CONFIG.theme || {};
const colors = theme.colors || {};

export default function LatestNews({ news }) {
  if (!news || news.length === 0) {
    return null;
  }

  const featuredNews = news[0];
  const otherNews = news.slice(1, 4);

  const categoryColors = {
    'Match Report': { bg: colors.successLight, text: colors.success },
    'Club News': { bg: colors.primaryLight + '30', text: colors.primary },
    'Player News': { bg: colors.warningLight, text: colors.warning },
    'Announcement': { bg: colors.accentLight, text: colors.accent },
    'Event': { bg: colors.dangerLight, text: colors.danger },
  };

  const getCategoryStyle = (category) => {
    return categoryColors[category] || { bg: colors.surfaceHover, text: colors.textSecondary };
  };

  return (
    <section style={{ 
      backgroundColor: colors.surface,
      padding: 'clamp(2rem, 5vw, 4rem) 0'
    }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: 'clamp(2rem, 4vw, 2.5rem)'
        }}>
          <div>
            <p className="font-semibold uppercase tracking-wider mb-2" style={{ 
              color: colors.accent,
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}>
              Stories
            </p>
            <h2 className="font-bold" style={{ 
              color: colors.textPrimary,
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              marginBottom: '0.5rem'
            }}>
              Latest News
            </h2>
            <p style={{ 
              color: colors.textMuted,
              fontSize: 'clamp(0.875rem, 2vw, 1rem)'
            }}>
              Stay updated with club activities
            </p>
          </div>
          <Link 
            to={createPageUrl('News')}
            className="inline-flex items-center gap-2 font-medium transition-all group"
            style={{ 
              color: colors.accent,
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              alignSelf: 'flex-start'
            }}
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* News Grid - Stack on mobile, 2-col on large screens */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
        }}>
          {/* Featured Article */}
          {featuredNews && (
            <Link 
              to={`${createPageUrl('News')}?id=${featuredNews.id}`}
              className="group relative rounded-xl overflow-hidden"
              style={{
                aspectRatio: '4 / 3',
                minHeight: '240px',
              }}
            >
              <img
                src={featuredNews.image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80'}
                alt={featuredNews.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0" style={{ 
                background: `linear-gradient(0deg, ${colors.secondary}ee 0%, ${colors.secondary}60 40%, transparent 100%)` 
              }} />
              <div className="absolute bottom-0 left-0 right-0" style={{
                padding: 'clamp(1rem, 3vw, 1.5rem)'
              }}>
                <Badge 
                  className="mb-3 font-medium"
                  style={{ 
                    ...getCategoryStyle(featuredNews.category),
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                  }}
                >
                  {featuredNews.category || 'News'}
                </Badge>
                <h3 className="font-bold mb-2 line-clamp-2 transition-colors" style={{ 
                  color: colors.textOnDark,
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  lineHeight: '1.3'
                }}>
                  {featuredNews.title}
                </h3>
                <p className="line-clamp-2 mb-3" style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  display: 'none'
                }}>
                  {featuredNews.excerpt || (featuredNews.content ? featuredNews.content.substring(0, 120) : '')}
                </p>
                <div className="flex items-center gap-2" style={{ 
                  color: colors.textMuted,
                  fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                }}>
                  <Clock style={{
                    width: 'clamp(0.75rem, 2vw, 0.875rem)',
                    height: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }} />
                  {format(new Date(featuredNews.created_date), 'MMMM d, yyyy')}
                </div>
              </div>
            </Link>
          )}

          {/* Other Articles - Stack on all screens */}
          <div style={{
            display: 'grid',
            gap: 'clamp(0.75rem, 2vw, 1rem)',
          }}>
            {otherNews.map((article) => (
              <Link
                key={article.id}
                to={`${createPageUrl('News')}?id=${article.id}`}
                className="group flex gap-3 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  padding: 'clamp(0.75rem, 2vw, 1rem)'
                }}
              >
                <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{
                  width: 'clamp(4rem, 15vw, 6rem)',
                  height: 'clamp(4rem, 15vw, 6rem)',
                }}>
                  <img
                    src={article.image_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&q=80'}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <Badge 
                    className="w-fit mb-1.5 font-medium"
                    style={{
                      ...getCategoryStyle(article.category),
                      fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                    }}
                  >
                    {article.category || 'News'}
                  </Badge>
                  <h4 className="font-semibold line-clamp-2 transition-colors" style={{ 
                    color: colors.textPrimary,
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    lineHeight: '1.4'
                  }}>
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1.5" style={{ 
                    color: colors.textMuted,
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                  }}>
                    <Clock style={{
                      width: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                      height: 'clamp(0.625rem, 1.5vw, 0.75rem)'
                    }} />
                    {format(new Date(article.created_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <ArrowRight className="self-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" 
                  style={{ 
                    color: colors.accent,
                    width: 'clamp(1rem, 3vw, 1.25rem)',
                    height: 'clamp(1rem, 3vw, 1.25rem)'
                  }} 
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Show featured excerpt on tablet+ */}
        <style>{`
          @media (min-width: 768px) {
            p[style*="display: none"] {
              display: -webkit-box !important;
            }
          }
          
          @media (min-width: 1024px) {
            div[style*="gridTemplateColumns: 1fr"] {
              grid-template-columns: 3fr 2fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}