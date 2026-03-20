import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
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

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Astra</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
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
