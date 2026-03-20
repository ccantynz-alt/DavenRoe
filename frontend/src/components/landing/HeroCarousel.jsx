import { useState, useEffect, useCallback } from 'react';

/**
 * Full-screen hero carousel with crossfade transitions.
 * Uses high-quality Unsplash images of professional settings.
 */

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80&auto=format',
    alt: 'Professional accountant working with financial documents and calculator — precision and trust',
  },
  {
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80&auto=format',
    alt: 'Financial analytics dashboard with charts and data visualisation',
  },
  {
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format',
    alt: 'Person signing financial documents with pen — audit and compliance',
  },
];

export default function HeroCarousel({ children }) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState({});

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % SLIDES.length);
  }, []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  // Preload images
  useEffect(() => {
    SLIDES.forEach((slide, i) => {
      const img = new Image();
      img.onload = () => setLoaded(prev => ({ ...prev, [i]: true }));
      img.src = slide.image;
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background slides with crossfade */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{
              backgroundImage: `url(${slide.image})`,
              transition: 'transform 8s ease-out',
              transform: i === current ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Subtle gradient at the bottom for clean transition */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>

      {/* Carousel indicators */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-500 rounded-full ${
              i === current
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
