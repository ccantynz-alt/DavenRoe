import { useState } from 'react';
import { motion } from 'framer-motion';
import ProprietaryNotice from '../components/ProprietaryNotice';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

const AGENTS = [
  // Tier 1: Conductor
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    tier: 'conductor',
    description: 'Natural language → multi-agent execution. Routes any request to the right agent.',
    status: 'available',
    icon: '{}',
    tasksToday: 47,
  },
  // Tier 2: Automators — do things without human intervention
  {
    id: 'month_end_close',
    name: 'Month-End Close',
    tier: 'automator',
    description: 'Autonomous close: reconcile, adjust, report, narrate — average 4.2 seconds',
    status: 'available',
    icon: '>>',
    tasksToday: 3,
  },
  {
    id: 'compliance_monitor',
    name: 'Compliance Monitor',
    tier: 'automator',
    description: 'Tracks 40+ deadlines across AU/NZ/UK/US. Sends alerts 30, 14, and 7 days before due.',
    status: 'available',
    icon: '!!',
    tasksToday: 12,
  },
  {
    id: 'categorizer',
    name: 'Transaction Categoriser',
    tier: 'automator',
    description: 'AI-categorises bank transactions into Chart of Accounts with 95%+ accuracy',
    status: 'available',
    icon: '[]',
    tasksToday: 284,
  },
  {
    id: 'auditor',
    name: 'Audit Shield',
    tier: 'automator',
    description: 'Real-time risk scoring on every transaction. Flags anomalies for review.',
    status: 'available',
    icon: '<>',
    tasksToday: 284,
  },
  {
    id: 'bank_reconciler',
    name: 'Bank Reconciler',
    tier: 'automator',
    description: 'Automatically matches bank transactions to invoices, bills, and journal entries',
    status: 'available',
    icon: '==',
    tasksToday: 156,
  },
  {
    id: 'invoice_chaser',
    name: 'Invoice Chaser',
    tier: 'automator',
    description: 'Sends payment reminders at 7, 14, 21, and 30 days overdue. Escalates tone appropriately.',
    status: 'available',
    icon: '>>',
    tasksToday: 8,
  },
  {
    id: 'receipt_scanner',
    name: 'Receipt Scanner',
    tier: 'automator',
    description: 'OCR + AI extraction from receipts. Auto-matches to transactions and attaches documentation.',
    status: 'available',
    icon: '@@',
    tasksToday: 34,
  },
  {
    id: 'payroll_processor',
    name: 'Payroll Processor',
    tier: 'automator',
    description: 'Calculates pay runs, tax withholding, super/pension, and leave accruals for 4 jurisdictions',
    status: 'available',
    icon: '$$',
    tasksToday: 0,
  },
  {
    id: 'tax_preparer',
    name: 'Tax Return Preparer',
    tier: 'automator',
    description: 'Pre-populates BAS/GST/VAT returns from transaction data. Validates before lodgement.',
    status: 'available',
    icon: '%%',
    tasksToday: 2,
  },
  {
    id: 'document_chaser',
    name: 'Document Chaser',
    tier: 'automator',
    description: 'Emails clients for missing receipts, statements, and source documents. Escalates weekly.',
    status: 'available',
    icon: '!!',
    tasksToday: 14,
  },
  {
    id: 'support_responder',
    name: 'Support Responder',
    tier: 'automator',
    description: 'Auto-responds to support tickets using knowledge base. Resolves 78% without human intervention.',
    status: 'available',
    icon: '??',
    tasksToday: 6,
  },
  // Tier 3: Collaborators — work alongside humans, provide insights
  {
    id: 'cash_flow_forecaster',
    name: 'Cash Flow Forecaster',
    tier: 'collaborator',
    description: '13-week rolling forecast with receivables risk scoring and payment timing recommendations',
    status: 'available',
    icon: '^^',
    tasksToday: 5,
  },
  {
    id: 'narrator',
    name: 'Simple-Speak Narrator',
    tier: 'collaborator',
    description: 'Translates financial data into plain English. Powers Ask Astra and report narratives.',
    status: 'available',
    icon: '""',
    tasksToday: 22,
  },
  {
    id: 'forensic',
    name: 'Forensic Engine',
    tier: 'collaborator',
    description: "Benford's Law analysis, ghost vendor detection, transaction pattern scanning, money trail",
    status: 'available',
    icon: '?!',
    tasksToday: 1,
  },
  {
    id: 'scenario_modeller',
    name: 'Scenario Modeller',
    tier: 'collaborator',
    description: 'What-if financial projections. Simulates hires, revenue changes, new locations, pricing.',
    status: 'available',
    icon: '~~',
    tasksToday: 3,
  },
  {
    id: 'health_scorer',
    name: 'Financial Health Scorer',
    tier: 'collaborator',
    description: 'Calculates composite health score (0-100) across liquidity, profitability, efficiency, growth, risk',
    status: 'available',
    icon: '++',
    tasksToday: 8,
  },
  {
    id: 'tax_advisor',
    name: 'Tax Advisory Agent',
    tier: 'collaborator',
    description: 'DTA calculations, withholding optimisation, entity structure recommendations',
    status: 'available',
    icon: '%%',
    tasksToday: 4,
  },
  {
    id: 'vendor_intelligence',
    name: 'Vendor Intelligence',
    tier: 'collaborator',
    description: 'Benchmarks vendor pricing against platform averages. Identifies overpayment and contract renewal opportunities.',
    status: 'available',
    icon: '&&',
    tasksToday: 0,
  },
  {
    id: 'onboarding_agent',
    name: 'Onboarding Agent',
    tier: 'collaborator',
    description: 'Guides new users through setup. Imports data, connects banks, configures chart of accounts.',
    status: 'available',
    icon: '>>',
    tasksToday: 2,
  },
  // Tier 4: Strategic — deep intelligence that creates unfair competitive advantage
  {
    id: 'client_relationship',
    name: 'Client Relationship Agent',
    tier: 'collaborator',
    description: 'Tracks client engagement, flags "going cold" clients, suggests touchpoints, drafts catch-up emails. Knows when you last spoke to every client.',
    status: 'available',
    icon: '\u2665',
    tasksToday: 15,
  },
  {
    id: 'profit_optimiser',
    name: 'Profit Optimiser',
    tier: 'collaborator',
    description: 'Continuously analyses expenses for savings: unused subscriptions, overpriced vendors, tax deduction opportunities, cash timing improvements.',
    status: 'available',
    icon: '\u2191\u2191',
    tasksToday: 7,
  },
  {
    id: 'regulatory_monitor',
    name: 'Regulatory Change Monitor',
    tier: 'automator',
    description: 'Watches ATO, IRD, HMRC, IRS for rule changes. Auto-updates tax tables, alerts affected clients, and adjusts compliance calendar.',
    status: 'available',
    icon: '\u26A1',
    tasksToday: 3,
  },
  {
    id: 'comms_agent',
    name: 'Client Communications Agent',
    tier: 'automator',
    description: 'Drafts professional client emails: year-end summaries, tax reminders, fee proposals, meeting follow-ups. Matches your tone and style.',
    status: 'available',
    icon: '\u2709',
    tasksToday: 11,
  },
];

