import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Command registry ────────────────────────────────────────────────────────
// Every searchable item: pages, actions, AI features, admin tools.

const COMMANDS = [
  // ── Navigate: Overview ──
  { id: 'nav-dashboard', label: 'Dashboard', category: 'Navigate', section: 'Overview', path: '/', keywords: 'home overview main' },
  { id: 'nav-live-pulse', label: 'Live Pulse', category: 'Navigate', section: 'Overview', path: '/live-pulse', keywords: 'real-time monitor heartbeat' },
  { id: 'nav-practice', label: 'Practice Overview', category: 'Navigate', section: 'Overview', path: '/practice', keywords: 'firm office' },
  { id: 'nav-health', label: 'Financial Health Score', category: 'Navigate', section: 'Overview', path: '/financial-health', keywords: 'score rating benchmark' },

  // ── Navigate: Sales ──
  { id: 'nav-clients', label: 'Clients', category: 'Navigate', section: 'Sales', path: '/clients', keywords: 'customers contacts people' },
  { id: 'nav-quotes', label: 'Quotes', category: 'Navigate', section: 'Sales', path: '/quotes', keywords: 'estimates proposals' },
  { id: 'nav-invoicing', label: 'Invoicing', category: 'Navigate', section: 'Sales', path: '/invoicing', keywords: 'invoice bill send payment' },
  { id: 'nav-credit-notes', label: 'Credit Notes', category: 'Navigate', section: 'Sales', path: '/credit-notes', keywords: 'refund return credit' },

  // ── Navigate: Purchases ──
  { id: 'nav-suppliers', label: 'Suppliers', category: 'Navigate', section: 'Purchases', path: '/suppliers', keywords: 'vendors providers' },
  { id: 'nav-bills', label: 'Bills', category: 'Navigate', section: 'Purchases', path: '/bills', keywords: 'expenses payables accounts' },
  { id: 'nav-purchase-orders', label: 'Purchase Orders', category: 'Navigate', section: 'Purchases', path: '/purchase-orders', keywords: 'PO procurement buy' },
  { id: 'nav-live-receipt', label: 'Live Receipt', category: 'Navigate', section: 'Purchases', path: '/live-receipt', keywords: 'scan capture photo OCR' },
  { id: 'nav-spend-monitor', label: 'Spend Monitor', category: 'Navigate', section: 'Purchases', path: '/spend-monitor', keywords: 'spending analysis cost' },

  // ── Navigate: Banking ──
  { id: 'nav-banking', label: 'Bank Feeds', category: 'Navigate', section: 'Banking', path: '/banking', keywords: 'bank transactions plaid basiq' },
  { id: 'nav-reconciliation', label: 'Bank Reconciliation', category: 'Navigate', section: 'Banking', path: '/bank-reconciliation', keywords: 'match reconcile balance' },
  { id: 'nav-smart-recon', label: 'Smart Reconciliation', category: 'Navigate', section: 'Banking', path: '/smart-reconciliation', keywords: 'AI auto reconcile' },
  { id: 'nav-recurring', label: 'Recurring Transactions', category: 'Navigate', section: 'Banking', path: '/recurring', keywords: 'repeat schedule subscription' },

  // ── Navigate: Accounting ──
  { id: 'nav-coa', label: 'Chart of Accounts', category: 'Navigate', section: 'Accounting', path: '/chart-of-accounts', keywords: 'ledger GL general' },
  { id: 'nav-journal', label: 'Journal Entries', category: 'Navigate', section: 'Accounting', path: '/journal-entries', keywords: 'debit credit entry manual' },
  { id: 'nav-review', label: 'Review Queue', category: 'Navigate', section: 'Accounting', path: '/review', keywords: 'approve draft transaction' },
  { id: 'nav-peer-review', label: 'Peer Review', category: 'Navigate', section: 'Accounting', path: '/peer-review', keywords: 'quality check audit' },
  { id: 'nav-fixed-assets', label: 'Fixed Assets', category: 'Navigate', section: 'Accounting', path: '/fixed-assets', keywords: 'depreciation asset property equipment' },
  { id: 'nav-inventory', label: 'Inventory', category: 'Navigate', section: 'Accounting', path: '/inventory', keywords: 'stock products SKU warehouse' },
  { id: 'nav-budgets', label: 'Budgets', category: 'Navigate', section: 'Accounting', path: '/budgets', keywords: 'budget forecast plan' },

  // ── Navigate: Payroll & HR ──
  { id: 'nav-payroll', label: 'Payroll', category: 'Navigate', section: 'Payroll & HR', path: '/payroll', keywords: 'salary wages employees pay run' },
  { id: 'nav-time-tracker', label: 'Time Tracker', category: 'Navigate', section: 'Payroll & HR', path: '/time-tracker', keywords: 'timesheet timer billable hours' },

  // ── Navigate: Tax & Compliance ──
  { id: 'nav-tax', label: 'Tax Engine', category: 'Navigate', section: 'Tax & Compliance', path: '/tax', keywords: 'GST VAT sales tax calculation' },
  { id: 'nav-tax-filing', label: 'Tax Filing', category: 'Navigate', section: 'Tax & Compliance', path: '/tax-filing', keywords: 'BAS lodge file return submit' },
  { id: 'nav-tax-rulings', label: 'Tax Rulings Agent', category: 'Navigate', section: 'Tax & Compliance', path: '/tax-rulings', keywords: 'ruling precedent ATO IRD HMRC IRS' },
  { id: 'nav-tax-advisor', label: 'Tax Advisor Toolkit', category: 'Navigate', section: 'Tax & Compliance', path: '/tax-advisor', keywords: 'advisor strategy planning' },
  { id: 'nav-compliance', label: 'Compliance Calendar', category: 'Navigate', section: 'Tax & Compliance', path: '/compliance', keywords: 'deadline due date filing obligation' },

  // ── Navigate: Reports & Planning ──
  { id: 'nav-reports', label: 'Reports', category: 'Navigate', section: 'Reports & Planning', path: '/reports', keywords: 'P&L balance sheet trial cash flow' },
  { id: 'nav-projects', label: 'Projects', category: 'Navigate', section: 'Reports & Planning', path: '/projects', keywords: 'project management task' },
  { id: 'nav-scenarios', label: 'Scenario Planning', category: 'Navigate', section: 'Reports & Planning', path: '/scenarios', keywords: 'what if forecast model simulation' },

  // ── Navigate: Documents ──
  { id: 'nav-documents', label: 'Documents', category: 'Navigate', section: 'Documents', path: '/documents', keywords: 'files upload PDF attachment' },
  { id: 'nav-email-scanner', label: 'Email Scanner', category: 'Navigate', section: 'Documents', path: '/email-scanner', keywords: 'inbox parse extract' },
  { id: 'nav-doc-chaser', label: 'Document Chaser', category: 'Navigate', section: 'Documents', path: '/document-chaser', keywords: 'chase follow-up missing' },

  // ── Navigate: Platform ──
  { id: 'nav-marketplace', label: 'Marketplace', category: 'Navigate', section: 'Platform', path: '/marketplace', keywords: 'apps integrations extensions add-ons' },
  { id: 'nav-integrations', label: 'Integrations', category: 'Navigate', section: 'Platform', path: '/integrations', keywords: 'connect API sync' },
  { id: 'nav-partners', label: 'Partner Program', category: 'Navigate', section: 'Platform', path: '/partners', keywords: 'certified accountant referral' },
  { id: 'nav-portal', label: 'Client Portal', category: 'Navigate', section: 'Platform', path: '/portal', keywords: 'client access share' },
  { id: 'nav-enterprise', label: 'Enterprise', category: 'Navigate', section: 'Platform', path: '/enterprise', keywords: 'multi-practice white-label' },

  // ── Navigate: Admin ──
  { id: 'nav-admin', label: 'Command Center', category: 'Navigate', section: 'Admin', path: '/admin', keywords: 'admin control panel management' },
  { id: 'nav-activity', label: 'Activity Feed', category: 'Navigate', section: 'Admin', path: '/activity', keywords: 'audit log trail history' },
  { id: 'nav-billing', label: 'Billing', category: 'Navigate', section: 'Admin', path: '/billing', keywords: 'subscription plan payment' },
  { id: 'nav-settings', label: 'Settings', category: 'Navigate', section: 'Admin', path: '/settings', keywords: 'preferences profile configuration' },
  { id: 'nav-help', label: 'Help Center', category: 'Navigate', section: 'Admin', path: '/help', keywords: 'support FAQ knowledge base' },

  // ── Actions ──
  { id: 'act-create-invoice', label: 'Create Invoice', category: 'Actions', path: '/invoicing', keywords: 'new invoice bill send' },
  { id: 'act-create-client', label: 'Create Client', category: 'Actions', path: '/clients', keywords: 'new client customer add' },
  { id: 'act-create-quote', label: 'Create Quote', category: 'Actions', path: '/quotes', keywords: 'new quote estimate proposal' },
  { id: 'act-create-bill', label: 'Create Bill', category: 'Actions', path: '/bills', keywords: 'new bill expense payable' },
  { id: 'act-create-journal', label: 'Create Journal Entry', category: 'Actions', path: '/journal-entries', keywords: 'new journal debit credit manual entry' },
  { id: 'act-create-po', label: 'Create Purchase Order', category: 'Actions', path: '/purchase-orders', keywords: 'new PO procurement order' },
  { id: 'act-run-payroll', label: 'Run Payroll', category: 'Actions', path: '/payroll', keywords: 'process pay run salary wages' },
  { id: 'act-run-month-end', label: 'Run Month-End Close', category: 'Actions', path: '/agentic', keywords: 'close month autonomous agent' },
  { id: 'act-file-tax', label: 'File Tax Return', category: 'Actions', path: '/tax-filing', keywords: 'lodge BAS VAT GST submit return' },
  { id: 'act-reconcile', label: 'Reconcile Bank Transactions', category: 'Actions', path: '/bank-reconciliation', keywords: 'match reconcile bank balance' },
  { id: 'act-scan-receipt', label: 'Scan Receipt', category: 'Actions', path: '/live-receipt', keywords: 'capture photo OCR receipt upload' },
  { id: 'act-import-data', label: 'Import Data', category: 'Actions', path: '/import', keywords: 'upload CSV import migrate Xero QBO MYOB' },
  { id: 'act-export-report', label: 'Export Report', category: 'Actions', path: '/reports', keywords: 'download PDF export print' },

  // ── AI ──
  { id: 'ai-ask', label: 'Ask AlecRae', category: 'AI', path: '/ask', keywords: 'question chat AI assistant natural language' },
  { id: 'ai-voice', label: 'Voice Commands', category: 'AI', path: '/voice', keywords: 'speak talk microphone dictate' },
  { id: 'ai-predictions', label: 'Predictive Insights', category: 'AI', path: '/predictions', keywords: 'forecast predict cash flow trend' },
  { id: 'ai-agents', label: 'AI Agents', category: 'AI', path: '/agentic', keywords: 'autonomous agent multi-agent orchestrator' },
  { id: 'ai-forensic', label: 'Forensic Sweep', category: 'AI', path: '/forensic-tools', keywords: 'fraud detection benford vendor audit' },
  { id: 'ai-smart-tools', label: 'Smart Tools', category: 'AI', path: '/smart-tools', keywords: 'intelligent automation' },
  { id: 'ai-smart-inbox', label: 'Smart Inbox', category: 'AI', path: '/smart-inbox', keywords: 'email triage AI sort priority' },
  { id: 'ai-insights', label: 'AI Insights', category: 'AI', path: '/ai-insights', keywords: 'anomaly alert recommendation' },
];

