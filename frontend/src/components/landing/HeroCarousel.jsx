import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Premium hero with animated neural-network particle canvas,
 * reactive gradient mesh, and floating grid. Feels alive and intelligent.
 */

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const count = Math.min(80, Math.floor(canvas.offsetWidth / 15));
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        pulse: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? 240 : 270, // indigo or violet
      });
    }
    particlesRef.current = particles;

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      const mx = mouseRef.current.x * w();
      const my = mouseRef.current.y * h();
      const time = Date.now() * 0.001;

      // Update particles
      for (const p of particles) {
        p.pulse += 0.02;
        p.x += p.vx;
        p.y += p.vy;

        // Mouse attraction (subtle)
        const dmx = mx - p.x;
        const dmy = my - p.y;
        const dm = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dm < 250) {
          p.vx += dmx * 0.00003;
          p.vy += dmy * 0.00003;
        }

        // Speed limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.8) {
          p.vx *= 0.8 / speed;
          p.vy *= 0.8 / speed;
        }

        // Wrap edges
        if (p.x < -20) p.x = w() + 20;
        if (p.x > w() + 20) p.x = -20;
        if (p.y < -20) p.y = h() + 20;
        if (p.y > h() + 20) p.y = -20;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(129,140,248,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        const glow = 0.4 + Math.sin(p.pulse) * 0.3;
        const size = p.size * (1 + Math.sin(p.pulse) * 0.3);

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
        grad.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${glow * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 80%, ${glow})`;
        ctx.fill();
      }

      // Pulsing data streams near mouse
      for (let i = 0; i < 3; i++) {
        const angle = time * 0.5 + (i * Math.PI * 2) / 3;
        const radius = 60 + Math.sin(time + i) * 20;
        const sx = mx + Math.cos(angle) * radius;
        const sy = my + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${240 + i * 30}, 80%, 70%, ${0.3 + Math.sin(time * 2 + i) * 0.2})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    window.addEventListener('mousemove', handleMouse);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

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

  const orbX = 50 + (mousePos.x - 0.5) * 20;
  const orbY = 50 + (mousePos.y - 0.5) * 20;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a]">
      {/* Deep space gradient base */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(15,15,40,1) 0%, rgba(5,6,10,1) 70%)',
      }} />

      {/* Animated gradient orbs — more vivid */}
      <div className="absolute inset-0">
        <div
          className="absolute w-[900px] h-[900px] rounded-full opacity-40 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, #4338ca 30%, transparent 70%)',
            left: `${orbX - 25}%`,
            top: `${orbY - 30}%`,
            transition: 'left 1.5s ease-out, top 1.5s ease-out',
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #a855f7 0%, #7c3aed 40%, transparent 70%)',
            right: `${25 - (mousePos.x - 0.5) * 12}%`,
            bottom: `${15 - (mousePos.y - 0.5) * 12}%`,
            transition: 'right 2s ease-out, bottom 2s ease-out',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #0891b2 40%, transparent 70%)',
            left: '55%',
            top: '15%',
            animation: 'float-slow 18s ease-in-out infinite',
          }}
        />
        {/* Additional accent orb */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
            left: '20%',
            bottom: '20%',
            animation: 'float-slow 25s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Neural network particle canvas */}
      <ParticleCanvas />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* Radial vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(5,6,10,0.3) 50%, rgba(5,6,10,0.85) 100%)',
      }} />

      {/* Horizontal scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[1px] opacity-[0.06]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
            animation: 'scanline 8s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}

        {/* Scroll indicator */}
        <div className="pb-8 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/20 tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-white/15 flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-white/30 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes scanline {
          0% { top: -2%; }
          100% { top: 102%; }
        }
      `}</style>
    </div>
  );
}
