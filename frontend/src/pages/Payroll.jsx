import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';

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

const JURISDICTION_LABELS = { AU: 'Australia', NZ: 'New Zealand', GB: 'United Kingdom', US: 'United States' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function payRunStatusVariant(status) {
  switch (status) {
    case 'paid': return 'success';
    case 'approved': return 'default';
    case 'processing': return 'warning';
    default: return 'secondary';
  }
}

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold">Payroll</h2>
          <p className="text-gray-500 mt-1">
            Manage employees, pay runs, and leave across {jurisdictions.length > 0 ? jurisdictions.join(', ') : 'AU, NZ, GB, US'}
          </p>
          <LegalDisclaimer type="payroll" className="mt-3" />
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add Employee'}
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold">{employees.length}</p>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.is_active !== false).length}</p>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Annual Payroll Cost</p>
            <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Jurisdictions</p>
            <div className="flex gap-1 mt-1">
              {(jurisdictions.length > 0 ? jurisdictions : ['AU', 'NZ', 'GB', 'US']).map(j => (
                <Badge key={j} variant="default" className="bg-indigo-50 text-indigo-600 border-transparent">{j}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(val) => { setTab(val); setSelectedPayRun(null); }} className="mb-6">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="pay-runs">Pay Runs</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        {/* Add Employee Form */}
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <AddEmployeeForm onCreated={(emp) => { setEmployees(prev => [emp, ...prev]); setShowAdd(false); toast.success('Employee added'); }} />
          </motion.div>
        )}

        {/* Employees Tab */}
        <TabsContent value="employees">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => (
                    <TableRow key={emp.id || emp.employee_code}>
                      <TableCell>
                        <p className="font-medium">{emp.full_name}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </TableCell>
                      <TableCell className="capitalize text-gray-500">{(emp.employment_type || '').replace('_', ' ')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">{emp.jurisdiction}</Badge>
                          {emp.state && <Badge className="bg-blue-50 text-blue-600 border-transparent">{emp.state}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${(emp.base_salary || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-gray-500">
                        {emp.jurisdiction === 'US' ? (
                          <span>{emp.retirement_rate ? `401(k) ${emp.retirement_rate}%` : 'No 401(k)'}</span>
                        ) : (
                          <span>{SUPER_LABELS[emp.jurisdiction]} {emp.superannuation_rate || SUPER_DEFAULTS[emp.jurisdiction]}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.is_active !== false ? 'success' : 'secondary'}>
                          {emp.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">No employees yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Pay Runs Tab */}
        <TabsContent value="pay-runs">
          {!selectedPayRun && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <PayRunCreator onCreated={(pr) => { setPayRuns(prev => [pr, ...prev]); toast.success('Pay run created'); }} />
              </motion.div>
              {payRuns.map(pr => (
                <motion.div key={pr.id} variants={itemVariants}>
                  <Card className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pr.pay_period_start} — {pr.pay_period_end}</p>
                      <p className="text-sm text-gray-500">{pr.employee_count || pr.employees_processed || '—'} employees</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">${(pr.total_net || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Net pay</p>
                      </div>
                      <Badge variant={payRunStatusVariant(pr.status)}>{pr.status}</Badge>
                      {pr.status === 'draft' && (
                        <Button size="sm" onClick={() => processPayRun(pr.id)}>
                          Process
                        </Button>
                      )}
                      {pr.status === 'processing' && (
                        <Button size="sm" variant="success" onClick={() => approvePayRun(pr.id)}>
                          Approve
                        </Button>
                      )}
                      {pr.payslips && pr.payslips.length > 0 && (
                        <Button size="sm" variant="secondary" onClick={() => setSelectedPayRun(pr)}>
                          View Payslips
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
              {payRuns.length === 0 && (
                <motion.div variants={itemVariants}>
                  <Card className="p-8 text-center bg-gray-50">
                    <p className="text-gray-500 font-medium">No pay runs yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first pay run above.</p>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Payslip Detail View */}
          {selectedPayRun && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPayRun(null)} className="mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to pay runs
              </Button>
              <Card className="p-6 mb-4">
                <CardTitle className="mb-2">Pay Run: {selectedPayRun.pay_period_start} — {selectedPayRun.pay_period_end}</CardTitle>
                <div className="flex gap-6 text-sm text-gray-500">
                  <span>Gross: <strong className="text-gray-900">${(selectedPayRun.total_gross || 0).toLocaleString()}</strong></span>
                  <span>Tax: <strong className="text-gray-900">${(selectedPayRun.total_tax || 0).toLocaleString()}</strong></span>
                  <span>Super/401k: <strong className="text-gray-900">${(selectedPayRun.total_super || 0).toLocaleString()}</strong></span>
                  <span>Net: <strong className="text-green-600">${(selectedPayRun.total_net || 0).toLocaleString()}</strong></span>
                </div>
              </Card>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {(selectedPayRun.payslips || []).map(slip => (
                  <motion.div key={slip.id} variants={itemVariants}>
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{slip.employee_name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{slip.employee_code}</Badge>
                            <Badge variant="secondary">{slip.jurisdiction}</Badge>
                            {slip.breakdown?.state && (
                              <Badge className="bg-blue-50 text-blue-600 border-transparent">{slip.breakdown.state}</Badge>
                            )}
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
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Annual Leave</TableHead>
                    <TableHead>Sick Leave</TableHead>
                    <TableHead>Personal Leave</TableHead>
                    <TableHead>Long Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => {
                    const leave = emp.leave_balances || {};
                    return (
                      <TableRow key={emp.id || emp.employee_code}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{leave.annual ?? 20} days</TableCell>
                        <TableCell>{leave.sick ?? 10} days</TableCell>
                        <TableCell>{leave.personal ?? 5} days</TableCell>
                        <TableCell>{leave.long_service ?? 0} days</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
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
    <Card>
      <CardHeader>
        <CardTitle>Add Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Full Name"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            required
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            placeholder="Employee Code"
            value={form.employee_code}
            onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))}
          />
          <Select
            value={form.employment_type}
            onValueChange={val => setForm(f => ({ ...f, employment_type: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Employment Type" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.jurisdiction}
            onValueChange={val => {
              setForm(f => ({ ...f, jurisdiction: val, superannuation_rate: SUPER_DEFAULTS[val], state: '', retirement_rate: '' }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map(j => (
                <SelectItem key={j} value={j}>{JURISDICTION_LABELS[j]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isUS && (
            <Select
              value={form.state || '_placeholder'}
              onValueChange={val => setForm(f => ({ ...f, state: val === '_placeholder' ? '' : val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            placeholder="Base Salary"
            type="number"
            value={form.base_salary}
            onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))}
          />
          <Select
            value={form.pay_frequency}
            onValueChange={val => setForm(f => ({ ...f, pay_frequency: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pay Frequency" />
            </SelectTrigger>
            <SelectContent>
              {PAY_FREQUENCIES.map(freq => (
                <SelectItem key={freq} value={freq}>{freq}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isUS && (
            <Input
              placeholder={SUPER_LABELS[form.jurisdiction] || 'Super Rate %'}
              type="number"
              step="0.5"
              value={form.superannuation_rate}
              onChange={e => setForm(f => ({ ...f, superannuation_rate: e.target.value }))}
            />
          )}
          {isUS && (
            <Input
              placeholder="401(k) % (optional)"
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={form.retirement_rate}
              onChange={e => setForm(f => ({ ...f, retirement_rate: e.target.value }))}
            />
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Employee'}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <Button
      variant="outline"
      onClick={create}
      disabled={creating}
      className="w-full py-3 border-2 border-dashed text-gray-500 hover:text-indigo-600 hover:border-indigo-300"
    >
      {creating ? 'Creating...' : '+ Create Pay Run for Current Period'}
    </Button>
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
