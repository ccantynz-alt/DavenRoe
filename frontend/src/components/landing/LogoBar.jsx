/**
 * Animated infinite-scroll logo marquee.
 * Shows bank and integration partners with proper visual weight.
 * Double-rendered for seamless infinite scroll effect.
 */

const LOGOS = [
  { name: 'ANZ', abbr: 'ANZ' },
  { name: 'Commonwealth Bank', abbr: 'CBA' },
  { name: 'Westpac', abbr: 'WBC' },
  { name: 'NAB', abbr: 'NAB' },
  { name: 'Chase', abbr: 'CHASE' },
  { name: 'Barclays', abbr: 'BARCLAYS' },
  { name: 'HSBC', abbr: 'HSBC' },
  { name: 'ASB', abbr: 'ASB' },
  { name: 'Lloyds', abbr: 'LLOYDS' },
  { name: 'Citibank', abbr: 'CITI' },
  { name: 'Wells Fargo', abbr: 'WF' },
  { name: 'BNZ', abbr: 'BNZ' },
];

export default function LogoBar() {
  return (
    <section className="py-14 bg-white border-b border-gray-100 overflow-hidden">
      <p className="text-[11px] text-center text-gray-400 uppercase tracking-[0.2em] mb-8 font-medium">
        Trusted by firms connecting to 21,000+ financial institutions
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Scrolling track */}
        <div className="flex animate-marquee">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-8 flex items-center justify-center"
              style={{ minWidth: '120px' }}
            >
              <div className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors duration-300">
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors duration-300">
                    {logo.abbr.slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-300 group-hover:text-gray-500 transition-colors duration-300 tracking-wide whitespace-nowrap">
                  {logo.abbr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
