import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Premium hero section with animated gradient mesh background,
 * floating grid, glowing orbs, and a live "Ask Astra" typing demo.
 * No stock photos — pure generative visuals like Linear/Stripe/Vercel.
 */

const TYPING_DEMOS = [
  { query: 'Show me overdue invoices over $5,000', answer: 'Found 3 overdue invoices totalling $18,400 across 2 entities. Oldest is 47 days past due.' },
  { query: 'What was our cash position last Friday?', answer: '$1,247,300 across 4 accounts. Up 8.2% from the prior week. Operating account: $892,100.' },
  { query: 'Run Benford analysis on Q3 vendor payments', answer: 'Analysis complete. Chi-squared: 3.41 (pass). One anomaly flagged: Vendor #2847 shows digit clustering at $4,900.' },
  { query: 'Calculate AU-US treaty benefit on $200K royalties', answer: 'Under AU-US DTA Article 12: WHT reduced from 30% to 5%. Tax saving: $50,000. Auto-applied to next lodgement.' },
];

export default function HeroCarousel({ children }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [demoIndex, setDemoIndex] = useState(0);
  const [typedQuery, setTypedQuery] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [phase, setPhase] = useState('typing-query'); // typing-query | typing-answer | paused
  const rafRef = useRef(null);

  // Subtle parallax on mouse move
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

  // Typing animation
  useEffect(() => {
    const demo = TYPING_DEMOS[demoIndex];
    let timeout;

    if (phase === 'typing-query') {
      if (typedQuery.length < demo.query.length) {
        timeout = setTimeout(() => {
          setTypedQuery(demo.query.slice(0, typedQuery.length + 1));
        }, 35 + Math.random() * 25);
      } else {
        timeout = setTimeout(() => setPhase('typing-answer'), 600);
      }
    } else if (phase === 'typing-answer') {
      if (typedAnswer.length < demo.answer.length) {
        timeout = setTimeout(() => {
          setTypedAnswer(demo.answer.slice(0, typedAnswer.length + 1));
        }, 12 + Math.random() * 15);
      } else {
        timeout = setTimeout(() => setPhase('paused'), 3000);
      }
    } else if (phase === 'paused') {
      setDemoIndex((demoIndex + 1) % TYPING_DEMOS.length);
      setTypedQuery('');
      setTypedAnswer('');
      setPhase('typing-query');
    }

    return () => clearTimeout(timeout);
  }, [phase, typedQuery, typedAnswer, demoIndex]);

  const orbX = 50 + (mousePos.x - 0.5) * 15;
  const orbY = 50 + (mousePos.y - 0.5) * 15;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090d]">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        {/* Primary gradient orb */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, #4f46e5 30%, transparent 70%)',
            left: `${orbX - 20}%`,
            top: `${orbY - 25}%`,
            transition: 'left 2s ease-out, top 2s ease-out',
          }}
        />
        {/* Secondary orb */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, #7c3aed 40%, transparent 70%)',
            right: `${30 - (mousePos.x - 0.5) * 10}%`,
            bottom: `${20 - (mousePos.y - 0.5) * 10}%`,
            transition: 'right 3s ease-out, bottom 3s ease-out',
          }}
        />
        {/* Accent orb */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, #0891b2 40%, transparent 70%)',
            left: '60%',
            top: '20%',
            animation: 'float-slow 20s ease-in-out infinite',
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

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}

        {/* Live AI Demo terminal */}
        <div className="flex justify-center px-6 pb-8">
          <div className="w-full max-w-2xl">
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-indigo-500/10">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[11px] text-white/30 font-mono">Ask Astra</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              {/* Query line */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-indigo-400 text-sm font-mono mt-0.5">&gt;</span>
                  <div className="text-sm text-white/90 font-mono leading-relaxed">
                    {typedQuery}
                    {phase === 'typing-query' && (
                      <span className="inline-block w-[2px] h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              </div>
              {/* Answer */}
              {typedAnswer && (
                <div className="px-5 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-sm font-mono mt-0.5">$</span>
                    <div className="text-sm text-white/60 font-mono leading-relaxed">
                      {typedAnswer}
                      {phase === 'typing-answer' && (
                        <span className="inline-block w-[2px] h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-12 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel indicators removed — replaced with continuous live demo */}

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -40px); }
          66% { transform: translate(-20px, 30px); }
        }
      `}</style>
    </div>
  );
}
