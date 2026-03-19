import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReviewQueue from './pages/ReviewQueue';
import TaxEngine from './pages/TaxEngine';
import AskAstra from './pages/AskAstra';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/tax" element={<TaxEngine />} />
        <Route path="/ask" element={<AskAstra />} />
      </Routes>
    </Layout>
  );
}
