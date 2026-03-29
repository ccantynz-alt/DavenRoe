import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/components/Toast';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-50 border-red-300', badge: 'destructive', icon: '\u{1F6A8}', text: 'text-red-700' },
  high: { bg: 'bg-orange-50 border-orange-300', badge: 'warning', icon: '\u26A0\uFE0F', text: 'text-orange-700' },
  warning: { bg: 'bg-amber-50 border-amber-200', badge: 'warning', icon: '\u{1F50D}', text: 'text-amber-700' },
  info: { bg: 'bg-blue-50 border-blue-200', badge: 'secondary', icon: '\u2139\uFE0F', text: 'text-blue-600' },
};

const SEVERITY_BADGE_CLASSES = {
  critical: 'bg-red-600 text-white border-red-600',
  high: 'bg-orange-500 text-white border-orange-500',
  warning: 'bg-amber-500 text-white border-amber-500',
  info: 'bg-blue-400 text-white border-blue-400',
};

const RISK_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-600' },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

export default function SpendMonitor() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const [employeeRisk, setEmployeeRisk] = useState(null);
  const [riskEmployeeId, setRiskEmployeeId] = useState('');
  const toast = useToast();

  const fetchData = () => {
    api.get('/spend-monitor/summary').then(r => setSummary(r.data)).catch(() => null);
    api.get(`/spend-monitor/alerts?unresolved_only=${!showResolved}&limit=100`).then(r => setAlerts(r.data.alerts || [])).catch(() => null);
  };

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 15000); return () => clearInterval(id); }, [showResolved]);

  const resolveAlert = async (alertId) => {
    const resolution = window.prompt('Resolution note (explain why this is OK):');
    if (!resolution) return;
    try {
      await api.post(`/spend-monitor/alerts/${alertId}/resolve`, { resolution });
      toast.success('Alert resolved');
      fetchData();
    } catch { toast.error('Failed to resolve'); }
  };

  const checkRisk = async () => {
    if (!riskEmployeeId) return;
    try {
      const res = await api.get(`/spend-monitor/risk/${riskEmployeeId}`);
      setEmployeeRisk(res.data);
    } catch { toast.error('Failed to check risk'); }
  };

  const runPatterns = async (employeeId) => {
    try {
      const res = await api.get(`/spend-monitor/patterns/${employeeId}`);
      if (res.data.alert_count > 0) {
        toast.success(`Found ${res.data.alert_count} pattern alert(s)`);
      } else {
        toast.success('No suspicious patterns detected');
      }
      fetchData();
    } catch { toast.error('Failed to analyze'); }
  };

  const filtered = alerts.filter(a => filter === 'all' || a.severity === filter);

  return (
    <div>
      <motion.div {...fadeUp} className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Spend Monitor</h2>
        <p className="text-gray-500 mt-1">Real-time employee expense monitoring, anomaly detection, and fraud prevention</p>
        <LegalDisclaimer type="spend_monitor" className="mt-3" />
      </motion.div>

      {/* Summary cards */}
      {summary && (
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{summary.employees_monitored}</p>
              <p className="text-xs text-gray-400">Employees Monitored</p>
            </CardContent>
          </Card>
          <Card className={cn(summary.critical_alerts > 0 && 'bg-red-50 border-red-200')}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={cn('text-2xl font-bold', summary.critical_alerts > 0 ? 'text-red-600' : 'text-gray-900')}>{summary.critical_alerts}</p>
              <p className="text-xs text-gray-400">Critical Alerts</p>
            </CardContent>
          </Card>
          <Card className={cn(summary.high_alerts > 0 && 'bg-orange-50 border-orange-200')}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={cn('text-2xl font-bold', summary.high_alerts > 0 ? 'text-orange-600' : 'text-gray-900')}>{summary.high_alerts}</p>
              <p className="text-xs text-gray-400">High Alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{summary.unresolved_alerts}</p>
              <p className="text-xs text-gray-400">Unresolved</p>
            </CardContent>
          </Card>
          <Card className={cn(summary.high_risk_employees > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={cn('text-2xl font-bold', summary.high_risk_employees > 0 ? 'text-red-600' : 'text-green-600')}>{summary.high_risk_employees}</p>
              <p className="text-xs text-gray-400">High-Risk Employees</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts list */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-4">
            {[['all', 'All'], ['critical', 'Critical'], ['high', 'High'], ['warning', 'Warning'], ['info', 'Info']].map(([key, label]) => (
              <Button key={key} onClick={() => setFilter(key)}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
              >
                {label} {key !== 'all' && `(${alerts.filter(a => a.severity === key).length})`}
              </Button>
            ))}
            <div className="flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} className="rounded border-gray-300" />
              Show resolved
            </label>
          </motion.div>

          {/* Alert cards */}
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.length === 0 && (
                <motion.div {...fadeUp}>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-8 pb-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-green-800">No alerts</h3>
                      <p className="text-sm text-green-600">All employee spending looks clean. We're monitoring every transaction in real-time.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {filtered.map((alert, idx) => {
                const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className={cn('border-2', style.bg, alert.resolved && 'opacity-60')}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{style.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={SEVERITY_BADGE_CLASSES[alert.severity]}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {alert.alert_type.replace(/_/g, ' ')}
                              </span>
                              {alert.resolved && <Badge variant="success">Resolved</Badge>}
                            </div>
                            <p className={cn('font-semibold text-sm', style.text)}>{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{alert.description}</p>

                            {alert.merchant && (
                              <p className="text-[10px] text-gray-400 mt-2">Merchant: {alert.merchant} &middot; ${alert.amount?.toFixed(2)}</p>
                            )}

                            {alert.resolved && (
                              <div className="mt-2 bg-white/50 rounded-lg p-2">
                                <p className="text-[10px] text-gray-500">Resolution: {alert.resolution}</p>
                                <p className="text-[10px] text-gray-400">Resolved {new Date(alert.resolved_at).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>

                          {!alert.resolved && (
                            <div className="flex flex-col gap-1">
                              <Button onClick={() => resolveAlert(alert.id)} variant="outline" size="sm" className="text-xs">
                                Resolve
                              </Button>
                              {alert.employee_id && (
                                <Button onClick={() => runPatterns(alert.employee_id)} variant="outline" size="sm" className="text-xs">
                                  Deep Scan
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="space-y-4">
          {/* Risk checker */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Employee Risk Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input value={riskEmployeeId} onChange={e => setRiskEmployeeId(e.target.value)}
                  placeholder="Employee ID" className="flex-1" />
                <Button onClick={checkRisk} size="sm">
                  Check
                </Button>
              </div>

              {employeeRisk && (
                <motion.div {...fadeUp}>
                  <div className={cn('rounded-lg p-4 text-center mb-3', RISK_COLORS[employeeRisk.level]?.bg || 'bg-gray-100')}>
                    <p className={cn('text-4xl font-bold', RISK_COLORS[employeeRisk.level]?.text || 'text-gray-700')}>
                      {employeeRisk.score}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wider mt-1">{employeeRisk.level} risk</p>
                    <Progress
                      className="mt-2 bg-white/50"
                      indicatorClassName={RISK_COLORS[employeeRisk.level]?.bar || 'bg-gray-400'}
                      value={employeeRisk.score}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center mb-3">
                    <Card className="bg-red-50 border-red-100">
                      <CardContent className="pt-2 pb-2">
                        <p className="font-bold text-red-600">{employeeRisk.by_severity?.critical || 0}</p>
                        <p className="text-[10px] text-red-400">Critical</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-100">
                      <CardContent className="pt-2 pb-2">
                        <p className="font-bold text-orange-600">{employeeRisk.by_severity?.high || 0}</p>
                        <p className="text-[10px] text-orange-400">High</p>
                      </CardContent>
                    </Card>
                  </div>

                  {employeeRisk.factors?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Risk Factors:</p>
                      {employeeRisk.factors.map((f, i) => (
                        <p key={i} className="text-xs text-gray-600 mb-0.5">- {f}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* What we detect */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">What We Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-gray-600">
                {[
                  ['Real-time', 'After-hours purchases, blacklisted merchants (liquor, gambling), over-limit transactions, rapid card splitting'],
                  ['Patterns', 'Spending velocity spikes, category drift, weekend spending, round-number transactions, duplicates'],
                  ['Behavioral', 'Maxing monthly limits, skipping receipts, high rejection rates, threshold gaming'],
                  ['Risk Score', '0-100 composite score per employee based on all alert history'],
                ].map(([title, desc]) => (
                  <div key={title}>
                    <p className="font-medium text-gray-700">{title}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blacklisted categories */}
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-800">Auto-Flagged Merchants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {['Liquor stores', 'Casinos / Gambling', 'Tobacco stores', 'Pawn shops', 'Jewelry stores', 'Personal shopping (eBay, Amazon)'].map(m => (
                  <p key={m} className="text-xs text-red-600">- {m}</p>
                ))}
              </div>
              <p className="text-[10px] text-red-400 mt-2 italic">Any transaction at these merchants triggers an immediate alert</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
