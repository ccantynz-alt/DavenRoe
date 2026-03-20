/**
 * "Trusted by" / "Integrates with" logo bar.
 * Shows recognisable accounting/banking brands
 * as subtle gray wordmarks — feels premium and established.
 */

const LOGOS = [
  { name: 'ANZ', letters: 'ANZ' },
  { name: 'Commonwealth Bank', letters: 'CBA' },
  { name: 'Westpac', letters: 'WBC' },
  { name: 'NAB', letters: 'NAB' },
  { name: 'Chase', letters: 'CHASE' },
  { name: 'Barclays', letters: 'BARCLAYS' },
  { name: 'ASB', letters: 'ASB' },
  { name: 'HSBC', letters: 'HSBC' },
];

export default function LogoBar() {
  return (
    <section className="py-12 px-6 lg:px-16 border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs text-center text-gray-400 uppercase tracking-widest mb-8">
          Connects with 21,000+ financial institutions worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
          {LOGOS.map((logo, i) => (
            <div
              key={i}
              className="text-gray-300 hover:text-gray-400 transition-colors font-bold text-lg tracking-wider select-none"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {logo.letters}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