const AUTOMATIONS = [
  {
    id: 'month_end_close',
    name: 'Month-End Close',
    description: 'Run the full autonomous close pipeline for selected entity',
    steps: ['Pre-checks', 'Bank reconciliation', 'Receipt matching', 'Anomaly scan', 'Accrual detection', 'Adjusting entries', 'Depreciation', 'Trial balance', 'Reports', 'AI Narrative'],
    estimatedTime: '2-5 min',
    agents: ['bank_reconciler', 'categorizer', 'receipt_scanner', 'auditor', 'narrator'],
  },
  {
    id: 'quarterly_review',
    name: 'Quarterly Review',
    description: 'Compliance check + cash flow forecast + financial summary + health score',
    steps: ['Compliance scan', 'Cash forecast', 'Health score', 'Financial narrative', 'Action items'],
    estimatedTime: '1-3 min',
    agents: ['compliance_monitor', 'cash_flow_forecaster', 'health_scorer', 'narrator'],
  },
  {
    id: 'daily_health_check',
    name: 'Daily Health Check',
    description: 'Quick scan of compliance, cash, anomalies, and overdue invoices',
    steps: ['Compliance pulse', 'Cash position', 'Anomaly scan', 'Deadline watch', 'Overdue invoice check'],
    estimatedTime: '< 1 min',
    agents: ['compliance_monitor', 'cash_flow_forecaster', 'auditor', 'invoice_chaser'],
  },
  {
    id: 'full_forensic_sweep',
    name: 'Full Forensic Sweep',
    description: 'Complete fraud detection across all entities — Benford, vendors, journals, cash flow',
    steps: ['Benford analysis', 'Vendor risk matrix', 'Journal entry test', 'Cash flow anomalies', 'Transaction patterns', 'Report generation'],
    estimatedTime: '5-10 min',
    agents: ['forensic', 'auditor', 'narrator'],
  },
  {
    id: 'client_onboarding',
    name: 'New Client Onboarding',
    description: 'Import data, configure chart of accounts, connect bank feeds, initial categorisation',
    steps: ['Data import', 'COA mapping', 'Bank connection', 'Initial categorisation', 'Opening balances', 'Welcome email'],
    estimatedTime: '3-8 min',
    agents: ['onboarding_agent', 'categorizer', 'bank_reconciler'],
  },
  {
    id: 'tax_preparation',
    name: 'Tax Return Preparation',
    description: 'Pre-populate and validate tax returns for selected entity and period',
    steps: ['Data extraction', 'GST/VAT calculation', 'PAYG/PAYE summary', 'Validation checks', 'Draft return', 'AI review'],
    estimatedTime: '2-4 min',
    agents: ['tax_preparer', 'compliance_monitor', 'narrator'],
  },
  {
    id: 'document_chase_all',
    name: 'Chase All Missing Documents',
    description: 'Send polite \u2192 firm \u2192 urgent emails for all missing source documents across all clients',
    steps: ['Scan missing docs', 'Identify clients', 'Draft emails', 'Send reminders', 'Log activity'],
    estimatedTime: '1-2 min',
    agents: ['document_chaser'],
  },
  {
    id: 'invoice_collection_run',
    name: 'Invoice Collection Run',
    description: 'Send payment reminders for all overdue invoices, escalating based on days overdue',
    steps: ['Identify overdue', 'Classify by severity', 'Draft reminders', 'Send emails', 'Update statuses'],
    estimatedTime: '< 1 min',
    agents: ['invoice_chaser'],
  },
  {
    id: 'payroll_run',
    name: 'Payroll Processing',
    description: 'Calculate and process pay run for all active employees in selected entity',
    steps: ['Load employee data', 'Calculate gross pay', 'Tax withholding', 'Super/pension', 'Leave accruals', 'Generate payslips', 'Payment file'],
    estimatedTime: '1-3 min',
    agents: ['payroll_processor'],
  },
];

