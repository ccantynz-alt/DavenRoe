import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { GlobalFooterDisclaimer } from './LegalDisclaimer';
import HelpWidget from './HelpWidget';

const navSections = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard' },
      { path: '/live-pulse', label: 'Live Pulse' },
      { path: '/practice', label: 'Practice Overview' },
      { path: '/financial-health', label: 'Health Score' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { path: '/clients', label: 'Clients' },
      { path: '/quotes', label: 'Quotes' },
      { path: '/invoicing', label: 'Invoicing' },
      { path: '/credit-notes', label: 'Credit Notes' },
    ],
  },
  {
    label: 'Purchases',
    items: [
      { path: '/suppliers', label: 'Suppliers' },
      { path: '/bills', label: 'Bills' },
      { path: '/purchase-orders', label: 'Purchase Orders' },
      { path: '/live-receipt', label: 'Live Receipt' },
      { path: '/spend-monitor', label: 'Spend Monitor' },
    ],
  },
  {
    label: 'Banking',
    items: [
      { path: '/banking', label: 'Bank Feeds' },
      { path: '/bank-reconciliation', label: 'Reconciliation' },
      { path: '/smart-reconciliation', label: 'Smart Reconciliation' },
      { path: '/recurring', label: 'Recurring' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { path: '/chart-of-accounts', label: 'Chart of Accounts' },
      { path: '/journal-entries', label: 'Journal Entries' },
      { path: '/review', label: 'Review Queue' },
      { path: '/peer-review', label: 'Peer Review' },
      { path: '/fixed-assets', label: 'Fixed Assets' },
      { path: '/inventory', label: 'Inventory' },
      { path: '/budgets', label: 'Budgets' },
    ],
  },
  {
    label: 'Payroll & HR',
    items: [
      { path: '/payroll', label: 'Payroll' },
      { path: '/time-tracker', label: 'Time Tracker' },
    ],
  },
  {
    label: 'Tax & Compliance',
    items: [
      { path: '/tax', label: 'Tax Engine' },
      { path: '/tax-filing', label: 'Tax Filing' },
      { path: '/tax-rulings', label: 'Tax Rulings Agent' },
      { path: '/tax-advisor', label: 'Tax Advisor Toolkit' },
      { path: '/tax-agent', label: 'Tax Agent' },
      { path: '/compliance', label: 'Compliance Calendar' },
      { path: '/regulatory', label: 'Regulatory Tracker' },
    ],
  },
  {
    label: 'Reports & Planning',
    items: [
      { path: '/reports', label: 'Reports' },
      { path: '/projects', label: 'Projects' },
      { path: '/scenarios', label: 'Scenario Planning' },
    ],
  },
  {
    label: 'AI & Intelligence',
    items: [
      { path: '/ask', label: 'Ask AlecRae' },
      { path: '/voice', label: 'Voice Commands' },
      { path: '/predictions', label: 'Predictive Insights' },
      { path: '/smart-inbox', label: 'Smart Inbox' },
      { path: '/agentic', label: 'AI Agents' },
      { path: '/ai-insights', label: 'AI Insights' },
      { path: '/forensic-tools', label: 'Forensic Tools' },
      { path: '/smart-tools', label: 'Smart Tools' },
      { path: '/specialists', label: 'Specialist Tools' },
      { path: '/toolkit', label: 'Toolkit' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { path: '/documents', label: 'Documents' },
      { path: '/email-scanner', label: 'Email Scanner' },
      { path: '/document-chaser', label: 'Document Chaser' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { path: '/marketplace', label: 'Marketplace' },
      { path: '/integrations', label: 'Integrations' },
      { path: '/partners', label: 'Partner Program' },
      { path: '/portal', label: 'Client Portal' },
      { path: '/case-studies', label: 'Case Studies' },
      { path: '/incorporate', label: 'Incorporate' },
      { path: '/oracle', label: 'Oracle Brain' },
      { path: '/enterprise', label: 'Enterprise' },
      { path: '/import', label: 'Data Import' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: '/admin', label: 'Command Center' },
      { path: '/activity', label: 'Activity Feed' },
      { path: '/billing', label: 'Billing' },
      { path: '/settings', label: 'Settings' },
      { path: '/help', label: 'Help Center' },
    ],
  },
];

const roleLabels = {
  partner: 'Partner',
  manager: 'Manager',
  senior: 'Senior',
  bookkeeper: 'Bookkeeper',
  client: 'Client',
};

function NavSection({ section, pathname, onNavigate }) {
  const isActive = section.items.some(item => item.path === pathname);
  const [open, setOpen] = useState(isActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold rounded transition-colors',
          isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
        )}
      >
        {section.label}
        <span className="text-[8px]">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={clsx(
                'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                pathname === item.path
                  ? 'bg-indigo-700 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'w-56 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-200',
        'fixed inset-y-0 left-0 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-light italic text-white drop-shadow-md">AlecRae</h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">Accounting</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {navSections.map(section => (
            <NavSection
              key={section.label}
              section={section}
              pathname={pathname}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* User Info */}
        {user && (
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-[10px] text-gray-500">{roleLabels[user.role] || user.role}</p>
              </div>
              <button
                onClick={logout}
                className="text-[10px] text-gray-500 hover:text-white transition-colors px-2 py-1 shrink-0"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-light italic text-gray-900">AlecRae</h1>
          <div className="w-6" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gray-50">
          {children}
          <GlobalFooterDisclaimer />
        </main>
        <HelpWidget />
      </div>
    </div>
  );
}
