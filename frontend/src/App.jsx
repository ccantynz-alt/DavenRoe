import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ReviewQueue from './pages/ReviewQueue';
import TaxEngine from './pages/TaxEngine';
import AskAstra from './pages/AskAstra';
import AgenticDashboard from './pages/AgenticDashboard';
import Specialists from './pages/Specialists';
import Toolkit from './pages/Toolkit';
import Reports from './pages/Reports';
import Clients from './pages/Clients';
import BankFeeds from './pages/BankFeeds';
import Invoicing from './pages/Invoicing';
import Documents from './pages/Documents';
import ComplianceCalendar from './pages/ComplianceCalendar';
import ClientPortal from './pages/ClientPortal';
import Inventory from './pages/Inventory';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import About from './pages/About';
import SecurityPage from './pages/Security';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Enterprise from './pages/Enterprise';
import ActivityFeed from './pages/ActivityFeed';
import Payroll from './pages/Payroll';
import TaxFiling from './pages/TaxFiling';
import Marketplace from './pages/Marketplace';
import AIInsights from './pages/AIInsights';
import FinancialHealthScore from './pages/FinancialHealthScore';
import Incorporation from './pages/Incorporation';
import EmailScanner from './pages/EmailScanner';
import TaxAgent from './pages/TaxAgent';
import PeerReview from './pages/PeerReview';
import SmartTools from './pages/SmartTools';
import TimeTracker from './pages/TimeTracker';
import NotFound from './pages/NotFound';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('astra_onboarded') === 'true');
  const [showLogin, setShowLogin] = useState(false);
  const [publicPage, setPublicPage] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Astra</h1>
          <p className="text-gray-500">Initializing...</p>
        </div>
      </div>
    );
  }

  const goHome = () => { setPublicPage(null); setShowLogin(false); };

  // Public pages (accessible without login)
  if (!user) {
    if (publicPage === 'about') return <About onBack={goHome} />;
    if (publicPage === 'security') return <SecurityPage onBack={goHome} />;
    if (publicPage === 'privacy') return <Privacy onBack={goHome} />;
    if (publicPage === 'terms') return <Terms onBack={goHome} />;
    if (publicPage === 'contact') return <Contact onBack={goHome} />;

    if (showLogin) {
      return (
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
      );
    }
    return <Landing onLogin={() => setShowLogin(true)} onNavigate={setPublicPage} />;
  }

  if (!onboarded) {
    return (
      <Onboarding onComplete={() => {
        localStorage.setItem('astra_onboarded', 'true');
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
        <Route path="/ask" element={<AskAstra />} />
        <Route path="/agentic" element={<AgenticDashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/tax-filing" element={<TaxFiling />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/financial-health" element={<FinancialHealthScore />} />
        <Route path="/incorporate" element={<Incorporation />} />
        <Route path="/email-scanner" element={<EmailScanner />} />
        <Route path="/tax-agent" element={<TaxAgent />} />
        <Route path="/peer-review" element={<PeerReview />} />
        <Route path="/smart-tools" element={<SmartTools />} />
        <Route path="/time-tracker" element={<TimeTracker />} />
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