const CATEGORY_ORDER = ['Navigate', 'Actions', 'AI'];

const CATEGORY_ICONS = {
  Navigate: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  Actions: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  AI: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5" />
    </svg>
  ),
};

const RECENT_KEY = 'alecraeCommandBarRecent';

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5);
  } catch {
    return [];
  }
}

function pushRecent(id) {
  try {
    const prev = getRecent().filter(r => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, 5)));
  } catch {
    /* localStorage may be unavailable */
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // ── Open / close via Cmd+K / Ctrl+K ──
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Auto-focus input when opened ──
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // small delay so the DOM is painted before focus
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ── Filtered results ──
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) {
      // Show recent commands first, then all commands grouped
      const recentIds = getRecent();
      const recentItems = recentIds
        .map(id => COMMANDS.find(c => c.id === id))
        .filter(Boolean)
        .map(c => ({ ...c, category: 'Recent' }));

      // Group remaining by category
      const grouped = [];
      for (const cat of CATEGORY_ORDER) {
        const items = COMMANDS.filter(c => c.category === cat);
        if (items.length) grouped.push(...items);
      }

      return [...recentItems, ...grouped];
    }

    // Score-based fuzzy search
    return COMMANDS
      .map(cmd => {
        const haystack = `${cmd.label} ${cmd.keywords} ${cmd.section || ''} ${cmd.category}`.toLowerCase();
        // exact substring match scores highest
        if (haystack.includes(q)) {
          // label match scores higher than keyword match
          const labelMatch = cmd.label.toLowerCase().includes(q);
          return { ...cmd, score: labelMatch ? 100 : 50 };
        }
        // check each query word individually
        const words = q.split(/\s+/);
        const matched = words.filter(w => haystack.includes(w)).length;
        if (matched === words.length) return { ...cmd, score: 30 };
        if (matched > 0) return { ...cmd, score: matched * 10 };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [query]);

  // ── Flatten for keyboard nav ──
  const flatResults = results;

  // ── Scroll selected item into view ──
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // ── Execute command ──
  const executeCommand = useCallback(
    (cmd) => {
      if (!cmd) return;
      pushRecent(cmd.id);
      setOpen(false);
      if (cmd.path) navigate(cmd.path);
    },
    [navigate]
  );

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % (flatResults.length || 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + (flatResults.length || 1)) % (flatResults.length || 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(flatResults[selectedIndex]);
        return;
      }
    },
    [flatResults, selectedIndex, executeCommand]
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  // ── Group results by category for rendering ──
  const grouped = [];
  let lastCat = null;
  flatResults.forEach((item, idx) => {
    if (item.category !== lastCat) {
      grouped.push({ type: 'header', label: item.category, key: `hdr-${item.category}-${idx}` });
      lastCat = item.category;
    }
    grouped.push({ type: 'item', item, flatIndex: idx, key: item.id + '-' + idx });
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '70vh' }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions, AI tools..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 py-2">
          {flatResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No results for "<span className="text-gray-600 font-medium">{query}</span>"
            </div>
          )}

          {grouped.map((entry) => {
            if (entry.type === 'header') {
              return (
                <div key={entry.key} className="px-4 pt-3 pb-1 flex items-center gap-2">
                  {entry.label === 'Recent' ? (
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-gray-400">{CATEGORY_ICONS[entry.label]}</span>
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {entry.label}
                  </span>
                </div>
              );
            }

            const { item, flatIndex } = entry;
            const isSelected = flatIndex === selectedIndex;

            return (
              <button
                key={entry.key}
                data-index={flatIndex}
                onClick={() => executeCommand(item)}
                onMouseEnter={() => setSelectedIndex(flatIndex)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${isSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {item.section && (
                    <span className="ml-2 text-xs text-gray-400">{item.section}</span>
                  )}
                </div>
                {item.path && (
                  <span className="text-[10px] text-gray-300 font-mono shrink-0">{item.path}</span>
                )}
                {isSelected && (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 bg-indigo-100 rounded border border-indigo-200">
                    ↵
                  </kbd>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400 bg-gray-50">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">↑</kbd>
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">esc</kbd>
            close
          </span>
          <span className="ml-auto text-gray-300">
            {flatResults.length} result{flatResults.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
