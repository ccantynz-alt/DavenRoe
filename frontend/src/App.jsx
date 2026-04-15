import { lazy, Suspense, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ConsentGate from './components/ConsentGate';

// ─── Lazy-loaded pages (route-based code splitting) ──────────────────────────
// Every page is dynamically imported so the initial bundle only contains
// the shell + whichever page the user navigates to first. Vite automatically
// creates separate chunks for each lazy() import.

// Auth & onboarding (loaded early, small)
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Core pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReviewQueue = lazy(() => import('./pages/ReviewQueue'));
const Clients = lazy(() => import('./pages/Clients'));
const Reports = lazy(() => import('./pages/Reports'));
const BankFeeds = lazy(() => import('./pages/BankFeeds'));
const Invoicing = lazy(() => import('./pages/Invoicing'));
const Documents = lazy(() => import('./pages/Documents'));
const Settings = lazy(() => import('./pages/Settings'));

// Tax & compliance
const TaxEngine = lazy(() => import('./pages/TaxEngine'));
const TaxFiling = lazy(() => import('./pages/TaxFiling'));
const ComplianceCalendar = lazy(() => import('./pages/ComplianceCalendar'));
const TaxAgent = lazy(() => import('./pages/TaxAgent'));
const TaxRulingsAgent = lazy(() => import('./pages/TaxRulingsAgent'));
const TaxAdvisorToolkit = lazy(() => import('./pages/TaxAdvisor'));

// AI & intelligence
const AskDavenRoe = lazy(() => import('./pages/AskDavenRoe'));
const AgenticDashboard = lazy(() => import('./pages/AgenticDashboard'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const FinancialHealthScore = lazy(() => import('./pages/FinancialHealthScore'));
const ForensicTools = lazy(() => import('./pages/ForensicTools'));

// Operations
const Payroll = lazy(() => import('./pages/Payroll'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Bills = lazy(() => import('./pages/Bills'));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));
const JournalEntries = lazy(() => import('./pages/JournalEntries'));
const BankReconciliation = lazy(() => import('./pages/BankReconciliation'));
const Quotes = lazy(() => import('./pages/Quotes'));
const RecurringTransactions = lazy(() => import('./pages/RecurringTransactions'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const CreditNotes = lazy(() => import('./pages/CreditNotes'));
const FixedAssets = lazy(() => import('./pages/FixedAssets'));

// Planning & projects
const Budgets = lazy(() => import('./pages/Budgets'));
const ProjectManagement = lazy(() => import('./pages/ProjectManagement'));
const ScenarioPlanning = lazy(() => import('./pages/ScenarioPlanning'));

// Tools & features
const Specialists = lazy(() => import('./pages/Specialists'));
const Toolkit = lazy(() => import('./pages/Toolkit'));
const SmartTools = lazy(() => import('./pages/SmartTools'));
const TimeTracker = lazy(() => import('./pages/TimeTracker'));
const LiveReceipt = lazy(() => import('./pages/LiveReceipt'));
const SpendMonitor = lazy(() => import('./pages/SpendMonitor'));
const EmailScanner = lazy(() => import('./pages/EmailScanner'));
const PeerReview = lazy(() => import('./pages/PeerReview'));

// Platform
const Enterprise = lazy(() => import('./pages/Enterprise'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'));
const Timeline = lazy(() => import('./pages/Timeline'));
const AccountantPack = lazy(() => import('./pages/AccountantPack'));
const EmailHarvester = lazy(() => import('./pages/EmailHarvester'));
const Incorporation = lazy(() => import('./pages/Incorporation'));
const DataImport = lazy(() => import('./pages/DataImport'));
const Billing = lazy(() => import('./pages/Billing'));
const PracticeDashboard = lazy(() => import('./pages/PracticeDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const PartnerProgram = lazy(() => import('./pages/PartnerProgram'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));

// Public / legal pages
const About = lazy(() => import('./pages/About'));
const SecurityPage = lazy(() => import('./pages/Security'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const AIDisclosure = lazy(() => import('./pages/AIDisclosure'));
const AcceptableUse = lazy(() => import('./pages/AcceptableUse'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Public marketing pages (no login required)
const CompareQuickBooks = lazy(() => import('./pages/compare/QuickBooks'));
const MigrateFromQuickBooks = lazy(() => import('./pages/migrate/FromQuickBooks'));
const CatchUp = lazy(() => import('./pages/CatchUp'));
const PenaltyCalculator = lazy(() => import('./pages/catchup/PenaltyCalculator'));

// ─── Loading fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-3">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('davenroe_onboarded') === 'true');
  const [showLogin, setShowLogin] = useState(false);
  const [publicPage, setPublicPage] = useState(null);

  // Public marketing pages — accessible to both logged-out and logged-in users
  // These take precedence over the auth gate below
  const publicMarketingPage = (() => {
    const p = location.pathname;
    if (p === '/compare/quickbooks') return <Suspense fallback={<PageLoader />}><CompareQuickBooks /></Suspense>;
    if (p === '/migrate/from-quickbooks') return <Suspense fallback={<PageLoader />}><MigrateFromQuickBooks /></Suspense>;
    if (p === '/catch-up') return <Suspense fallback={<PageLoader />}><CatchUp /></Suspense>;
    if (p === '/catchup/penalty-calculator') return <Suspense fallback={<PageLoader />}><PenaltyCalculator /></Suspense>;
    return null;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">DavenRoe</h1>
          <p className="text-gray-500">Initializing...</p>
        </div>
      </div>
    );
  }

  const goHome = () => { setPublicPage(null); setShowLogin(false); };

  // Public marketing pages (accessible always, logged in or out)
  if (publicMarketingPage) return publicMarketingPage;

  // Public pages (accessible without login)
  if (!user) {
    if (publicPage === 'about') return <Suspense fallback={<PageLoader />}><About onBack={goHome} /></Suspense>;
    if (publicPage === 'security') return <Suspense fallback={<PageLoader />}><SecurityPage onBack={goHome} /></Suspense>;
    if (publicPage === 'privacy') return <Suspense fallback={<PageLoader />}><Privacy onBack={goHome} /></Suspense>;
    if (publicPage === 'terms') return <Suspense fallback={<PageLoader />}><Terms onBack={goHome} /></Suspense>;
    if (publicPage === 'contact') return <Suspense fallback={<PageLoader />}><Contact onBack={goHome} /></Suspense>;

    if (showLogin) {
      return (
        <Suspense fallback={<PageLoader />}>
          <div>
            <Login />
            <div className="fixed top-4 left-4 z-50">
              <button
                onClick={goHome}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                &larr; Back to homepage
              </button>
            </div>
          </div>
        </Suspense>
      );
    }
    return <Suspense fallback={<PageLoader />}><Landing onLogin={() => setShowLogin(true)} onNavigate={setPublicPage} /></Suspense>;
  }

  if (!onboarded) {
    return (
      <Onboarding onComplete={() => {
        localStorage.setItem('davenroe_onboarded', 'true');
        setOnboarded(true);
      }} />
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/tax" element={<TaxEngine />} />
        <Route path="/banking" element={<BankFeeds />} />
        <Route path="/invoicing" element={<Invoicing />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/compliance" element={<ComplianceCalendar />} />
        <Route path="/portal" element={<ClientPortal />} />
        <Route path="/specialists" element={<Specialists />} />
        <Route path="/toolkit" element={<Toolkit />} />
        <Route path="/ask" element={<AskDavenRoe />} />
        <Route path="/agentic" element={<AgenticDashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/accountant-pack" element={<AccountantPack />} />
        <Route path="/email-harvester" element={<EmailHarvester />} />
        <Route path="/payroll" element={<ConsentGate feature="payroll"><Payroll /></ConsentGate>} />
        <Route path="/tax-filing" element={<ConsentGate feature="tax_filing"><TaxFiling /></ConsentGate>} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/financial-health" element={<ConsentGate feature="financial_health"><FinancialHealthScore /></ConsentGate>} />
        <Route path="/incorporate" element={<ConsentGate feature="incorporation"><Incorporation /></ConsentGate>} />
        <Route path="/email-scanner" element={<EmailScanner />} />
        <Route path="/tax-agent" element={<TaxAgent />} />
        <Route path="/peer-review" element={<PeerReview />} />
        <Route path="/smart-tools" element={<SmartTools />} />
        <Route path="/time-tracker" element={<TimeTracker />} />
        <Route path="/live-receipt" element={<LiveReceipt />} />
        <Route path="/live-receipt/:id" element={<LiveReceipt />} />
        <Route path="/spend-monitor" element={<ConsentGate feature="spend_monitor"><SpendMonitor /></ConsentGate>} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/journal-entries" element={<JournalEntries />} />
        <Route path="/bank-reconciliation" element={<BankReconciliation />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/recurring" element={<RecurringTransactions />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/credit-notes" element={<CreditNotes />} />
        <Route path="/fixed-assets" element={<FixedAssets />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/projects" element={<ProjectManagement />} />
        <Route path="/scenarios" element={<ScenarioPlanning />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/practice" element={<PracticeDashboard />} />
        <Route path="/forensic-tools" element={<ForensicTools />} />
        <Route path="/tax-advisor" element={<TaxAdvisorToolkit />} />
        <Route path="/tax-rulings" element={<TaxRulingsAgent />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/partners" element={<PartnerProgram />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/import" element={<DataImport />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/ai-disclosure" element={<AIDisclosure />} />
        <Route path="/acceptable-use" element={<AcceptableUse />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound onBack={() => window.location.href = '/'} />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}
