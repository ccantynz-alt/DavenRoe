import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Integration partners bar — shows the real technology partners
 * we integrate with, not fake customer logos.
 */

const PARTNERS = [
  { name: 'Plaid', region: 'US & Canada' },
  { name: 'Basiq', region: 'AU & NZ' },
  { name: 'TrueLayer', region: 'UK & EU' },
  { name: 'Stripe', region: 'Payments' },
  { name: 'Anthropic', region: 'AI' },
];

export default function LogoBar() {
  return (
    <section className="py-14 bg-white border-b border-gray-100">
      <motion.p
        className="text-[11px] text-center text-gray-400 uppercase tracking-[0.2em] mb-8 font-medium"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
      >
        Powered by industry-leading infrastructure
      </motion.p>
      <div className="flex justify-center gap-8 md:gap-16 flex-wrap px-6">
        {PARTNERS.map((partner, i) => (
          <motion.div
            key={partner.name}
            className="flex flex-col items-center gap-1.5 group"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors duration-300 border border-gray-100">
              <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-500 transition-colors duration-300">
                {partner.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
              {partner.name}
            </span>
            <span className="text-[10px] text-gray-300">{partner.region}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
