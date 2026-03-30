import { useState } from 'react';
import { useToast } from '../components/Toast';

const CATEGORIES = [
  {
    id: 'getting-started', label: 'Getting Started', icon: '🚀', articles: [
      { id: 'gs1', title: 'Setting up your AlecRae account', time: '3 min', content: 'Welcome to AlecRae! After creating your account, you\'ll go through a quick onboarding flow where you set your practice name, default jurisdiction, and connect your first bank feed. AlecRae supports AU, NZ, UK, and US jurisdictions from day one — no add-ons needed. You can manage multiple entities under one subscription.' },
      { id: 'gs2', title: 'Connecting your first bank feed', time: '4 min', content: 'Navigate to Banking > Connect Bank. AlecRae supports Plaid (US/Canada), Basiq (Australia/NZ), and TrueLayer (UK/EU). Select your bank, enter your credentials securely (we never store them — the provider handles authentication), and your transactions will start flowing within minutes. The AI categoriser will automatically classify 95%+ of transactions.' },
      { id: 'gs3', title: 'Inviting team members', time: '2 min', content: 'Go to Settings > Practice > Team Members. Click "Invite" and enter their email. You can assign roles: Owner (full access), Admin (manage users + settings), Accountant (full financial access), Bookkeeper (day-to-day transactions), or Viewer (read-only). Each role has carefully scoped permissions to maintain data security.' },
      { id: 'gs4', title: 'Creating your first client entity', time: '3 min', content: 'Navigate to Clients and click "+ New Client". Enter the business name, ABN/NZBN/CRN/EIN, jurisdiction, and financial year end. You can import existing data from Xero, QuickBooks, or MYOB using our migration tools under Settings > Import. Each entity is completely isolated — no data leaks between clients.' },
      { id: 'gs5', title: 'Understanding the Dashboard', time: '3 min', content: 'Your Dashboard shows real-time stats across all entities: total revenue, expenses, outstanding invoices, bank feed status, compliance deadlines, and AI agent activity. The pillar status indicators (green/amber/red) give you an instant health check. Click any card to drill into details.' },
    ],
  },
  {
    id: 'bank-feeds', label: 'Bank Feeds & Reconciliation', icon: '🏦', articles: [
      { id: 'bf1', title: 'How AI categorisation works', time: '4 min', content: 'AlecRae\'s AI categoriser analyses transaction descriptions, amounts, merchant data, and your historical patterns to assign chart of accounts codes with a confidence score. Transactions above 95% confidence are auto-approved (if you enable this). Below that, they appear in the Review Queue for human verification. The AI learns from your corrections — accuracy improves over time.' },
      { id: 'bf2', title: 'Reconciling bank transactions', time: '5 min', content: 'Navigate to Bank Reconciliation. AlecRae automatically matches bank transactions to invoices, bills, and manual entries. Green items are auto-matched (click to confirm). Amber items have partial matches (review and approve). Red items need manual matching. Use "Create Rule" to set up automatic matching for recurring transactions.' },
      { id: 'bf3', title: 'Handling bank feed disconnections', time: '3 min', content: 'If a bank feed disconnects (you\'ll see a red alert on the Banking page), click "Reconnect". This usually happens when your bank requires re-authentication. If the issue persists, try removing and re-adding the connection. AlecRae will automatically backfill any missed transactions once reconnected.' },
      { id: 'bf4', title: 'Multi-currency transactions', time: '4 min', content: 'AlecRae handles multi-currency automatically. When a foreign currency transaction comes in, we use real-time exchange rates to convert and book the gain/loss. You can set preferred currencies per entity. The unrealised gain/loss report shows your exposure at any point.' },
    ],
  },
  {
    id: 'invoicing', label: 'Invoicing & Payments', icon: '📄', articles: [
      { id: 'inv1', title: 'Creating and sending invoices', time: '3 min', content: 'Go to Invoicing > New Invoice. Select the client, add line items with descriptions, quantities, rates, and tax codes. AlecRae auto-calculates GST/VAT/sales tax based on the entity\'s jurisdiction. Click "Send" to email directly, or "Save as Draft" to review later. Invoices use your practice branding (set in Settings > Practice).' },
      { id: 'inv2', title: 'Setting up online payments', time: '3 min', content: 'Connect Stripe in Settings > Payments. Once connected, every invoice includes a "Pay Now" button. Clients can pay via credit card, debit card, or bank transfer. Payments are automatically matched to the invoice and the status updates in real-time. Stripe fees are 2.9% + 30¢ per transaction.' },
      { id: 'inv3', title: 'Credit notes and refunds', time: '3 min', content: 'Navigate to Credit Notes to create credits against existing invoices. You can apply a credit note to reduce the balance on an open invoice, or issue a refund to the client\'s payment method. Credit notes follow the same tax rules as the original invoice.' },
      { id: 'inv4', title: 'Recurring invoices', time: '2 min', content: 'In Recurring Transactions, set up invoices that generate automatically — weekly, monthly, quarterly, or annually. Each recurrence creates a new invoice in draft (or sends automatically if you enable auto-send). Great for retainer clients and subscription billing.' },
    ],
  },
  {
    id: 'payroll', label: 'Payroll', icon: '💼', articles: [
      { id: 'pay1', title: 'Running your first pay run', time: '5 min', content: 'Go to Payroll > New Pay Run. Select the pay period and employees. AlecRae auto-calculates gross pay, tax withholding (PAYG in AU, PAYE in NZ/UK, Federal+State in US), superannuation/KiwiSaver/pension, and leave accruals. Review the summary, then approve. You can process pay runs for AU, NZ, UK, and US employees all in one platform.' },
      { id: 'pay2', title: 'Managing employee details', time: '3 min', content: 'Each employee record includes personal details, employment type (full-time, part-time, casual, contractor), pay rate, tax file number, super fund, bank details, and leave balances. Update any field and it takes effect from the next pay run.' },
      { id: 'pay3', title: 'Leave management', time: '3 min', content: 'AlecRae tracks annual leave, sick leave, personal leave, and long service leave automatically based on jurisdiction rules. Employees accrue leave each pay run. You can see current balances, approve leave requests, and forecast future liabilities.' },
      { id: 'pay4', title: 'Superannuation and pensions', time: '4 min', content: 'AU: Super Guarantee is 11.5% (2025-26). NZ: KiwiSaver employer contribution is 3% (employee can choose 3-8%). UK: Auto-enrolment minimum is 3% employer + 5% employee. AlecRae calculates these automatically and generates the payment schedules.' },
    ],
  },
  {
    id: 'tax', label: 'Tax & Compliance', icon: '📊', articles: [
      { id: 'tax1', title: 'How the tax engine works', time: '4 min', content: 'AlecRae\'s tax engine applies the correct tax rates based on entity jurisdiction, transaction type, and cross-border rules. It handles GST (AU/NZ), VAT (UK), and Sales Tax (US) automatically. For cross-border transactions, the Treaty Engine applies the correct withholding tax rates under 6 bilateral Double Taxation Agreements.' },
      { id: 'tax2', title: 'Preparing a BAS (Australia)', time: '5 min', content: 'Navigate to Tax Filing. Select the entity and period. AlecRae pre-populates the BAS from your transaction data: GST collected (1A), GST paid (1B), wages (W1-W5), and PAYG withholding. Review each field, validate with our AI checker, and lodge directly to the ATO. AlecRae flags common errors before you submit.' },
      { id: 'tax3', title: 'Compliance Calendar explained', time: '3 min', content: 'The Compliance Calendar tracks 40+ deadlines across AU, NZ, UK, and US — BAS/GST/VAT due dates, PAYG summaries, annual returns, super guarantee deadlines, FBT lodgement, and more. You get alerts 30, 14, and 7 days before each deadline. Never miss a filing date again.' },
      { id: 'tax4', title: 'Cross-border tax treaties', time: '5 min', content: 'AlecRae supports 6 bilateral DTAs: AU-NZ, AU-UK, AU-US, NZ-UK, NZ-US, UK-US. When you create a cross-border transaction (e.g., AU company paying a UK contractor), the Treaty Engine automatically applies the correct withholding tax rate and generates the required documentation.' },
    ],
  },
  {
    id: 'ai', label: 'AI Features', icon: '🤖', articles: [
      { id: 'ai1', title: 'Ask AlecRae — natural language queries', time: '3 min', content: 'Type any financial question in plain English: "What was our revenue last quarter?", "Show me overdue invoices over $5,000", "Compare this month\'s expenses to the same month last year". AlecRae understands context, pulls the data, and responds with formatted answers, charts, or tables.' },
      { id: 'ai2', title: 'AI Command Center', time: '4 min', content: 'The Command Center shows AI-generated insights: cash flow forecasts, anomaly alerts ("Unusual $4,200 payment to unknown vendor"), receipt scanning status, NLP report summaries, and your weekly digest. Everything the AI is doing across your practice, in one place.' },
      { id: 'ai3', title: 'Autonomous month-end close', time: '5 min', content: 'AlecRae\'s multi-agent system can close a month in under 5 seconds. It reconciles all bank feeds, reviews uncategorised transactions, generates accruals, calculates depreciation, and produces the trial balance. You review and approve — the AI does the heavy lifting. Average close time: 4.2 seconds vs. days with competitors.' },
      { id: 'ai4', title: 'Review Queue and confidence scores', time: '3 min', content: 'Every AI-drafted transaction gets a confidence score (0-100%). High-confidence items (95%+) can be auto-approved. Everything else appears in the Review Queue for human verification. You can set your own threshold — lower it for speed, raise it for control. The AI learns from every approval and correction.' },
    ],
  },
  {
    id: 'forensic', label: 'Forensic Intelligence', icon: '🔍', articles: [
      { id: 'for1', title: 'Benford\'s Law analysis', time: '4 min', content: 'Benford\'s Law predicts the distribution of first digits in financial data. Real data follows a specific pattern — fabricated data usually doesn\'t. AlecRae tests your transaction data against Benford\'s expected distribution and flags statistically significant deviations. This is used by auditors, the IRS, and forensic accountants worldwide.' },
      { id: 'for2', title: 'Ghost vendor detection', time: '3 min', content: 'AlecRae scans your vendor list for suspicious patterns: vendors with no ABN/EIN, duplicate bank accounts, vendors matching employee addresses, vendors with only round-number invoices, or vendors that only appear near period-end. Each flag gets a risk score. Review and investigate directly from the alert.' },
      { id: 'for3', title: 'Due diligence reports', time: '4 min', content: 'The 90-Minute Due Diligence module runs 5 forensic engines simultaneously: Benford\'s analysis, vendor audit, payment pattern analysis, journal entry testing, and trend anomaly detection. The output is a comprehensive report suitable for M&A, lending, or regulatory review.' },
    ],
  },
  {
    id: 'reporting', label: 'Reports', icon: '📈', articles: [
      { id: 'rep1', title: 'Standard financial reports', time: '3 min', content: 'AlecRae generates: Profit & Loss (by period, entity, or consolidated), Balance Sheet (current or comparative), Trial Balance, Cash Flow Statement, General Ledger, Aged Receivables, and Aged Payables. All reports can be exported to PDF or filtered by date range, entity, and account.' },
      { id: 'rep2', title: 'Financial Health Score', time: '4 min', content: 'Your Financial Health Score (0-100) is calculated from 5 dimensions: Liquidity (can you pay bills?), Profitability (are you making money?), Efficiency (are you managing resources well?), Growth (are you trending up?), and Risk (are there warning signs?). Track it over time and share it with lenders or investors.' },
      { id: 'rep3', title: 'Custom report building', time: '3 min', content: 'Use the Reports page to customise any standard report. Filter by date range, entity, account group, or specific accounts. Comparative reports show period-over-period changes. Export to PDF with your practice branding.' },
    ],
  },
];

