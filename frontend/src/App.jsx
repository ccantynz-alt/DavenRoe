import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReviewQueue from './pages/ReviewQueue';
import TaxEngine from './pages/TaxEngine';
import AskAstra from './pages/AskAstra';
import Specialists from './pages/Specialists';
import Toolkit from './pages/Toolkit';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/tax" element={<TaxEngine />} />
        <Route path="/specialists" element={<Specialists />} />
        <Route path="/toolkit" element={<Toolkit />} />
        <Route path="/ask" element={<AskAstra />} />
      </Routes>
    </Layout>
  );
}
