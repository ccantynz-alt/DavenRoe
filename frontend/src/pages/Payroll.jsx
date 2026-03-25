import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import LegalDisclaimer from '../components/LegalDisclaimer';

const PAY_FREQUENCIES = ['weekly', 'fortnightly', 'monthly'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'casual', 'contractor'];
const JURISDICTIONS = ['AU', 'NZ', 'GB', 'US'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
];

const SUPER_LABELS = { AU: 'Super Rate', NZ: 'KiwiSaver %', GB: 'Pension %', US: '401(k) %' };
const SUPER_DEFAULTS = { AU: 11.5, NZ: 3, GB: 5, US: 0 };

export default function Payroll() {
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [payRuns, setPayRuns] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPayRun, setSelectedPayRun] = useState(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/payroll/employees').then(r => r.data).catch(() => DEMO_EMPLOYEES),
      api.get('/payroll/pay-runs').then(r => r.data).catch(() => DEMO_PAY_RUNS),
    ]).then(([emp, pr]) => {
      setEmployees(Array.isArray(emp) ? emp : emp.employees || []);
      setPayRuns(Array.isArray(pr) ? pr : pr.pay_runs || []);
      setLoading(false);
    });
  }, []);

  const totalPayroll = employees.reduce((s, e) => s + (e.base_salary || 0), 0);
  const jurisdictions = [...new Set(employees.filter(e => e.is_active !== false).map(e => e.jurisdiction))];

  const processPayRun = async (runId) => {
    try {
      const res = await api.post(`/payroll/pay-runs/${runId}/process`);
      setSelectedPayRun(res.data);
      setPayRuns(prev => prev.map(pr => pr.id === runId ? { ...pr, ...res.data } : pr));
      toast.success(`Processed ${res.data.employees_processed} payslips`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process pay run');
    }
  };

  const approvePayRun = async (runId) => {
    try {
      const res = await api.post(`/payroll/pay-runs/${runId}/approve`);
      setPayRuns(prev => prev.map(pr => pr.id === runId ? { ...pr, ...res.data } : pr));
      setSelectedPayRun(null);
      toast.success('Pay run approved');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve pay run');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Payroll</h2>
          <p className="text-gray-500 mt-1">
            Manage employees, pay runs, and leave across {jurisdictions.length > 0 ? jurisdictions.join(', ') : 'AU, NZ, GB, US'}
          </p>
          <LegalDisclaimer type="payroll" className="mt-3" />
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.is_active !== false).length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Annual Payroll Cost</p>
          <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Jurisdictions</p>
          <div className="flex gap-1 mt-1">
            {(jurisdictions.length > 0 ? jurisdictions : ['AU', 'NZ', 'GB', 'US']).map(j => (
              <span key={j} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">{j}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['employees', 'pay-runs', 'leave'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedPayRun(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'pay-runs' ? 'Pay Runs' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Add Employee Form */}
      {showAdd && <AddEmployeeForm onCreated={(emp) => { setEmployees(prev => [emp, ...prev]); setShowAdd(false); toast.success('Employee added'); }} />}

      {/* Employee List */}
      {tab === 'employees' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Jurisdiction</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Salary</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contributions</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id || emp.employee_code} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{emp.full_name}</p>
                    <p className="text-xs text-gray-400">{emp.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{(emp.employment_type || '').replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{emp.jurisdiction}</span>
                    {emp.state && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs ml-1">{emp.state}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium">${(emp.base_salary || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {emp.jurisdiction === 'US' ? (
                      <span>{emp.retirement_rate ? `401(k) ${emp.retirement_rate}%` : 'No 401(k)'}</span>
                    ) : (
                      <span>{SUPER_LABELS[emp.jurisdiction]} {emp.superannuation_rate || SUPER_DEFAULTS[emp.jurisdiction]}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${emp.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {emp.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No employees yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pay Runs */}
      {tab === 'pay-runs' && !selectedPayRun && (
        <div className="space-y-4">
          <PayRunCreator onCreated={(pr) => { setPayRuns(prev => [pr, ...prev]); toast.success('Pay run created'); }} />
          {payRuns.map(pr => (
            <div key={pr.id} className="bg-white border rounded-xl p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div>
                <p className="font-semibold">{pr.pay_period_start} — {pr.pay_period_end}</p>
                <p className="text-sm text-gray-500">{pr.employee_count || pr.employees_processed || '—'} employees</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">${(pr.total_net || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Net pay</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  pr.status === 'paid' ? 'bg-green-100 text-green-700' :
                  pr.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                  pr.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{pr.status}</span>
                {pr.status === 'draft' && (
                  <button onClick={() => processPayRun(pr.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                    Process
                  </button>
                )}
                {pr.status === 'processing' && (
                  <button onClick={() => approvePayRun(pr.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                    Approve
                  </button>
                )}
                {pr.payslips && pr.payslips.length > 0 && (
                  <button onClick={() => setSelectedPayRun(pr)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
                    View Payslips
                  </button>
                )}
              </div>
            </div>
          ))}
          {payRuns.length === 0 && (
            <div className="bg-gray-50 border rounded-xl p-8 text-center">
              <p className="text-gray-500 font-medium">No pay runs yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first pay run above.</p>
            </div>
          )}
        </div>
      )}

      {/* Payslip Detail View */}
      {tab === 'pay-runs' && selectedPayRun && (
        <div>
          <button onClick={() => setSelectedPayRun(null)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-1">
            &larr; Back to pay runs
          </button>
          <div className="bg-white rounded-xl border p-6 mb-4">
            <h3 className="font-semibold text-lg mb-1">Pay Run: {selectedPayRun.pay_period_start} — {selectedPayRun.pay_period_end}</h3>
            <div className="flex gap-6 text-sm text-gray-500">
              <span>Gross: <strong className="text-gray-900">${(selectedPayRun.total_gross || 0).toLocaleString()}</strong></span>
              <span>Tax: <strong className="text-gray-900">${(selectedPayRun.total_tax || 0).toLocaleString()}</strong></span>
              <span>Super/401k: <strong className="text-gray-900">${(selectedPayRun.total_super || 0).toLocaleString()}</strong></span>
              <span>Net: <strong className="text-green-600">${(selectedPayRun.total_net || 0).toLocaleString()}</strong></span>
            </div>
          </div>
          <div className="space-y-3">
            {(selectedPayRun.payslips || []).map(slip => (
              <div key={slip.id} className="bg-white border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">{slip.employee_name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{slip.employee_code}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{slip.jurisdiction}</span>
                      {slip.breakdown?.state && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{slip.breakdown.state}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${slip.net_pay?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Net pay</p>
                  </div>
                </div>
                {/* Tax breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] uppercase text-gray-400">Gross</p>
                    <p className="text-sm font-semibold">${slip.gross_pay?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] uppercase text-gray-400">Tax</p>
                    <p className="text-sm font-semibold text-red-600">${slip.tax_withheld?.toLocaleString()}</p>
                  </div>
                  {slip.super_contribution > 0 && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] uppercase text-gray-400">{slip.jurisdiction === 'US' ? '401(k)' : slip.jurisdiction === 'NZ' ? 'KiwiSaver' : slip.jurisdiction === 'GB' ? 'Pension' : 'Super'}</p>
                      <p className="text-sm font-semibold">${slip.super_contribution?.toLocaleString()}</p>
                    </div>
                  )}
                  {Object.entries(slip.breakdown || {}).filter(([k]) => !['state', '401k_rate', 'super_rate', 'kiwisaver_rate', 'pension_rate'].includes(k)).map(([key, val]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] uppercase text-gray-400">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold">{typeof val === 'number' ? `$${val.toLocaleString()}` : val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave */}
      {tab === 'leave' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Annual Leave</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sick Leave</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Personal Leave</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Long Service</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const leave = emp.leave_balances || {};
                return (
                  <tr key={emp.id || emp.employee_code} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                    <td className="px-4 py-3">{leave.annual ?? 20} days</td>
                    <td className="px-4 py-3">{leave.sick ?? 10} days</td>
                    <td className="px-4 py-3">{leave.personal ?? 5} days</td>
                    <td className="px-4 py-3">{leave.long_service ?? 0} days</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddEmployeeForm({ onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    full_name: '', email: '', employee_code: '', employment_type: 'full_time',
    pay_frequency: 'monthly', base_salary: '', jurisdiction: 'AU',
    superannuation_rate: 11.5, state: '', retirement_rate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        base_salary: parseFloat(form.base_salary) || 0,
        superannuation_rate: parseFloat(form.superannuation_rate) || 0,
        start_date: new Date().toISOString().split('T')[0],
      };
      if (form.jurisdiction === 'US') {
        payload.state = form.state || null;
        payload.retirement_rate = form.retirement_rate ? parseFloat(form.retirement_rate) : null;
      }
      const res = await api.post('/payroll/employees', payload);
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const isUS = form.jurisdiction === 'US';

  return (
    <div className="bg-white border rounded-xl p-6 mb-6">
      <h3 className="font-semibold text-lg mb-4">Add Employee</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input placeholder="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm" required />
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm" required />
        <input placeholder="Employee Code" value={form.employee_code} onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm">
          {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select value={form.jurisdiction} onChange={e => {
          const j = e.target.value;
          setForm(f => ({ ...f, jurisdiction: j, superannuation_rate: SUPER_DEFAULTS[j], state: '', retirement_rate: '' }));
        }} className="border rounded-lg px-3 py-2 text-sm">
          {JURISDICTIONS.map(j => <option key={j} value={j}>{j === 'AU' ? 'Australia' : j === 'NZ' ? 'New Zealand' : j === 'GB' ? 'United Kingdom' : 'United States'}</option>)}
        </select>
        {isUS && (
          <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Select State</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <input placeholder="Base Salary" type="number" value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.pay_frequency} onChange={e => setForm(f => ({ ...f, pay_frequency: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm">
          {PAY_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {!isUS && (
          <input placeholder={SUPER_LABELS[form.jurisdiction] || 'Super Rate %'} type="number" step="0.5"
            value={form.superannuation_rate} onChange={e => setForm(f => ({ ...f, superannuation_rate: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
        )}
        {isUS && (
          <input placeholder="401(k) % (optional)" type="number" step="0.5" min="0" max="100"
            value={form.retirement_rate} onChange={e => setForm(f => ({ ...f, retirement_rate: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
        )}
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Adding...' : 'Add Employee'}
        </button>
      </form>
    </div>
  );
}

function PayRunCreator({ onCreated }) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    try {
      const res = await api.post('/payroll/pay-runs', { pay_period_start: start, pay_period_end: end });
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create pay run');
    } finally {
      setCreating(false);
    }
  };

  return (
    <button onClick={create} disabled={creating}
      className="w-full py-3 border-2 border-dashed rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors mb-4">
      {creating ? 'Creating...' : '+ Create Pay Run for Current Period'}
    </button>
  );
}

const DEMO_EMPLOYEES = [
  { id: '1', full_name: 'Sarah Chen', email: 'sarah@example.com', employee_code: 'EMP001', employment_type: 'full_time', jurisdiction: 'AU', base_salary: 95000, superannuation_rate: 11.5, is_active: true, leave_balances: { annual: 18, sick: 8, personal: 4, long_service: 0 } },
  { id: '2', full_name: 'James Wilson', email: 'james@example.com', employee_code: 'EMP002', employment_type: 'full_time', jurisdiction: 'AU', base_salary: 82000, superannuation_rate: 11.5, is_active: true, leave_balances: { annual: 22, sick: 10, personal: 5, long_service: 2 } },
  { id: '3', full_name: 'Maria Lopez', email: 'maria@example.com', employee_code: 'EMP003', employment_type: 'part_time', jurisdiction: 'NZ', base_salary: 55000, superannuation_rate: 3, is_active: true, leave_balances: { annual: 15, sick: 5, personal: 3, long_service: 0 } },
  { id: '4', full_name: 'David Kim', email: 'david@example.com', employee_code: 'EMP004', employment_type: 'full_time', jurisdiction: 'US', base_salary: 120000, superannuation_rate: 0, state: 'CA', retirement_rate: 6, is_active: true, leave_balances: { annual: 10, sick: 5, personal: 0, long_service: 0 } },
  { id: '5', full_name: 'Oliver Hughes', email: 'oliver@example.com', employee_code: 'EMP005', employment_type: 'full_time', jurisdiction: 'GB', base_salary: 52000, superannuation_rate: 5, is_active: true, leave_balances: { annual: 28, sick: 0, personal: 0, long_service: 0 } },
];

const DEMO_PAY_RUNS = [
  { id: '1', pay_period_start: '2026-03-01', pay_period_end: '2026-03-31', status: 'paid', total_gross: 33708, total_tax: 8127, total_super: 3172, total_net: 22409, employee_count: 5 },
  { id: '2', pay_period_start: '2026-02-01', pay_period_end: '2026-02-28', status: 'paid', total_gross: 33708, total_tax: 8127, total_super: 3172, total_net: 22409, employee_count: 5 },
];
