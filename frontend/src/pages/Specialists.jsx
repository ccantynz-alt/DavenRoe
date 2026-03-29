import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const SPEC_ICONS = {
  tax: '$', audit: '>', management: '~', forensic: '!',
  insolvency: '#', trust_estate: '&', nfp: '+', superannuation: '%',
  payroll: '@', government: '*', esg: '^', advisory: '?',
};

const SPEC_COLORS = {
  tax: 'blue', audit: 'purple', management: 'emerald', forensic: 'pink',
  insolvency: 'red', trust_estate: 'amber', nfp: 'teal', superannuation: 'orange',
  payroll: 'cyan', government: 'slate', esg: 'green', advisory: 'indigo',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function Specialists() {
  const [specs, setSpecs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [totalAutomations, setTotalAutomations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/v1/specialists/')
      .then((res) => {
        setSpecs(res.data.specializations || []);
        setTotalAutomations(res.data.total_automations || 0);
        setLoading(false);
      })
      .catch(() => {
        setSpecs(FALLBACK_SPECS);
        setTotalAutomations(90);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h2 className="text-3xl font-bold">Specialist Toolkits</h2>
        <p className="text-gray-500 mt-1">
          Heavy-lifting automation for every type of accountant —{' '}
          <span className="font-semibold text-astra-600">{totalAutomations} automations</span> across{' '}
          <span className="font-semibold text-astra-600">{specs.length} specializations</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specialization Grid */}
        <motion.div
          className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {specs.map((spec) => (
            <motion.div key={spec.id} variants={itemVariants}>
              <Card
                as="button"
                onClick={() => setSelected(spec)}
                className={cn(
                  'text-left w-full p-5 cursor-pointer transition-all',
                  selected?.id === spec.id
                    ? 'border-astra-500 ring-2 ring-astra-200'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl font-mono text-gray-300">
                    {SPEC_ICONS[spec.id] || '*'}
                  </span>
                  <Badge variant="default" className="bg-astra-50 text-astra-700 border-transparent text-xs">
                    {spec.heavy_lifting_count} tools
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-1">{spec.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{spec.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {spec.certifications?.slice(0, 3).map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-[10px] px-1.5 py-0.5 font-normal">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Card className="p-6 sticky top-8">
                  <CardTitle className="text-xl font-bold mb-2">{selected.title}</CardTitle>
                  <CardDescription className="mb-6">{selected.description}</CardDescription>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Pain Points We Solve</h4>
                    <ul className="space-y-2">
                      {selected.pain_points?.map((pp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-red-400 mt-0.5 shrink-0">x</span>
                          {pp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Heavy Lifting ({selected.heavy_lifting?.length} automations)
                    </h4>
                    <ul className="space-y-2">
                      {selected.heavy_lifting?.map((hl, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5 shrink-0">+</span>
                          {hl}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {selected.certifications?.map((cert) => (
                        <Badge key={cert} variant="default" className="bg-astra-50 text-astra-700 border-transparent">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-dashed border-gray-300 bg-gray-50 p-8 text-center sticky top-8">
                  <p className="text-gray-400 text-lg mb-2">Select a specialization</p>
                  <p className="text-gray-400 text-sm">Click any card to see the full toolkit</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Fallback data if API isn't running
const FALLBACK_SPECS = [
  { id: 'tax', title: 'Tax Accountant', description: 'Tax returns, planning, and compliance', certifications: ['CPA', 'CA', 'EA'], pain_points: ['Multi-jurisdiction calculations', 'Treaty tracking'], heavy_lifting: ['Auto-calculate tax brackets', 'Draft BAS/GST returns', 'Apply treaties automatically'], heavy_lifting_count: 7 },
  { id: 'audit', title: 'Audit & Assurance', description: 'External/internal audit and assurance', certifications: ['CPA', 'CA', 'CIA'], pain_points: ['Sampling', 'Journal entry testing'], heavy_lifting: ['Statistical sampling', 'Journal entry fraud testing', 'Depreciation recalculation'], heavy_lifting_count: 8 },
  { id: 'management', title: 'Management Accountant', description: 'Budgeting, variance analysis, cost allocation', certifications: ['CMA', 'CGMA'], pain_points: ['Budget vs actuals', 'Cost allocation'], heavy_lifting: ['Variance analysis', 'Cost allocation', 'Break-even analysis'], heavy_lifting_count: 7 },
  { id: 'forensic', title: 'Forensic Accountant', description: 'Fraud investigation and M&A due diligence', certifications: ['CFF', 'CFE'], pain_points: ['Weeks of manual analysis', 'Benford\'s in Excel'], heavy_lifting: ['Benford\'s Law', 'Anomaly detection', '90-min audit'], heavy_lifting_count: 8 },
  { id: 'insolvency', title: 'Insolvency & Restructuring', description: 'Liquidation, administration, debt restructuring', certifications: ['RITPA', 'CIRP'], pain_points: ['Solvency testing', 'Creditor waterfall'], heavy_lifting: ['Solvency tests', 'Creditor waterfall', 'Voidable transaction scanner'], heavy_lifting_count: 8 },
  { id: 'trust_estate', title: 'Trust & Estate', description: 'Trust distributions, estate administration', certifications: ['TEP', 'CPA'], pain_points: ['Distribution calculations', 'Income vs capital'], heavy_lifting: ['Trust distributions', 'Estate CGT', 'Beneficiary reporting'], heavy_lifting_count: 8 },
  { id: 'nfp', title: 'Not-for-Profit', description: 'Charity and NFP accounting', certifications: ['CPA', 'CA'], pain_points: ['Grant acquittals', 'Fund tracking'], heavy_lifting: ['Grant acquittal reports', 'Fund tracking', 'DGR compliance'], heavy_lifting_count: 8 },
  { id: 'superannuation', title: 'Superannuation / Pension', description: 'SMSF, KiwiSaver, pension fund accounting', certifications: ['SMSF Specialist'], pain_points: ['SMSF compliance', 'Contribution caps'], heavy_lifting: ['SMSF compliance', 'Contribution tracking', 'Pension drawdown'], heavy_lifting_count: 8 },
  { id: 'payroll', title: 'Payroll Specialist', description: 'Payroll processing and employment tax', certifications: ['CPP', 'CPA'], pain_points: ['Multi-jurisdiction withholding', 'Termination calcs'], heavy_lifting: ['Termination pay calculator', 'Leave accruals', 'STP preparation'], heavy_lifting_count: 10 },
  { id: 'government', title: 'Government / Public Sector', description: 'Public sector reporting and fund accounting', certifications: ['CGFM', 'CPA'], pain_points: ['Fund accounting', 'Budget compliance'], heavy_lifting: ['Fund segregation', 'Budget vs actual', 'Grant compliance'], heavy_lifting_count: 8 },
  { id: 'esg', title: 'ESG / Sustainability', description: 'Carbon accounting and ESG reporting', certifications: ['CPA', 'CA'], pain_points: ['Scope 1/2/3 calculations', 'ISSB compliance'], heavy_lifting: ['Carbon calculator', 'Spend-based emissions', 'ESG metrics'], heavy_lifting_count: 8 },
  { id: 'advisory', title: 'Business Advisory / vCFO', description: 'Strategic advice, forecasting, board reporting', certifications: ['CPA', 'CFA', 'MBA'], pain_points: ['Financial models', 'Cash flow forecasting'], heavy_lifting: ['Board reporting packs', 'Cash flow forecast', 'Business valuation'], heavy_lifting_count: 9 },
];
