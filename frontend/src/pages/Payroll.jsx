import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const PAY_FREQUENCIES = ['weekly', 'fortnightly', 'monthly'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'casual', 'contractor'];
const JURISDICTIONS = ['AU', 'NZ', 'GB', 'US'];

export default function Payroll() {
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [payRuns, setPayRuns] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Payroll</h2>
          <p className="text-gray-500 mt-1">Manage employees, pay runs, and leave</p>
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
          <p className="text-xs text-gray-500">Pay Runs This Year</p>
          <p className="text-2xl font-bold">{payRuns.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['employees', 'pay-runs', 'leave'].map(t => (
          <button key={t} onClick={() => setTab(t)}
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Super Rate</th>
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
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{emp.jurisdiction}</span></td>
                  <td className="px-4 py-3 font-medium">${(emp.base_salary || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.superannuation_rate || 11.5}%</td>
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
      {tab === 'pay-runs' && (
        <div className="space-y-4">
          <PayRunCreator onCreated={(pr) => { setPayRuns(prev => [pr, ...prev]); toast.success('Pay run created'); }} />
          {payRuns.map(pr => (
            <div key={pr.id} className="bg-white border rounded-xl p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div>
                <p className="font-semibold">{pr.pay_period_start} — {pr.pay_period_end}</p>
                <p className="text-sm text-gray-500">{pr.employee_count || '?'} employees</p>
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
    pay_frequency: 'monthly', base_salary: '', jurisdiction: 'AU', superannuation_rate: 11.5,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/payroll/employees', {
        ...form,
        base_salary: parseFloat(form.base_salary) || 0,
        start_date: new Date().toISOString().split('T')[0],
      });
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

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
        <select value={form.jurisdiction} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm">
          {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <input placeholder="Base Salary" type="number" value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.pay_frequency} onChange={e => setForm(f => ({ ...f, pay_frequency: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm">
          {PAY_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
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
  { id: '4', full_name: 'David Kim', email: 'david@example.com', employee_code: 'EMP004', employment_type: 'contractor', jurisdiction: 'US', base_salary: 120000, superannuation_rate: 0, is_active: true, leave_balances: { annual: 0, sick: 0, personal: 0, long_service: 0 } },
];

const DEMO_PAY_RUNS = [
  { id: '1', pay_period_start: '2024-03-01', pay_period_end: '2024-03-31', status: 'paid', total_gross: 29417, total_tax: 6854, total_super: 2934, total_net: 19629, employee_count: 4 },
  { id: '2', pay_period_start: '2024-02-01', pay_period_end: '2024-02-29', status: 'paid', total_gross: 29417, total_tax: 6854, total_super: 2934, total_net: 19629, employee_count: 4 },
];
