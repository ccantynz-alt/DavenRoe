import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Premium hero section with animated gradient mesh background,
 * floating grid, and glowing orbs. Clean, minimal — like Linear/Stripe.
 */

export default function HeroCarousel({ children }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
      rafRef.current = null;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const orbX = 50 + (mousePos.x - 0.5) * 15;
  const orbY = 50 + (mousePos.y - 0.5) * 15;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090d]">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, #4f46e5 30%, transparent 70%)',
            left: `${orbX - 20}%`,
            top: `${orbY - 25}%`,
            transition: 'left 2s ease-out, top 2s ease-out',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, #7c3aed 40%, transparent 70%)',
            right: `${30 - (mousePos.x - 0.5) * 10}%`,
            bottom: `${20 - (mousePos.y - 0.5) * 10}%`,
            transition: 'right 3s ease-out, bottom 3s ease-out',
          }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #0891b2 40%, transparent 70%)',
            left: '60%',
            top: '20%',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 30, 0],
          }}
          transition={{
            duration: 20,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* Radial vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(8,9,13,0.4) 70%, rgba(8,9,13,0.8) 100%)',
      }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}

        {/* Scroll indicator */}
        <div className="pb-8 flex justify-center">
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5">
              <motion.div
                className="w-1 h-2 bg-white/40 rounded-full"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
