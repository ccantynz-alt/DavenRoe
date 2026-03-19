import { useState } from 'react';
import axios from 'axios';

const TOOLS = [
  {
    id: 'gst', category: 'Everyday', title: 'GST / VAT Calculator',
    description: 'Inclusive ↔ exclusive for AU, NZ, GB, US',
    fields: [
      { name: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'select', options: ['AU', 'NZ', 'GB', 'US'] },
      { name: 'is_inclusive', label: 'Amount is inclusive?', type: 'checkbox' },
    ],
    endpoint: '/api/v1/toolkit/gst/calculate',
  },
  {
    id: 'taxid', category: 'Everyday', title: 'Tax ID Validator',
    description: 'Check ABN, ACN, TFN, EIN, IRD, NZBN, UTR',
    fields: [
      { name: 'tax_id', label: 'Tax ID Number', type: 'text', placeholder: '51 824 753 556' },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'select', options: ['AU', 'NZ', 'GB', 'US'] },
    ],
    endpoint: '/api/v1/toolkit/validate/tax-id',
  },
  {
    id: 'currency', category: 'Everyday', title: 'Currency Converter',
    description: 'Quick conversion between 12 currencies',
    fields: [
      { name: 'amount', label: 'Amount', type: 'number', placeholder: '1000' },
      { name: 'from', label: 'From', type: 'select', options: ['USD', 'AUD', 'NZD', 'GBP', 'EUR', 'CAD', 'JPY', 'SGD'] },
      { name: 'to', label: 'To', type: 'select', options: ['AUD', 'USD', 'NZD', 'GBP', 'EUR', 'CAD', 'JPY', 'SGD'] },
    ],
    endpoint: '/api/v1/toolkit/currency/convert',
  },
  {
    id: 'payment-due', category: 'Everyday', title: 'Payment Due Date',
    description: 'When is this invoice due? (skips weekends & holidays)',
    fields: [
      { name: 'invoice_date', label: 'Invoice Date', type: 'date' },
      { name: 'terms_days', label: 'Terms (days)', type: 'number', placeholder: '30' },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'select', options: ['AU', 'NZ', 'GB', 'US'] },
    ],
    endpoint: '/api/v1/toolkit/dates/payment-due',
  },
  {
    id: 'compound', category: 'Calculators', title: 'Compound Interest',
    description: 'Growth calculator with full schedule',
    fields: [
      { name: 'principal', label: 'Principal', type: 'number', placeholder: '10000' },
      { name: 'annual_rate', label: 'Annual Rate (%)', type: 'number', placeholder: '5' },
      { name: 'years', label: 'Years', type: 'number', placeholder: '10' },
    ],
    endpoint: '/api/v1/toolkit/calc/compound-interest',
  },
  {
    id: 'loan', category: 'Calculators', title: 'Loan Amortization',
    description: 'Payment schedule with principal/interest split',
    fields: [
      { name: 'principal', label: 'Loan Amount', type: 'number', placeholder: '500000' },
      { name: 'annual_rate', label: 'Annual Rate (%)', type: 'number', placeholder: '6.5' },
      { name: 'years', label: 'Term (years)', type: 'number', placeholder: '30' },
    ],
    endpoint: '/api/v1/toolkit/calc/loan',
  },
  {
    id: 'depreciation', category: 'Calculators', title: 'Depreciation',
    description: 'Quick depreciation — annual, monthly, daily',
    fields: [
      { name: 'cost', label: 'Cost', type: 'number', placeholder: '50000' },
      { name: 'salvage', label: 'Salvage Value', type: 'number', placeholder: '5000' },
      { name: 'life_years', label: 'Useful Life (years)', type: 'number', placeholder: '5' },
      { name: 'method', label: 'Method', type: 'select', options: ['straight_line', 'diminishing_value'] },
    ],
    endpoint: '/api/v1/toolkit/calc/depreciation',
  },
  {
    id: 'early-payment', category: 'Calculators', title: 'Early Payment Discount',
    description: 'Should you take 2/10 net 30? (Annualized cost)',
    fields: [
      { name: 'amount', label: 'Invoice Amount', type: 'number', placeholder: '10000' },
      { name: 'discount_pct', label: 'Discount (%)', type: 'number', placeholder: '2' },
      { name: 'discount_days', label: 'Discount Days', type: 'number', placeholder: '10' },
      { name: 'net_days', label: 'Net Days', type: 'number', placeholder: '30' },
    ],
    endpoint: '/api/v1/toolkit/invoice/early-payment',
  },
  {
    id: 'ratios', category: 'Calculators', title: 'Financial Ratios',
    description: 'Current, quick, D/E, margins — instant',
    fields: [
      { name: 'current_assets', label: 'Current Assets', type: 'number', placeholder: '500000' },
      { name: 'current_liabilities', label: 'Current Liabilities', type: 'number', placeholder: '300000' },
      { name: 'inventory', label: 'Inventory', type: 'number', placeholder: '100000' },
      { name: 'cash', label: 'Cash', type: 'number', placeholder: '150000' },
      { name: 'total_assets', label: 'Total Assets', type: 'number', placeholder: '1000000' },
      { name: 'total_liabilities', label: 'Total Liabilities', type: 'number', placeholder: '400000' },
      { name: 'equity', label: 'Equity', type: 'number', placeholder: '600000' },
      { name: 'revenue', label: 'Revenue', type: 'number', placeholder: '1200000' },
      { name: 'net_income', label: 'Net Income', type: 'number', placeholder: '120000' },
    ],
    endpoint: '/api/v1/toolkit/calc/ratios',
  },
];

export default function Toolkit() {
  const [activeTool, setActiveTool] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [...new Set(TOOLS.map((t) => t.category))];

  const handleRun = async (tool) => {
    setLoading(true);
    setResult(null);
    try {
      const payload = { ...formData };
      // Convert numeric fields
      tool.fields.forEach((f) => {
        if (f.type === 'number' && payload[f.name]) {
          payload[f.name] = Number(payload[f.name]);
        }
        if (f.type === 'checkbox') {
          payload[f.name] = !!payload[f.name];
        }
      });
      const res = await axios.post(tool.endpoint, payload);
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.detail || err.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Toolkit</h2>
        <p className="text-gray-500 mt-1">
          Everyday tools for every accountant and bookkeeper. No setup required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tool List */}
        <div className="lg:col-span-1 space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
                {cat}
              </h3>
              <div className="space-y-1">
                {TOOLS.filter((t) => t.category === cat).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool);
                      setFormData({});
                      setResult(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTool?.id === tool.id
                        ? 'bg-astra-50 text-astra-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{tool.title}</div>
                    <div className="text-xs text-gray-400">{tool.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tool Panel */}
        <div className="lg:col-span-2">
          {activeTool ? (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-xl font-bold mb-1">{activeTool.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{activeTool.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {activeTool.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={formData[field.name] || field.options[0]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={!!formData[field.name]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                        className="mt-1"
                      />
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleRun(activeTool)}
                disabled={loading}
                className="px-6 py-2 bg-astra-600 text-white rounded-lg text-sm font-medium hover:bg-astra-700 disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </button>

              {result && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                  {result.error ? (
                    <p className="text-red-600 text-sm">{result.error}</p>
                  ) : (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">Select a tool</p>
              <p className="text-gray-400 text-sm">Pick any tool from the sidebar to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
