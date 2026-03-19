import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReviewQueue from './pages/ReviewQueue';
import TaxEngine from './pages/TaxEngine';
import AskAstra from './pages/AskAstra';
import AgenticDashboard from './pages/AgenticDashboard';
import Specialists from './pages/Specialists';
import Toolkit from './pages/Toolkit';
import Reports from './pages/Reports';
import Clients from './pages/Clients';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/tax" element={<TaxEngine />} />
        <Route path="/specialists" element={<Specialists />} />
        <Route path="/toolkit" element={<Toolkit />} />
        <Route path="/ask" element={<AskAstra />} />
        <Route path="/agentic" element={<AgenticDashboard />} />
      </Routes>
    </Layout>
  );
}
