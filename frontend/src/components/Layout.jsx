import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { GlobalFooterDisclaimer } from './LegalDisclaimer';
import HelpWidget from './HelpWidget';

const nav = [
  // Overview
  { path: '/', label: 'Dashboard', icon: '~' },
  { path: '/practice', label: 'Practice Overview', icon: '~' },
  { path: '/smart-tools', label: 'Smart Tools', icon: '*' },
  { path: '/financial-health', label: 'Health Score', icon: '+' },
  // Sales & Revenue
  { path: '/clients', label: 'Clients', icon: '@' },
  { path: '/quotes', label: 'Quotes', icon: '"' },
  { path: '/invoicing', label: 'Invoicing', icon: '#' },
  { path: '/credit-notes', label: 'Credit Notes', icon: '-' },
  // Purchases & Expenses
  { path: '/suppliers', label: 'Suppliers', icon: '&' },
  { path: '/bills', label: 'Bills', icon: '$' },
  { path: '/purchase-orders', label: 'Purchase Orders', icon: '>' },
  { path: '/live-receipt', label: 'Live Receipt', icon: '!' },
  { path: '/spend-monitor', label: 'Spend Monitor', icon: '!' },
  // Banking
  { path: '/banking', label: 'Bank Feeds', icon: '$' },
  { path: '/bank-reconciliation', label: 'Bank Reconciliation', icon: '=' },
  { path: '/recurring', label: 'Recurring', icon: '@' },
  // Accounting
  { path: '/chart-of-accounts', label: 'Chart of Accounts', icon: '#' },
  { path: '/journal-entries', label: 'Journal Entries', icon: '+' },
  { path: '/review', label: 'Review Queue', icon: '>' },
  { path: '/peer-review', label: 'Peer Review', icon: '&' },
  // Assets & Inventory
  { path: '/fixed-assets', label: 'Fixed Assets', icon: '{' },
  { path: '/inventory', label: 'Inventory', icon: '{' },
  // Employment
  { path: '/payroll', label: 'Payroll', icon: '$' },
  { path: '/time-tracker', label: 'Time Tracker', icon: ':' },
  // Tax & Compliance
  { path: '/tax', label: 'Tax Engine', icon: '%' },
  { path: '/tax-filing', label: 'Tax Filing', icon: '>' },
  { path: '/tax-agent', label: 'Tax Agent', icon: '?' },
  { path: '/tax-advisor', label: 'Tax Advisor Toolkit', icon: '%' },
  { path: '/tax-rulings', label: 'Tax Rulings Agent', icon: '?' },
  { path: '/forensic-tools', label: 'Forensic Tools', icon: '!' },
  { path: '/compliance', label: 'Compliance', icon: '!' },
  // Projects & Planning
  { path: '/projects', label: 'Projects', icon: '#' },
  { path: '/scenarios', label: 'Scenario Planning', icon: '?' },
  // Reports & Budgets
  { path: '/reports', label: 'Reports', icon: '=' },
  { path: '/budgets', label: 'Budgets', icon: '=' },
  // Documents
  { path: '/documents', label: 'Documents', icon: '^' },
  { path: '/email-scanner', label: 'Email Scanner', icon: '@' },
  // Business
  { path: '/incorporate', label: 'Incorporate', icon: '>' },
  { path: '/portal', label: 'Client Portal', icon: '@' },
  // Platform
  { path: '/specialists', label: 'Specialist Tools', icon: '*' },
  { path: '/toolkit', label: 'Toolkit', icon: '+' },
  { path: '/integrations', label: 'Integrations', icon: '<' },
  { path: '/marketplace', label: 'Marketplace', icon: '#' },
  { path: '/ai-insights', label: 'AI Insights', icon: '?' },
  { path: '/enterprise', label: 'Enterprise', icon: '*' },
  { path: '/activity', label: 'Activity', icon: '~' },
  { path: '/ask', label: 'Ask Astra', icon: '?' },
  { path: '/agentic', label: 'Agentic AI', icon: '&' },
  { path: '/import', label: 'Data Import', icon: '>' },
  { path: '/billing', label: 'Billing', icon: '$' },
  { path: '/admin', label: 'Admin Center', icon: '*' },
  { path: '/help', label: 'Help Center', icon: '?' },
  { path: '/settings', label: 'Settings', icon: ':' },
];

const roleLabels = {
  partner: 'Partner',
  manager: 'Manager',
  senior: 'Senior',
  bookkeeper: 'Bookkeeper',
  client: 'Client',
};

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
        'w-64 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-200',
        'fixed inset-y-0 left-0 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Astra</h1>
            <p className="text-xs text-gray-400 mt-1">Autonomous Accounting</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white text-xl">
            x
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.path
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="text-lg font-mono w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Forensic Add-on */}
        <div className="px-4 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2 px-3">Add-ons</p>
          <a
            href={`${window.location.protocol}//${window.location.hostname}:3001`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-pink-400 hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg font-mono w-5 text-center">!</span>
            Forensic / M&A
          </a>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400">{roleLabels[user.role] || user.role}</p>
              </div>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 shrink-0"
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
          <h1 className="font-bold text-lg">Astra</h1>
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