const TIER_COLORS = {
  conductor: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', label: 'Conductor' },
  automator: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Automator' },
  collaborator: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Collaborator' },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export default function AgenticDashboard() {
  const [orchestratorInput, setOrchestratorInput] = useState('');
  const [orchestratorResult, setOrchestratorResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeAutomation, setActiveAutomation] = useState(null);
  const [automationResult, setAutomationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('agents');

  const handleOrchestrate = async () => {
    if (!orchestratorInput.trim()) return;
    setLoading(true);
    setOrchestratorResult(null);
    try {
      const res = await fetch('/api/v1/agentic/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: orchestratorInput }),
      });
      const data = await res.json();
      setOrchestratorResult(data);
    } catch (err) {
      setOrchestratorResult({ error: 'Failed to reach orchestrator' });
    }
    setLoading(false);
  };

  const handleRunAutomation = async (automationId) => {
    setActiveAutomation(automationId);
    setAutomationResult(null);
    try {
      const res = await fetch(`/api/v1/agentic/automate/${automationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: localStorage.getItem('astra_active_entity') || 'default' }),
      });
      const data = await res.json();
      setAutomationResult(data);
    } catch (err) {
      setAutomationResult({ error: 'Automation failed' });
    }
    setActiveAutomation(null);
  };

  return (
    <div>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold mb-2">Agentic AI</h2>
        <p className="text-gray-500">
          Autonomous agents that work for you — not tools you operate
        </p>
      </motion.div>

      {/* Orchestrator Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono text-white">{'{}'}</span>
              <CardTitle className="text-white">Orchestrator</CardTitle>
              <Badge className="bg-purple-600 text-purple-100 border-purple-500">
                conductor
              </Badge>
            </div>
            <CardDescription className="text-gray-400">
              Describe what you need in plain English. The orchestrator dispatches the right agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="text"
                value={orchestratorInput}
                onChange={(e) => setOrchestratorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOrchestrate()}
                placeholder="e.g., Run month-end close and check compliance for all jurisdictions..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-purple-500 focus:ring-purple-500/20"
              />
              <Button
                onClick={handleOrchestrate}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white"
              >
                {loading ? 'Running...' : 'Execute'}
              </Button>
            </div>

            {orchestratorResult && (
              <div className="mt-4 bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2 font-mono">ORCHESTRATOR RESULT</p>
                <pre className="text-sm text-gray-200 overflow-auto max-h-60">
                  {JSON.stringify(orchestratorResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="font-semibold text-lg">Agent Fleet</h3>
            <div className="flex gap-2">
              {Object.entries(TIER_COLORS).map(([tier, colors]) => (
                <Badge
                  key={tier}
                  className={cn(colors.bg, colors.text, 'border-transparent')}
                >
                  {tier}
                </Badge>
              ))}
            </div>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {AGENTS.map((agent, index) => {
              const colors = TIER_COLORS[agent.tier];
              return (
                <motion.div key={agent.id} variants={fadeInUp} custom={index}>
                  <Card className="cursor-default h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-mono text-gray-400">{agent.icon}</span>
                        <Badge
                          className={cn(
                            colors.bg,
                            colors.text,
                            'border-transparent text-[10px] uppercase tracking-wider'
                          )}
                        >
                          {agent.tier}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">{agent.description}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <Badge variant="success" className="border-transparent text-xs font-medium">
                          {agent.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <h3 className="font-semibold text-lg mb-4">Pre-Built Automations</h3>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {AUTOMATIONS.map((auto, index) => (
              <motion.div key={auto.id} variants={fadeInUp} custom={index}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>{auto.name}</CardTitle>
                    <CardDescription>{auto.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Pipeline Steps
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {auto.steps.map((step, i) => (
                        <Badge key={i} variant="secondary" className="border-transparent">
                          {i + 1}. {step}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <span className="text-xs text-gray-400">Est. {auto.estimatedTime}</span>
                    <Button
                      size="sm"
                      onClick={() => handleRunAutomation(auto.id)}
                      disabled={activeAutomation === auto.id}
                    >
                      {activeAutomation === auto.id ? 'Running...' : 'Run'}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {automationResult && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Automation Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                    {JSON.stringify(automationResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          <h3 className="font-semibold text-lg mb-4">Real-Time Agent Monitor</h3>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <MonitorCard
                label="Agents Online"
                value={AGENTS.length.toString()}
                note="All agents operational"
                accent="green"
              />
            </motion.div>
            <motion.div variants={fadeInUp} custom={1}>
              <MonitorCard
                label="Jurisdictions Watched"
                value="4"
                note="US, AU, NZ, GB compliance tracked"
                accent="blue"
              />
            </motion.div>
            <motion.div variants={fadeInUp} custom={2}>
              <MonitorCard
                label="Forecast Horizon"
                value="13 wk"
                note="Rolling cash flow projection"
                accent="purple"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Agent Architecture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TierRow
                  tier="Conductor"
                  description="Parses natural language, plans multi-agent workflows, aggregates results"
                  agents={['Orchestrator']}
                  color="purple"
                />
                <TierRow
                  tier="Automators"
                  description="End-to-end process execution — these run entire workflows autonomously"
                  agents={['Month-End Close', 'Compliance Monitor', 'Categorizer', 'Audit Shield']}
                  color="blue"
                />
                <TierRow
                  tier="Collaborators"
                  description="AI + human working together — these draft, you review"
                  agents={['Cash Flow Forecaster', 'Simple-Speak', 'Forensic Engine']}
                  color="emerald"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Capability Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Capability</TableHead>
                      <TableHead className="text-center">Astra</TableHead>
                      <TableHead className="text-center">Xero</TableHead>
                      <TableHead className="text-center">QuickBooks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ['Autonomous Month-End Close', true, false, false],
                      ['Multi-Agent Orchestration', true, false, false],
                      ['Predictive Cash Forecasting', true, true, true],
                      ['Multi-Jurisdiction Compliance', true, false, false],
                      ['Treaty-Aware Tax Engine', true, false, false],
                      ['Real-Time Forensic Analysis', true, false, false],
                      ['AI Transaction Categorization', true, true, true],
                      ['Natural Language Queries', true, true, true],
                      ['12 Specialist Toolkits', true, false, false],
                      ['Immutable Audit Trail', true, false, false],
                    ].map(([cap, astra, xero, qb], i) => (
                      <TableRow key={i}>
                        <TableCell>{cap}</TableCell>
                        <TableCell className="text-center">{astra ? '\u2705' : '\u274C'}</TableCell>
                        <TableCell className="text-center">{xero ? '\u2705' : '\u274C'}</TableCell>
                        <TableCell className="text-center">{qb ? '\u2705' : '\u274C'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MonitorCard({ label, value, note, accent }) {
  const borderColors = {
    green: 'border-green-300',
    blue: 'border-blue-300',
    purple: 'border-purple-300',
  };

  return (
    <Card className={cn('border-2', borderColors[accent])}>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs text-gray-400">{note}</p>
      </CardContent>
    </Card>
  );
}

function TierRow({ tier, description, agents, color }) {
  const colorMap = {
    purple: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
    blue: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    emerald: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  };

  const colors = colorMap[color];

  return (
    <div className={cn('rounded-lg border p-4', colors.border)}>
      <div className="flex items-center gap-3 mb-2">
        <Badge className={cn(colors.badge, 'border-transparent')}>{tier}</Badge>
        <span className="text-sm text-gray-500">{description}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {agents.map((agent) => (
          <Badge key={agent} variant="outline" className="text-sm px-3 py-1 font-medium bg-white">
            {agent}
          </Badge>
        ))}
      </div>
      <ProprietaryNotice />
    </div>
  );
}