const FAQ = [
  { q: 'How do I cancel my subscription?', a: 'Go to Settings > Billing > Cancel Plan. Your data is retained for 90 days after cancellation. You can reactivate anytime within that window.' },
  { q: 'Can I import data from Xero or QuickBooks?', a: 'Yes! Go to Settings > Import. We support CSV import and direct migration from Xero, QuickBooks Online, and MYOB. The migration tool maps your chart of accounts, contacts, and transaction history automatically.' },
  { q: 'Is my data secure?', a: 'AlecRae uses bank-level encryption (AES-256 at rest, TLS 1.3 in transit), role-based access control, immutable audit trails with hash-chain verification, and per-entity data isolation. We\'re SOC 2 Type II compliant.' },
  { q: 'What jurisdictions do you support?', a: 'Full support for Australia, New Zealand, United Kingdom, and United States — all in one subscription. Tax calculations, compliance calendars, payroll, and filing are tailored to each jurisdiction.' },
  { q: 'How accurate is the AI categorisation?', a: 'AlecRae achieves 95%+ accuracy on transaction categorisation, improving over time as it learns from your corrections. Competitors average 60-70%. Transactions below your confidence threshold go to the Review Queue.' },
  { q: 'Can I white-label AlecRae for my practice?', a: 'Enterprise plans include full white-label branding: your logo, colours, custom domain, and practice name throughout the platform. Go to Enterprise > Branding to configure.' },
];

