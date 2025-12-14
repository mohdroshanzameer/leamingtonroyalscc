import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const colors = CLUB_CONFIG.theme?.colors || {};

const slides = [
  {
    image: "/images/Heros/cricket-ball-red.jfif",
    title: "2025 FIXTURES",
    subtitle: "NOW AVAILABLE",
    cta: { text: "VIEW FIXTURES", page: "Fixtures" },
    accent: "#00d4ff"
  },
  {
    image: "/images/MeetTheTeam/player-bat-ball.jfif",
    title: "JOIN THE ROYALS",
    subtitle: "FAMILY",
    cta: { text: "GET IN TOUCH", page: "Contact" },
    accent: "#00ff88"
  },
  {
    image: "/images/LatestUpdates/cricket-ball-red.jfif",
    title: "LATEST NEWS",
    subtitle: "& UPDATES",
    cta: { text: "READ MORE", page: "News" },
    accent: "#ffb800"
  },
  {
    image: "/images/ClubGallery/cricket-ball-red.jfif",
    title: "CLUB GALLERY",
    subtitle: "VIEW PHOTOS",
    cta: { text: "VIEW GALLERY", page: "Gallery" },
    accent: "#ff3b5c"
  }
];

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  const currentAccent = slides[currentSlide].accent;

  return (
    <section className="hero-section">
      <style>{`
        /* Mobile-first Hero Section */
        .hero-section {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          background: ${colors.background};
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          transition: opacity 1s ease, transform 1s ease;
        }

        .hero-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
        }

        /* Mobile base: fluid content */
        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          color: white;
          padding: 1rem;
          width: 100%;
          max-width: 90%;
        }

        .hero-badge {
          display: inline-block;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 9999px;
          padding: 0.375rem 1rem;
          font-size: clamp(0.625rem, 2vw, 0.75rem);
          margin-bottom: 1rem;
          transition: all 0.5s ease;
        }

        .hero-title {
          font-size: clamp(2rem, 8vw, 6rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }

        .hero-subtitle {
          font-size: clamp(1.25rem, 6vw, 5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          transition: color 0.5s ease;
        }

        /* Mobile: navigation at bottom */
        .nav-button {
          position: absolute;
          bottom: 6rem;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 20;
        }

        .nav-button:active {
          transform: scale(0.95);
        }

        .nav-button-left {
          left: 1rem;
        }

        .nav-button-right {
          right: 1rem;
        }

        .slide-indicators {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 20;
        }

        .slide-indicator {
          width: 2rem;
          height: 0.25rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .slide-indicator.active {
          background: currentColor;
          width: 3rem;
        }

        /* Tablet: 768px+ */
        @media (min-width: 768px) {
          .hero-content {
            padding: 1.5rem;
            max-width: 80%;
          }

          .hero-badge {
            padding: 0.5rem 1.5rem;
            margin-bottom: 1.5rem;
          }

          .nav-button {
            top: 50%;
            bottom: auto;
            transform: translateY(-50%);
            width: 3rem;
            height: 3rem;
          }

          .nav-button:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-50%) scale(1.1);
          }

          .nav-button-left {
            left: 1.5rem;
          }

          .nav-button-right {
            right: 1.5rem;
          }

          .slide-indicators {
            bottom: 3rem;
            gap: 0.75rem;
          }

          .slide-indicator {
            width: 2.5rem;
            height: 0.375rem;
          }

          .slide-indicator.active {
            width: 4rem;
          }
        }

        /* Laptop: 1024px+ */
        @media (min-width: 1024px) {
          .hero-content {
            padding: 2rem;
            max-width: 1200px;
          }

          .nav-button-left {
            left: 2rem;
          }

          .nav-button-right {
            right: 2rem;
          }
        }
      `}</style>

      {slides.map((slide, i) => (
        <div
          key={i}
          className="hero-slide"
          style={{ 
            opacity: currentSlide === i ? 1 : 0,
            transform: currentSlide === i ? 'scale(1)' : 'scale(1.05)',
            pointerEvents: currentSlide === i ? 'auto' : 'none'
          }}
        >
          <img src={slide.image} alt="" />
          <div className="hero-overlay" />
        </div>
      ))}

      <div className="hero-content">
        <div 
          className="hero-badge"
          style={{ 
            backgroundColor: `${currentAccent}20`,
            color: currentAccent,
            border: `1px solid ${currentAccent}40`
          }}
        >
          Leamington Royals CC
        </div>
        <h1 className="hero-title">
          {slides[currentSlide].title}
        </h1>
        <h2 className="hero-subtitle" style={{ color: currentAccent }}>
          {slides[currentSlide].subtitle}
        </h2>
        <Link to={createPageUrl(slides[currentSlide].cta.page)}>
          <Button 
            className="font-bold rounded-xl transition-all hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${currentAccent} 0%, ${currentAccent}cc 100%)`, 
              color: '#000',
              padding: 'clamp(0.75rem, 2vh, 1rem) clamp(2rem, 4vw, 3rem)',
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              height: 'auto'
            }}
          >
            {slides[currentSlide].cta.text}
            <ArrowRight style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
          </Button>
        </Link>
      </div>

      <button onClick={prevSlide} className="nav-button nav-button-left">
        <ChevronLeft style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
      </button>

      <button onClick={nextSlide} className="nav-button nav-button-right">
        <ChevronRight style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
      </button>

      <div className="slide-indicators">
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`slide-indicator ${currentSlide === i ? 'active' : ''}`}
            style={{ color: currentSlide === i ? slide.accent : 'transparent' }}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroSection;