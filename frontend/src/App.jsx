import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

function AppRoutes() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('astra_onboarded') === 'true');
  const [showLogin, setShowLogin] = useState(false);

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

  // Not logged in: show cinematic landing page (or login form)
  if (!user) {
    if (showLogin) {
      return (
        <div>
          <Login />
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setShowLogin(false)}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              &larr; Back to homepage
            </button>
          </div>
        </div>
      );
    }
    return <Landing onLogin={() => setShowLogin(true)} />;
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
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