export default function HelpCenter() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', message: '', priority: 'normal' });
  const [expandedFaq, setExpandedFaq] = useState(null);
  const toast = useToast();

  // Search across all articles
  const searchResults = search.length >= 2
    ? CATEGORIES.flatMap(c => c.articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase())
      ).map(a => ({ ...a, category: c.label })))
    : [];

  const handleSubmitTicket = () => {
    if (!contactForm.subject || !contactForm.message) { toast.error('Subject and message are required'); return; }
    toast.success('Support ticket submitted — we\'ll get back to you within 2 hours');
    setShowContact(false);
    setContactForm({ subject: '', message: '', priority: 'normal' });
  };

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="space-y-6 max-w-3xl">
        <button onClick={() => { setSelectedArticle(null); }}
          className="text-sm text-blue-600 hover:underline">&larr; Back to {selectedCategory?.label || 'Help Center'}</button>
        <div className="bg-white border rounded-xl p-6">
          <span className="text-xs text-blue-600 font-medium">{selectedCategory?.label}</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1 mb-2">{selectedArticle.title}</h1>
          <span className="text-xs text-gray-400">{selectedArticle.time} read</span>
          <div className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {selectedArticle.content}
          </div>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Was this article helpful?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => toast.success('Thanks for the feedback!')}
              className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Yes</button>
            <button onClick={() => { toast.info('Sorry to hear that. Opening support form.'); setShowContact(true); }}
              className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">No, I need more help</button>
          </div>
        </div>
      </div>
    );
  }

  // Category detail view
  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCategory(null)}
          className="text-sm text-blue-600 hover:underline">&larr; Back to Help Center</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{selectedCategory.icon} {selectedCategory.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{selectedCategory.articles.length} articles</p>
        </div>
        <div className="space-y-2">
          {selectedCategory.articles.map(article => (
            <button key={article.id} onClick={() => setSelectedArticle(article)}
              className="w-full text-left bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">{article.title}</h3>
                <span className="text-xs text-gray-400 ml-4 shrink-0">{article.time}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{article.content}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Main help center view
  return (
    <div className="space-y-6">
      <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border">
        <h1 className="text-2xl font-bold text-gray-900">How can we help?</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">Search our knowledge base or browse by category</p>
        <div className="max-w-lg mx-auto px-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search articles... (e.g. 'bank feed', 'BAS', 'payroll')"
            className="w-full border rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
        </div>
        {searchResults.length > 0 && (
          <div className="max-w-lg mx-auto px-4 mt-2 text-left">
            <div className="bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => {
                  const cat = CATEGORIES.find(c => c.label === r.category);
                  setSelectedCategory(cat);
                  setSelectedArticle(r);
                  setSearch('');
                }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0">
                  <p className="text-sm font-medium text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.category} &middot; {r.time}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {search.length >= 2 && searchResults.length === 0 && (
          <p className="text-sm text-gray-400 mt-2">No articles found. Try a different search term or contact support below.</p>
        )}
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat)}
            className="bg-white border rounded-xl p-4 text-left hover:shadow-md transition-shadow">
            <span className="text-2xl">{cat.icon}</span>
            <h3 className="text-sm font-semibold text-gray-900 mt-2">{cat.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{cat.articles.length} articles</p>
          </button>
        ))}
      </div>

      {/* Popular articles */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Popular Articles</h3>
        <div className="space-y-2">
          {[CATEGORIES[0].articles[0], CATEGORIES[1].articles[0], CATEGORIES[5].articles[2], CATEGORIES[3].articles[0], CATEGORIES[4].articles[2]].map(article => {
            const cat = CATEGORIES.find(c => c.articles.some(a => a.id === article.id));
            return (
              <button key={article.id} onClick={() => { setSelectedCategory(cat); setSelectedArticle(article); }}
                className="w-full text-left flex justify-between items-center py-2 border-b last:border-0 hover:bg-gray-50 px-2 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-800">{article.title}</p>
                  <p className="text-xs text-gray-400">{cat.label}</p>
                </div>
                <span className="text-xs text-gray-400">{article.time}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
        <div className="space-y-1">
          {FAQ.map((faq, i) => (
            <div key={i} className="border-b last:border-0">
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full text-left flex justify-between items-center py-3 hover:bg-gray-50 px-2 rounded">
                <span className="text-sm font-medium text-gray-800">{faq.q}</span>
                <span className="text-gray-400 ml-2">{expandedFaq === i ? '−' : '+'}</span>
              </button>
              {expandedFaq === i && (
                <p className="text-sm text-gray-600 px-2 pb-3">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact support */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
        <h3 className="font-bold text-lg">Still need help?</h3>
        <p className="text-sm text-blue-100 mt-1 mb-4">Our support team responds within 2 hours during business hours</p>
        <button onClick={() => setShowContact(true)}
          className="px-6 py-2.5 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50">
          Contact Support
        </button>
      </div>

      {/* Contact modal */}
      {showContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Contact Support</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input value={contactForm.subject} onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={contactForm.priority} onChange={e => setContactForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="low">Low — General question</option>
                  <option value="normal">Normal — Something isn't working as expected</option>
                  <option value="high">High — Blocking my work</option>
                  <option value="urgent">Urgent — Data or security issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Describe your issue in detail. Include steps to reproduce if applicable." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowContact(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmitTicket} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Submit Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
