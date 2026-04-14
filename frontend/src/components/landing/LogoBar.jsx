/**
 * Integration partners bar — infinite marquee scroll with glass morphism cards.
 * Shows the real technology partners we integrate with.
 */

const PARTNERS = [
  { name: 'Plaid', region: 'US & Canada', abbr: 'PL' },
  { name: 'Basiq', region: 'AU & NZ', abbr: 'BQ' },
  { name: 'TrueLayer', region: 'UK & EU', abbr: 'TL' },
  { name: 'Stripe', region: 'Payments', abbr: 'ST' },
  { name: 'Anthropic', region: 'AI Engine', abbr: 'AN' },
  { name: 'Mailgun', region: 'Email', abbr: 'MG' },
  { name: 'Neon', region: 'Database', abbr: 'NE' },
  { name: 'Vercel', region: 'Infrastructure', abbr: 'VC' },
];

function PartnerCard({ partner }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300 shrink-0">
      <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
        <span className="text-xs font-bold text-gray-500">{partner.abbr}</span>
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-700">{partner.name}</div>
        <div className="text-[10px] text-gray-400">{partner.region}</div>
      </div>
    </div>
  );
}

export default function LogoBar() {
  const doubled = [...PARTNERS, ...PARTNERS];

  return (
    <section className="py-16 bg-white border-b border-gray-100 overflow-hidden">
      <p className="text-[11px] text-center text-gray-400 uppercase tracking-[0.25em] mb-10 font-medium">
        Powered by industry-leading infrastructure
      </p>

      {/* Infinite marquee */}
      <div className="relative">
        <div className="flex gap-4 animate-marquee">
          {doubled.map((partner, i) => (
            <PartnerCard key={`${partner.name}-${i}`} partner={partner} />
          ))}
        </div>

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
