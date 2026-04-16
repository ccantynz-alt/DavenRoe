import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Search, ExternalLink, MessageCircle } from 'lucide-react';

/**
 * HelpButton — Reusable contextual help button.
 *
 * Place anywhere in the app to surface relevant help articles for that context.
 *
 * Props:
 *   context   — string keyword(s) that scope the tooltip articles (e.g. "invoicing", "bank feeds")
 *   size      — "sm" | "md" | "lg"  (default "md")
 *   className — additional classes for the outer wrapper
 *
 * Usage:
 *   <HelpButton context="invoicing" />
 *   <HelpButton context="payroll" size="sm" />
 */

const CONTEXTUAL_ARTICLES = {
  dashboard: [
    { title: 'Understanding the Dashboard', path: '/help?article=gs5' },
    { title: 'Pillar status indicators', path: '/help?article=gs5' },
    { title: 'Customizing your dashboard', path: '/help?category=getting-started' },
  ],
  invoicing: [
    { title: 'Creating and sending invoices', path: '/help?article=inv1' },
    { title: 'Setting up online payments', path: '/help?article=inv2' },
    { title: 'Credit notes and refunds', path: '/help?article=inv3' },
    { title: 'Recurring invoices', path: '/help?article=inv4' },
  ],
  'bank feeds': [
    { title: 'How AI categorisation works', path: '/help?article=bf1' },
    { title: 'Reconciling bank transactions', path: '/help?article=bf2' },
    { title: 'Bank feed disconnections', path: '/help?article=bf3' },
  ],
  banking: [
    { title: 'Connecting your first bank feed', path: '/help?article=gs2' },
    { title: 'How AI categorisation works', path: '/help?article=bf1' },
    { title: 'Multi-currency transactions', path: '/help?article=bf4' },
  ],
  payroll: [
    { title: 'Running your first pay run', path: '/help?article=pay1' },
    { title: 'Managing employee details', path: '/help?article=pay2' },
    { title: 'Leave management', path: '/help?article=pay3' },
    { title: 'Superannuation and pensions', path: '/help?article=pay4' },
  ],
  tax: [
    { title: 'How the tax engine works', path: '/help?article=tax1' },
    { title: 'Preparing a BAS', path: '/help?article=tax2' },
    { title: 'Cross-border tax treaties', path: '/help?article=tax4' },
  ],
  reports: [
    { title: 'Standard financial reports', path: '/help?article=rep1' },
    { title: 'Financial Health Score', path: '/help?article=rep2' },
    { title: 'Custom report building', path: '/help?article=rep3' },
  ],
  ai: [
    { title: 'Ask AlecRae queries', path: '/help?article=ai1' },
    { title: 'AI Command Center', path: '/help?article=ai2' },
    { title: 'Autonomous month-end close', path: '/help?article=ai3' },
  ],
  forensic: [
    { title: "Benford's Law analysis", path: '/help?article=for1' },
    { title: 'Ghost vendor detection', path: '/help?article=for2' },
    { title: 'Due diligence reports', path: '/help?article=for3' },
  ],
  inventory: [
    { title: 'Inventory management overview', path: '/help?category=getting-started' },
    { title: 'SKU tracking and assemblies', path: '/help?category=getting-started' },
  ],
  settings: [
    { title: 'Practice settings', path: '/help?category=account-billing' },
    { title: 'Billing and subscription', path: '/help?category=account-billing' },
    { title: 'Data security', path: '/help?category=security' },
  ],
  documents: [
    { title: 'Document upload and OCR', path: '/help?category=getting-started' },
    { title: 'Smart receipt matching', path: '/help?category=getting-started' },
  ],
};

const SIZE_MAP = {
  sm: { button: 'w-6 h-6', icon: 14, popup: 'w-64' },
  md: { button: 'w-8 h-8', icon: 16, popup: 'w-72' },
  lg: { button: 'w-10 h-10', icon: 20, popup: 'w-80' },
};

export default function HelpButton({ context = 'dashboard', size = 'md', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const s = SIZE_MAP[size] || SIZE_MAP.md;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Find matching articles
  const contextKey = Object.keys(CONTEXTUAL_ARTICLES).find(
    (k) => context.toLowerCase().includes(k)
  );
  const articles = CONTEXTUAL_ARTICLES[contextKey] || CONTEXTUAL_ARTICLES.dashboard;

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`${s.button} rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        title="Help"
        aria-label="Help"
      >
        <HelpCircle size={s.icon} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 top-full mt-2 ${s.popup} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Help &amp; Resources
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>

            {/* Articles */}
            <div className="p-2 max-h-64 overflow-y-auto">
              {articles.map((a, i) => (
                <button
                  key={i}
                  onClick={() => {
                    navigate(a.path);
                    setOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <ExternalLink size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {a.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 p-2 flex gap-1">
              <button
                onClick={() => {
                  navigate('/help');
                  setOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Search size={12} />
                Browse all articles
              </button>
              <button
                onClick={() => {
                  navigate('/help?tab=chat');
                  setOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MessageCircle size={12} />
                Ask support
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
