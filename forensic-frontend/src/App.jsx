import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BenfordsAnalysis from './pages/BenfordsAnalysis';
import DueDiligence from './pages/DueDiligence';
import VendorAudit from './pages/VendorAudit';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/benfords" element={<BenfordsAnalysis />} />
        <Route path="/due-diligence" element={<DueDiligence />} />
        <Route path="/vendors" element={<VendorAudit />} />
      </Routes>
    </Layout>
  );
}
